import * as THREE from 'three';

// NBA hoop dimensions
export const RIM_HEIGHT = 3.05;             // 10 ft
export const RIM_RADIUS = 0.2286;           // 18 in diameter
export const BACKBOARD_W = 1.83;            // 6 ft
export const BACKBOARD_H = 1.07;            // 3.5 ft
const BACKBOARD_THICKNESS = 0.04;
const NET_LENGTH = 0.45;                    // ~18 in net drop

export type HoopHandle = {
  group: THREE.Group;
  /** Swish — make the net ripple when ball passes through. */
  ripple: () => void;
};

/** Build a hoop assembly. `hoopX` is the x-coord of the rim centre (±12.75). */
export function buildHoop(scene: THREE.Scene, hoopX: number): HoopHandle {
  const group = new THREE.Group();
  const sign = hoopX > 0 ? 1 : -1;          // +1 = right baseline hoop

  // ── Backboard ───────────────────────────────────────────────────
  const boardMat = new THREE.MeshLambertMaterial({
    color: 0xf3f6fb,
    transparent: true,
    opacity: 0.55,
  });
  const boardGeo = new THREE.BoxGeometry(BACKBOARD_THICKNESS, BACKBOARD_H, BACKBOARD_W);
  const board = new THREE.Mesh(boardGeo, boardMat);
  // Front face of board sits 0.30 m behind the rim centre
  board.position.set(sign * 0.30, RIM_HEIGHT + 0.30, 0);
  group.add(board);

  // Board frame + inner shooter square
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const frameLine = (w: number, h: number, x: number, y: number) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.Mesh(g, frameMat);
    m.rotation.y = -sign * Math.PI / 2;
    m.position.set(sign * (0.30 - BACKBOARD_THICKNESS / 2 - 0.002), y, x);
    group.add(m);
  };
  // Outer border (top + bottom + L + R)
  const t = 0.03;
  frameLine(BACKBOARD_W, t, 0,  RIM_HEIGHT + 0.30 + BACKBOARD_H / 2 - t / 2);
  frameLine(BACKBOARD_W, t, 0,  RIM_HEIGHT + 0.30 - BACKBOARD_H / 2 + t / 2);
  frameLine(t, BACKBOARD_H, -BACKBOARD_W / 2 + t / 2, RIM_HEIGHT + 0.30);
  frameLine(t, BACKBOARD_H,  BACKBOARD_W / 2 - t / 2, RIM_HEIGHT + 0.30);
  // Inner shooter square (0.59 × 0.45, directly above the rim)
  const sqW = 0.59, sqH = 0.45;
  frameLine(sqW, t, 0,        RIM_HEIGHT + sqH / 2);
  frameLine(sqW, t, 0,        RIM_HEIGHT + sqH - t / 2);
  frameLine(t, sqH,  sqW / 2 - t / 2,  RIM_HEIGHT + sqH / 2 + t);
  frameLine(t, sqH, -sqW / 2 + t / 2,  RIM_HEIGHT + sqH / 2 + t);

  // ── Rim ─────────────────────────────────────────────────────────
  const rimMat = new THREE.MeshLambertMaterial({ color: 0xff5a26 });
  const rimGeo = new THREE.TorusGeometry(RIM_RADIUS, 0.018, 8, 32);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, RIM_HEIGHT, 0);
  group.add(rim);

  // Bracket from board to rim
  const bracketGeo = new THREE.BoxGeometry(0.30, 0.04, 0.06);
  const bracket = new THREE.Mesh(bracketGeo, rimMat);
  bracket.position.set(sign * 0.15, RIM_HEIGHT, 0);
  group.add(bracket);

  // ── Net ─────────────────────────────────────────────────────────
  // Cylinder of 12 vertical strings tapering inward, drawn as line segments.
  const STRINGS = 12;
  const SEGMENTS = 5;
  const netGeo = new THREE.BufferGeometry();
  const positions: number[] = [];
  for (let s = 0; s < STRINGS; s++) {
    const a = (s / STRINGS) * Math.PI * 2;
    const aNext = ((s + 1) / STRINGS) * Math.PI * 2;
    for (let seg = 0; seg < SEGMENTS; seg++) {
      const tTop = seg / SEGMENTS;
      const tBot = (seg + 1) / SEGMENTS;
      // Taper: top radius = RIM_RADIUS, bottom radius = RIM_RADIUS * 0.55
      const rTop = RIM_RADIUS * (1 - tTop * 0.45);
      const rBot = RIM_RADIUS * (1 - tBot * 0.45);
      const yTop = -tTop * NET_LENGTH;
      const yBot = -tBot * NET_LENGTH;
      // Vertical-ish string segment
      positions.push(
        Math.cos(a) * rTop, yTop, Math.sin(a) * rTop,
        Math.cos(a) * rBot, yBot, Math.sin(a) * rBot,
      );
      // Diagonal cross-link to the next string (creates the diamond mesh)
      positions.push(
        Math.cos(a)     * rTop, yTop, Math.sin(a)     * rTop,
        Math.cos(aNext) * rBot, yBot, Math.sin(aNext) * rBot,
      );
    }
  }
  netGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const netMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const net = new THREE.LineSegments(netGeo, netMat);
  net.position.set(0, RIM_HEIGHT, 0);
  group.add(net);

  // ── Pole + arm (behind the baseline) ────────────────────────────
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const poleX = sign * 1.5;                  // pole sits 1.2 m behind baseline edge of board
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, RIM_HEIGHT + 0.40, 10),
    poleMat,
  );
  pole.position.set(poleX, (RIM_HEIGHT + 0.40) / 2, 0);
  group.add(pole);
  // Horizontal arm from pole to back of backboard
  const armLen = Math.abs(poleX - sign * 0.32);
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(armLen, 0.10, 0.10),
    poleMat,
  );
  arm.position.set((poleX + sign * 0.32) / 2, RIM_HEIGHT + 0.30, 0);
  group.add(arm);

  // Position whole assembly so rim centre is at (hoopX, RIM_HEIGHT, 0)
  group.position.set(hoopX, 0, 0);
  scene.add(group);

  // ── Swish ripple ────────────────────────────────────────────────
  const origNetPos = Float32Array.from(positions);
  const ripple = () => {
    const start = performance.now();
    const attr = netGeo.attributes.position as THREE.BufferAttribute;
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      if (t > 0.9) {
        attr.array.set(origNetPos);
        attr.needsUpdate = true;
        return;
      }
      const damp = Math.exp(-t * 4);
      const arr = attr.array as Float32Array;
      // Push every vertex outward radially + downward shimmy
      for (let i = 0; i < arr.length; i += 3) {
        const ox = origNetPos[i];
        const oy = origNetPos[i + 1];
        const oz = origNetPos[i + 2];
        const depthT = Math.min(1, -oy / NET_LENGTH);     // 0 at rim, 1 at bottom
        const swell = Math.sin(t * 22 + depthT * 6) * damp * 0.05 * (0.3 + depthT);
        const r = Math.hypot(ox, oz);
        const nx = r > 0 ? ox / r : 0;
        const nz = r > 0 ? oz / r : 0;
        arr[i]     = ox + nx * swell;
        arr[i + 1] = oy + Math.sin(t * 30 + depthT * 4) * damp * 0.02 * depthT;
        arr[i + 2] = oz + nz * swell;
      }
      attr.needsUpdate = true;
      requestAnimationFrame(animate);
    };
    animate();
  };

  return { group, ripple };
}
