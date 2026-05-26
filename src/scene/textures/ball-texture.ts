import * as THREE from 'three';

/** Procedural basketball texture — orange leather with curved black seams. */
export function makeBasketballTexture(): THREE.CanvasTexture {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Leather base ──────────────────────────────────────────────────
  ctx.fillStyle = '#d2691e';
  ctx.fillRect(0, 0, W, H);

  // Radial-ish tone variation across the U-axis to fake lighting
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#b85c1a');
  grad.addColorStop(0.5, '#dd7a2a');
  grad.addColorStop(1,   '#a44e15');
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // Pebble grain — dense fine speckle
  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    data[i]     = Math.max(0, Math.min(255, data[i]     + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n * 0.75));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 0.5));
  }
  ctx.putImageData(img, 0, 0);

  // Tiny pebble dots
  ctx.fillStyle = 'rgba(60, 25, 8, 0.35)';
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // ── Seams ─────────────────────────────────────────────────────────
  // A basketball has 8 panels formed by two great circles + two curved seams.
  // Across a sphere UV (u: 0..1 longitude, v: 0..1 latitude), the seams that
  // look right are:
  //   - vertical line at u = 0.5      (one great circle, side-on)
  //   - horizontal line at v = 0.5    (the equator)
  //   - two curved seams that arc from pole to pole on the visible hemisphere
  ctx.strokeStyle = '#2a1408';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Vertical great circle (centre of canvas)
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();

  // Equator
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Two curved seams that sweep across the panels — sine-shaped, peak at v=0.5
  for (const phase of [0.25, 0.75]) {
    ctx.beginPath();
    const cx = phase * W;
    // Curve runs full height; amplitude ~W/8 produces the basketball-panel look
    for (let v = 0; v <= H; v += 4) {
      const t = v / H;                             // 0..1
      const env = Math.sin(t * Math.PI);           // 0 at poles, 1 at equator
      const x = cx + env * (W / 7) * (phase < 0.5 ? -1 : 1);
      if (v === 0) ctx.moveTo(x, v);
      else ctx.lineTo(x, v);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}
