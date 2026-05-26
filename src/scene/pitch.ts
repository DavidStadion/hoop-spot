import * as THREE from 'three';
import { makePitchTexture } from './textures/pitch-texture';

export function buildPitch(variant?: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(110, 60);
  const mat = new THREE.MeshLambertMaterial({ map: makePitchTexture(variant) });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
