import * as THREE from 'three';

const MAX_POINTS = 2000;

export class Trail {
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private posArray: Float32Array;
  private colorArray: Float32Array;
  private isDribbleArray: Uint8Array; // 1 = dribble segment, 0 = pass
  private count = 0;

  constructor(scene: THREE.Scene) {
    this.posArray = new Float32Array(MAX_POINTS * 3);
    this.colorArray = new Float32Array(MAX_POINTS * 3);
    this.isDribbleArray = new Uint8Array(MAX_POINTS);

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.posArray, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colorArray, 3));
    this.geo.setDrawRange(0, 0);

    const mat = new THREE.PointsMaterial({
      size: 0.55,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  addPoint(x: number, y: number, z: number, dribble = false) {
    if (this.count >= MAX_POINTS) return;

    const i = this.count * 3;
    this.posArray[i]     = x;
    this.posArray[i + 1] = y;
    this.posArray[i + 2] = z;
    this.isDribbleArray[this.count] = dribble ? 1 : 0;

    // Dribble = green-tinted; pass = white
    if (dribble) {
      this.colorArray[i]     = 0.1;
      this.colorArray[i + 1] = 0.9;
      this.colorArray[i + 2] = 0.45;
    } else {
      this.colorArray[i]     = 0.9;
      this.colorArray[i + 1] = 0.9;
      this.colorArray[i + 2] = 0.9;
    }

    this.count++;
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    this.geo.setDrawRange(0, this.count);
  }

  private frozen = false;

  freeze() { this.frozen = true; }
  unfreeze() { this.frozen = false; }

  updateFade() {
    if (this.frozen) return;
    const col = this.geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      const age = (i / Math.max(this.count - 1, 1));
      const b = 0.25 + age * 0.75;
      if (this.isDribbleArray[i]) {
        col.setXYZ(i, b * 0.1, b * 0.95, b * 0.45);
      } else {
        col.setXYZ(i, b, b, b);
      }
    }
    col.needsUpdate = true;
  }

  clear() {
    this.frozen = false;
    this.count = 0;
    this.geo.setDrawRange(0, 0);
  }
}
