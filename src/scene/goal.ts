import * as THREE from 'three';

export type GoalHandle = {
  group: THREE.Group;
  ripple: () => void;
};

export function buildGoal(scene: THREE.Scene, goalX: number): GoalHandle {
  const group = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const postR = 0.10;
  const GW = 7.32;
  const GH = 2.44;
  const ND = 2.2;

  const postGeo = new THREE.CylinderGeometry(postR, postR, GH, 8);
  const crossGeo = new THREE.CylinderGeometry(postR, postR, GW + postR * 2, 8);

  const lPost = new THREE.Mesh(postGeo, white);
  lPost.position.set(0, GH / 2, -GW / 2);
  group.add(lPost);

  const rPost = new THREE.Mesh(postGeo, white);
  rPost.position.set(0, GH / 2, GW / 2);
  group.add(rPost);

  const bar = new THREE.Mesh(crossGeo, white);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0, GH, 0);
  group.add(bar);

  const netMat = (opacity = 0.2) =>
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      wireframe: true,
    });

  const sign = goalX > 0 ? 1 : -1;

  const backGeo = new THREE.PlaneGeometry(ND, GH, 10, 7);
  const backNet = new THREE.Mesh(backGeo, netMat(0.25));
  backNet.rotation.y = Math.PI / 2;
  backNet.position.set(-sign * ND / 2, GH / 2, 0);
  group.add(backNet);

  const topGeo = new THREE.PlaneGeometry(ND, GW, 10, 7);
  const topNet = new THREE.Mesh(topGeo, netMat());
  topNet.rotation.x = Math.PI / 2;
  topNet.position.set(-sign * ND / 2, GH, 0);
  group.add(topNet);

  for (const zSign of [-1, 1]) {
    const sideGeo = new THREE.PlaneGeometry(ND, GH, 10, 7);
    const sideNet = new THREE.Mesh(sideGeo, netMat());
    sideNet.rotation.y = Math.PI / 2;
    sideNet.position.set(-sign * ND / 2, GH / 2, zSign * GW / 2);
    group.add(sideNet);
  }

  group.position.set(goalX, 0, 0);
  scene.add(group);

  // Damped sine ripple on back net geometry
  const origPositions = Float32Array.from(backGeo.attributes.position.array as Float32Array);
  const ripple = () => {
    const start = performance.now();
    const pos = backGeo.attributes.position as THREE.BufferAttribute;
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      if (t > 0.85) {
        pos.array.set(origPositions);
        pos.needsUpdate = true;
        return;
      }
      const damp = Math.exp(-t * 3.5);
      for (let i = 0; i < pos.count; i++) {
        const orig = origPositions[i * 3];
        const wave = Math.sin(t * 18 + i * 0.8) * damp * 0.32;
        (pos.array as Float32Array)[i * 3] = orig + wave;
      }
      pos.needsUpdate = true;
      requestAnimationFrame(animate);
    };
    animate();
  };

  return { group, ripple };
}
