import * as THREE from 'three';
import type { Trail } from './trail';
import { makeBasketballTexture } from './textures/ball-texture';

// NBA basketball: 24.26 cm diameter → 0.1213 m radius.
// The rim has 0.2286 m radius, so the ball is comfortably smaller than the hoop.
export const BALL_RADIUS = 0.122;

export class Ball {
  mesh: THREE.Mesh;
  dribbling = false;
  // Spin state — accumulates so seams visibly rotate as the ball moves.
  private spin = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 28, 20);
    const mat = new THREE.MeshLambertMaterial({
      map: makeBasketballTexture(),
      color: 0xffffff,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  place(x: number, z: number) {
    this.mesh.position.set(x, BALL_RADIUS, z);
    this.mesh.visible = true;
  }

  async move(
    from: { x: number; z: number },
    to: { x: number; z: number },
    ms: number,
    arcHeight: number,
    trail?: Trail,
    endY = BALL_RADIUS,
    dribble = false,
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      trail?.addPoint(from.x, BALL_RADIUS, from.z, dribble);
      this.dribbling = dribble;
      const startSpin = this.spin;
      // Spin scales with travel distance — longer pass = more revolutions.
      const segDist = Math.hypot(to.x - from.x, to.z - from.z);
      const revolutions = dribble ? 2.5 : Math.min(6, 1 + segDist * 0.25);
      const totalSpin = revolutions * Math.PI * 2;
      // Spin axis: roughly perpendicular to travel direction so seams roll forward.
      const dirX = (to.x - from.x) / Math.max(0.0001, segDist);
      const dirZ = (to.z - from.z) / Math.max(0.0001, segDist);
      const axis = new THREE.Vector3(-dirZ, 0, dirX).normalize();

      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / ms, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const x = from.x + (to.x - from.x) * ease;
        const z = from.z + (to.z - from.z) * ease;
        const y = BALL_RADIUS + (endY - BALL_RADIUS) * ease + Math.sin(ease * Math.PI) * arcHeight;
        this.mesh.position.set(x, y, z);

        // Apply rolling spin
        const targetSpin = startSpin + totalSpin * ease;
        const delta = targetSpin - this.spin;
        this.spin = targetSpin;
        this.mesh.rotateOnWorldAxis(axis, delta);

        trail?.addPoint(x, y, z, dribble);
        if (t < 1) requestAnimationFrame(tick);
        else { this.dribbling = false; resolve(); }
      };
      tick();
    });
  }

  hide() {
    this.mesh.visible = false;
  }
}
