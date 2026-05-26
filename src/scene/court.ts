import * as THREE from 'three';
import { makeCourtTexture } from './textures/court-texture';

// NBA dimensions — 94 ft × 50 ft
export const COURT_WIDTH = 28.65;
export const COURT_HEIGHT = 15.24;
export const COURT_HALF_X = COURT_WIDTH / 2;   // 14.325
export const COURT_HALF_Z = COURT_HEIGHT / 2;  // 7.62

export function buildCourt(variant?: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(COURT_WIDTH, COURT_HEIGHT);
  const mat = new THREE.MeshLambertMaterial({ map: makeCourtTexture(variant) });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
