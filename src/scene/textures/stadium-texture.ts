import * as THREE from 'three';

export function makeStadiumTexture(): THREE.CanvasTexture {
  const W = 2048, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Sky-to-stand gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a1828');
  grad.addColorStop(0.55, '#1f3a5a');
  grad.addColorStop(1, '#243b55');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Crowd specks
  const rng = mulberry32(0xdeadbeef);
  for (let i = 0; i < 3500; i++) {
    const x = rng() * W;
    const y = H * 0.3 + rng() * H * 0.65;
    const r = 1.5 + rng() * 1.5;
    const bright = 0.4 + rng() * 0.4;
    ctx.fillStyle = `rgba(${Math.round(bright*200)},${Math.round(bright*210)},${Math.round(bright*230)},${0.6 + rng()*0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floodlight glows (14 evenly distributed)
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * W + (W / 28);
    const y = H * 0.08;
    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, 60);
    radGrad.addColorStop(0, 'rgba(255,255,220,0.55)');
    radGrad.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();

    // Light shaft
    ctx.strokeStyle = 'rgba(255,255,200,0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 30, H);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export function makeBoardTexture(): THREE.CanvasTexture {
  const W = 1024, H = 64;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#001a44';
  ctx.fillRect(0, 0, W, H);

  ctx.font = `bold ${H * 0.72}px 'Arial', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const word = '  GOALSPOT  ';
  const repeats = 10;
  for (let i = 0; i < repeats; i++) {
    ctx.fillText(word, i * (W / repeats) * 1.1, H / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(9, 1);
  return tex;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
