import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildPitch } from './pitch';
import { buildStadium } from './stadium';
import { buildGoal } from './goal';
import { Ball } from './ball';
import { Trail } from './trail';
import { Animator } from './animator';
import { DYNAMIC_SHOTS, getBirdsEyeShot } from './cameras';
import { getSettings } from '../store/settingsStore';

type ParticleSystem = {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.PointsMaterial;
  velocities: Float32Array;
  expiresAt: number;
  duration: number;
};

export class Scene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  private threeScene: THREE.Scene;
  private rafId = 0;
  private backdropBoardTex: THREE.Texture | null = null;
  private ledBoardTextures: THREE.Texture[] = [];
  private pitchMesh: THREE.Mesh | null = null;
  private lastPitchVariant = -1;
  private ball!: Ball;
  private trail!: Trail;
  animator!: Animator;

  private lookTarget = new THREE.Vector3(0, 2, 0);
  private shakeUntil = 0;
  private shakeAmp = 0;
  private particles: ParticleSystem[] = [];

  private orbitControls: OrbitControls | null = null;
  private exploreActive = false;

  // Slow camera circle during the 3-2-1 countdown
  private idleOrbitActive = false;
  private idleOrbitStart = 0;
  // Cinematic fly-in (used by goals tagged with 'flyIn')
  private flyInActive = false;
  private flyInTarget: { x: number; z: number } = { x: 0, z: 0 };

  private crowdFlashes: { x: number; y: number; phase: number; speed: number }[] = [];
  private crowdFlashCanvas: HTMLCanvasElement | null = null;
  private crowdFlashTex: THREE.CanvasTexture | null = null;
  private lastFlashUpdate = 0;

  // Whip-pan: when activeShotType changes, briefly boost camera lerp speed.
  private lastShotType: string | null = null;
  private whipPanUntil = 0;

  // Stadium lighting refs (so we can re-tint per goal)
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;

  // Rain
  private rain: { points: THREE.Points; geo: THREE.BufferGeometry; mat: THREE.PointsMaterial; vel: Float32Array } | null = null;

  // Dribble dust particles (ring buffer)
  private dustGeo: THREE.BufferGeometry | null = null;
  private dustMat: THREE.PointsMaterial | null = null;
  private dustPositions: Float32Array | null = null;
  private dustVelocities: Float32Array | null = null;
  private dustLife: Float32Array | null = null;        // remaining life in seconds
  private dustHead = 0;                                // ring buffer index
  private dustCount = 0;                               // total slots
  private dustEmitAccumulator = 0;                     // ms since last spawn

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 500);
    this.camera.position.set(0, 42, 88);
    this.camera.lookAt(0, 0, 0);

    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(0x0a1828);
    this.threeScene.fog = new THREE.Fog(0x0a1828, 120, 230);

    this.buildScene();
  }

  startIdleOrbit() {
    this.idleOrbitActive = true;
    this.idleOrbitStart = performance.now();
    this.flyInActive = false;
  }

  stopIdleOrbit() {
    this.idleOrbitActive = false;
  }

  startFlyIn(x: number, z: number) {
    this.flyInActive = true;
    this.flyInTarget = { x, z };
    this.idleOrbitActive = false;
    // Snap the camera to the high start position instantly so it actually flies in
    this.camera.position.set(x * 0.4, 140, z * 0.4 + 40);
    this.lookTarget.set(x, 0, z);
  }

  stopFlyIn() {
    this.flyInActive = false;
  }

  enableExplore() {
    if (!this.orbitControls) return;
    this.orbitControls.target.set(8, 0, 0);
    this.orbitControls.update();
    this.orbitControls.enabled = true;
    this.exploreActive = true;
  }

  disableExplore() {
    if (!this.orbitControls) return;
    this.orbitControls.enabled = false;
    this.exploreActive = false;
  }

  freezeTrail() { this.trail?.freeze(); }

  applyAtmosphere(lighting: 'day' | 'night' | 'golden' | 'dusk' | 'overcast' = 'day',
                  weather:  'clear' | 'rain' = 'clear') {
    // ── Lighting palettes ─────────────────────────────────────────
    // All palettes are tuned to keep the pitch bright + readable.
    // Atmosphere comes from the sky tint and sun colour, not by dimming the light.
    const palettes: Record<string, { amb: number; ambI: number; sun: number; sunI: number; fill: number; fillI: number; bg: number; fogNear: number; fogFar: number; }> = {
      day:      { amb: 0xffffff, ambI: 0.70, sun: 0xffffff, sunI: 1.25, fill: 0x4466aa, fillI: 0.30, bg: 0x0a1828, fogNear: 140, fogFar: 260 },
      night:    { amb: 0xa8b8d0, ambI: 0.85, sun: 0xfff2c0, sunI: 1.40, fill: 0x4a6098, fillI: 0.42, bg: 0x081428, fogNear: 130, fogFar: 250 },
      golden:   { amb: 0xffd0a0, ambI: 0.85, sun: 0xffe0b0, sunI: 1.55, fill: 0xff9966, fillI: 0.42, bg: 0x2e1f15, fogNear: 130, fogFar: 260 },
      dusk:     { amb: 0xe8c6d0, ambI: 0.80, sun: 0xffb090, sunI: 1.35, fill: 0x8a6ab0, fillI: 0.40, bg: 0x251a36, fogNear: 130, fogFar: 250 },
      overcast: { amb: 0xe8ecf0, ambI: 0.95, sun: 0xf0f4f8, sunI: 1.05, fill: 0xa0a8b4, fillI: 0.40, bg: 0x1a2230, fogNear: 120, fogFar: 240 },
    };
    const p = palettes[lighting] ?? palettes.day;

    this.ambientLight?.color.setHex(p.amb);
    if (this.ambientLight) this.ambientLight.intensity = p.ambI;
    this.sunLight?.color.setHex(p.sun);
    if (this.sunLight) this.sunLight.intensity = p.sunI;
    this.fillLight?.color.setHex(p.fill);
    if (this.fillLight) this.fillLight.intensity = p.fillI;

    this.threeScene.background = new THREE.Color(p.bg);
    this.threeScene.fog = new THREE.Fog(p.bg, p.fogNear, p.fogFar);

    // ── Weather ───────────────────────────────────────────────────
    this.setRain(weather === 'rain');
  }

  private setRain(active: boolean) {
    if (active && !this.rain) {
      const count = 1400;
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 140;
        positions[i * 3 + 1] = Math.random() * 70;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
        velocities[i] = 38 + Math.random() * 18; // m/s downward
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xc8d6e6,
        size: 0.45,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      this.threeScene.add(points);
      this.rain = { points, geo, mat, vel: velocities };
    } else if (!active && this.rain) {
      this.threeScene.remove(this.rain.points);
      this.rain.geo.dispose();
      this.rain.mat.dispose();
      this.rain = null;
    }
  }

  private updateDribbleDust(dt: number, ms: number) {
    if (!this.dustGeo || !this.dustPositions || !this.dustVelocities || !this.dustLife) return;

    const enabled = getSettings().dribbleTrail;

    // Emit particles while ball is dribbling (every ~28 ms)
    if (enabled && this.ball.dribbling && this.ball.mesh.visible) {
      this.dustEmitAccumulator += ms;
      while (this.dustEmitAccumulator >= 28) {
        this.dustEmitAccumulator -= 28;
        const i = this.dustHead;
        const bp = this.ball.mesh.position;
        // Spawn just behind ball with small random spread
        this.dustPositions[i * 3]     = bp.x + (Math.random() - 0.5) * 0.4;
        this.dustPositions[i * 3 + 1] = 0.12 + Math.random() * 0.18;
        this.dustPositions[i * 3 + 2] = bp.z + (Math.random() - 0.5) * 0.4;
        this.dustVelocities[i * 3]     = (Math.random() - 0.5) * 1.4;
        this.dustVelocities[i * 3 + 1] = 0.6 + Math.random() * 0.7;
        this.dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
        this.dustLife[i] = 0.55 + Math.random() * 0.25;
        this.dustHead = (i + 1) % this.dustCount;
      }
    }

    // Advance all live particles
    for (let i = 0; i < this.dustCount; i++) {
      if (this.dustLife[i] <= 0) continue;
      this.dustLife[i] -= dt;
      this.dustPositions[i * 3]     += this.dustVelocities[i * 3]     * dt;
      this.dustPositions[i * 3 + 1] += this.dustVelocities[i * 3 + 1] * dt;
      this.dustPositions[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * dt;
      // Light gravity + drag
      this.dustVelocities[i * 3 + 1] -= 1.4 * dt;
      this.dustVelocities[i * 3]     *= 0.94;
      this.dustVelocities[i * 3 + 2] *= 0.94;
      if (this.dustLife[i] <= 0) {
        // Park below pitch when expired
        this.dustPositions[i * 3 + 1] = -100;
      }
    }
    (this.dustGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateRain(dt: number) {
    if (!this.rain) return;
    const pos = this.rain.geo.attributes.position.array as Float32Array;
    const vel = this.rain.vel;
    const count = vel.length;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= vel[i] * dt;
      // Slight wind drift on x
      pos[i * 3] += 4 * dt;
      if (pos[i * 3 + 1] < 0) {
        // Reset drop above scene
        pos[i * 3]     = (Math.random() - 0.5) * 140;
        pos[i * 3 + 1] = 60 + Math.random() * 20;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
      }
      if (pos[i * 3] > 80) pos[i * 3] -= 160;
    }
    this.rain.geo.attributes.position.needsUpdate = true;
  }

  refreshPitch() {
    // Pick a new variant that isn't the same as last time
    const VARIANTS = 6;
    let variant = Math.floor(Math.random() * VARIANTS);
    if (this.lastPitchVariant >= 0 && variant === this.lastPitchVariant) {
      variant = (variant + 1) % VARIANTS;
    }
    this.lastPitchVariant = variant;

    if (this.pitchMesh) {
      this.threeScene.remove(this.pitchMesh);
      this.pitchMesh.geometry.dispose();
      const mat = this.pitchMesh.material as THREE.MeshLambertMaterial;
      mat.map?.dispose();
      mat.dispose();
    }
    this.pitchMesh = buildPitch(variant);
    this.threeScene.add(this.pitchMesh);
  }

  triggerShake(durationMs = 380, amplitude = 0.4) {
    this.shakeUntil = performance.now() + durationMs;
    this.shakeAmp = amplitude;
  }

  triggerGoalBurst(x: number, z: number) {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = [0x00d66b, 0xffffff, 0xffd700, 0x4fc3f7];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = x + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = 1 + Math.random() * 2;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 4;
      velocities[i * 3]     = (Math.random() - 0.5) * 10;
      velocities[i * 3 + 1] = Math.random() * 14 + 5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.PointsMaterial({ color, size: 0.38, transparent: true, opacity: 1, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    this.threeScene.add(points);
    const duration = 1600;
    this.particles.push({ points, geo, mat, velocities, expiresAt: performance.now() + duration, duration });
  }

  private buildScene() {
    const s = this.threeScene;
    this.refreshPitch();
    const { backdropBoardTex, ledBoardTextures } = buildStadium(s);
    this.backdropBoardTex = backdropBoardTex;
    this.ledBoardTextures = ledBoardTextures;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    s.add(this.ambientLight);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.sunLight.position.set(20, 60, 40);
    s.add(this.sunLight);
    this.fillLight = new THREE.DirectionalLight(0x4466aa, 0.28);
    this.fillLight.position.set(-30, 20, -20);
    s.add(this.fillLight);

    this.ball = new Ball(s);
    this.trail = new Trail(s);

    // ── Dribble dust particle system ───────────────────────────────
    const DUST_COUNT = 220;
    this.dustCount = DUST_COUNT;
    this.dustPositions  = new Float32Array(DUST_COUNT * 3);
    this.dustVelocities = new Float32Array(DUST_COUNT * 3);
    this.dustLife       = new Float32Array(DUST_COUNT);
    // Park all particles below the pitch initially
    for (let i = 0; i < DUST_COUNT; i++) this.dustPositions[i * 3 + 1] = -100;
    this.dustGeo = new THREE.BufferGeometry();
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: 0x9be7a6,
      size: 0.42,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(this.dustGeo, this.dustMat);
    dust.frustumCulled = false;
    s.add(dust);
    const goalHandles = new Map([
      [ 55, buildGoal(s,  55)],
      [-55, buildGoal(s, -55)],
    ]);
    this.animator = new Animator(this.ball, goalHandles, this.trail);

    // Crowd camera-flash overlay
    const flashCanvas = document.createElement('canvas');
    flashCanvas.width = 2048;
    flashCanvas.height = 512;
    this.crowdFlashCanvas = flashCanvas;
    const flashTex = new THREE.CanvasTexture(flashCanvas);
    this.crowdFlashTex = flashTex;

    for (let i = 0; i < 80; i++) {
      this.crowdFlashes.push({
        x: Math.random(),
        // Distribute across upper 80% of texture — bottom 20% stays dim
        // so the flash strip's lower edge doesn't bleed onto boards/skirt
        y: 0.05 + Math.random() * 0.75,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 2.4,
      });
    }

    // Flash cylinder sits just above the perimeter boards (boards top at y≈2.4)
    // and covers the crowd area visible at typical camera heights.
    // Radius 100 keeps it inside the backdrop (r=105) so no z-fighting.
    const flashGeo = new THREE.CylinderGeometry(100, 100, 28, 64, 1, true);
    const flashMat = new THREE.MeshBasicMaterial({
      map: flashTex,
      transparent: true,
      opacity: 1,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.y = 17;   // spans y=3 to y=31 — just above boards, covering crowd
    flashMesh.renderOrder = 1;
    s.add(flashMesh);
  }

  private crowdFlashesCleared = false;
  private clearCrowdFlashes() {
    if (this.crowdFlashesCleared) return;
    const canvas = this.crowdFlashCanvas;
    const tex = this.crowdFlashTex;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tex.needsUpdate = true;
    this.crowdFlashesCleared = true;
  }

  private updateCrowdFlashes(t: number) {
    this.crowdFlashesCleared = false;
    if (t - this.lastFlashUpdate < 150) return;
    this.lastFlashUpdate = t;

    const canvas = this.crowdFlashCanvas;
    const tex = this.crowdFlashTex;
    if (!canvas || !tex) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ts = t * 0.001; // seconds
    for (const f of this.crowdFlashes) {
      const s = Math.sin(ts * f.speed + f.phase);
      if (s < 0.92) continue;
      // Soft fade for flashes very near the bottom edge of the cylinder
      const verticalFade = f.y < 0.78 ? 1 : Math.max(0, 1 - (f.y - 0.78) / 0.07);
      const brightness = ((s - 0.92) / 0.08) * verticalFade;
      if (brightness <= 0) continue;
      const px = f.x * canvas.width;
      const py = f.y * canvas.height;
      const r = 2 + brightness * 3;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
      grad.addColorStop(0, `rgba(255,255,240,${brightness * 0.9})`);
      grad.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    tex.needsUpdate = true;
  }

  mount(container: HTMLElement) {
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // OrbitControls created here so domElement is the canvas
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enabled = false;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 160;
    this.orbitControls.minPolarAngle = 0.1;
    this.orbitControls.maxPolarAngle = Math.PI / 2.1;
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;

    let lastTime = performance.now();
    let rafId = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      this.rafId = rafId;
      const now = performance.now();
      const rawDtMs = now - lastTime;
      const dt = Math.min(rawDtMs / 1000, 0.1);
      lastTime = now;

      if (this.backdropBoardTex) this.backdropBoardTex.offset.x -= 0.0007;
      // Scroll the pitch-side LED boards (faster — like real rotating-LED ads)
      for (const tex of this.ledBoardTextures) tex.offset.x -= 0.0012;
      this.trail?.updateFade();
      const settings = getSettings();
      if (settings.crowdFlashes) {
        this.updateCrowdFlashes(now);
      } else {
        this.clearCrowdFlashes();
      }
      this.updateRain(dt);
      this.updateDribbleDust(dt, rawDtMs);

      const anim = this.animator;
      const ballPos = this.ball.mesh.position;
      const ballVisible = this.ball.mesh.visible;

      if (this.exploreActive) {
        // OrbitControls drives the camera
        this.orbitControls!.update();
      } else if (this.flyInActive && !ballVisible) {
        // Cinematic descent: from 140m up down to the starting waypoint over countdown
        const tgt = this.flyInTarget;
        const desiredPos = new THREE.Vector3(tgt.x - 8, 22, tgt.z + 30);
        const desiredLook = new THREE.Vector3(tgt.x, 1, tgt.z);
        this.camera.position.lerp(desiredPos, dt * 1.0);
        this.lookTarget.lerp(desiredLook, dt * 1.8);
        this.camera.lookAt(this.lookTarget);
      } else if (this.idleOrbitActive && !ballVisible) {
        // Slow circular orbit around the pitch (used during the 3-2-1 countdown)
        const elapsed = (now - this.idleOrbitStart) / 1000;
        const radius = 78;
        const height = 26;
        // Full rotation every 28s — gentle, broadcast-style
        const angle = (elapsed / 28) * Math.PI * 2;
        const targetX = Math.cos(angle) * radius;
        const targetZ = Math.sin(angle) * radius;
        const desiredPos = new THREE.Vector3(targetX, height, targetZ);
        const desiredLook = new THREE.Vector3(0, 1.2, 0);
        // Smooth lerp so the camera always feels alive but not jumpy
        this.camera.position.lerp(desiredPos, dt * 1.4);
        this.lookTarget.lerp(desiredLook, dt * 1.8);
        this.camera.lookAt(this.lookTarget);
      } else if (ballVisible && anim.birdsEyeActive) {
        const target = getBirdsEyeShot(anim.attackingGoalX);
        this.camera.position.lerp(target.pos, dt * 1.8);
        this.lookTarget.lerp(target.look, dt * 2);
        this.camera.lookAt(this.lookTarget);
      } else if (ballVisible && anim.activeShotType) {
        // Detect shot change → trigger whip-pan window (if enabled)
        if (anim.activeShotType !== this.lastShotType) {
          this.lastShotType = anim.activeShotType;
          if (settings.whipPan) this.whipPanUntil = now + 280;
        }
        const shot = DYNAMIC_SHOTS[anim.activeShotType];
        const desired = shot.compute(ballPos, anim.attackingGoalX);
        // During whip-pan window: boost lerp 2.6× so the camera swings then settles
        const whipBoost = settings.whipPan && now < this.whipPanUntil
          ? 1 + 1.6 * ((this.whipPanUntil - now) / 280)
          : 1;
        this.camera.position.lerp(desired.pos, dt * shot.posSpeed * whipBoost);
        this.lookTarget.lerp(desired.look, dt * shot.lookSpeed * whipBoost);
        this.camera.lookAt(this.lookTarget);
      }

      // Camera shake
      if (now < this.shakeUntil) {
        const t = (this.shakeUntil - now) / 380;
        const amp = this.shakeAmp * t;
        this.camera.position.x += (Math.random() - 0.5) * amp * 2;
        this.camera.position.y += (Math.random() - 0.5) * amp;
      }

      // Particle systems
      this.particles = this.particles.filter((p) => {
        if (now > p.expiresAt) {
          this.threeScene.remove(p.points);
          p.geo.dispose(); p.mat.dispose();
          return false;
        }
        const pos = p.geo.attributes.position.array as Float32Array;
        const count = pos.length / 3;
        for (let i = 0; i < count; i++) {
          pos[i * 3]     += p.velocities[i * 3]     * dt;
          pos[i * 3 + 1] += p.velocities[i * 3 + 1] * dt;
          pos[i * 3 + 2] += p.velocities[i * 3 + 2] * dt;
          p.velocities[i * 3 + 1] -= 16 * dt;
        }
        p.geo.attributes.position.needsUpdate = true;
        p.mat.opacity = (p.expiresAt - now) / p.duration;
        return true;
      });

      this.renderer.render(this.threeScene, this.camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      this.orbitControls?.dispose();
    };
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.orbitControls?.dispose();
    this.threeScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m: THREE.Material) => m.dispose());
      }
    });
  }
}
