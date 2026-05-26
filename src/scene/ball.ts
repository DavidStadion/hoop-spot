import * as THREE from 'three';
import type { Trail } from './trail';

export class Ball {
  mesh: THREE.Mesh;
  dribbling = false;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(0.32, 14, 10);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  place(x: number, z: number) {
    this.mesh.position.set(x, 0.32, z);
    this.mesh.visible = true;
  }

  async move(
    from: { x: number; z: number },
    to: { x: number; z: number },
    ms: number,
    arcHeight: number,
    trail?: Trail,
    endY = 0.32,
    dribble = false,
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      trail?.addPoint(from.x, 0.32, from.z, dribble);
      this.dribbling = dribble;

      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / ms, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const x = from.x + (to.x - from.x) * ease;
        const z = from.z + (to.z - from.z) * ease;
        const y = 0.32 + (endY - 0.32) * ease + Math.sin(ease * Math.PI) * arcHeight;
        this.mesh.position.set(x, y, z);
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
