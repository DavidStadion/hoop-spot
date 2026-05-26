import * as THREE from 'three';

export function makePitchTexture(variant = 0): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Base fill (so any variant always has a green base)
  ctx.fillStyle = '#3d9c4a';
  ctx.fillRect(0, 0, W, H);

  // ── Mow pattern ──────────────────────────────────────────────────
  const dark   = '#358a40';
  const light  = '#54bd62';
  const darker = '#2d7837';   // for criss-cross overlap

  if (variant === 1) {
    // Horizontal stripes (18 rows)
    for (let i = 0; i < 18; i++) {
      const y = (i / 18) * H;
      ctx.fillStyle = i % 2 === 0 ? dark : light;
      ctx.fillRect(0, y, W, H / 18);
    }
  } else if (variant === 2) {
    // Diagonal — diamond mow
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI / 4);
    const span = Math.hypot(W, H);
    const stripeH = span / 18;
    for (let i = -9; i < 9; i++) {
      ctx.fillStyle = i % 2 === 0 ? dark : light;
      ctx.fillRect(-span / 2, i * stripeH, span, stripeH);
    }
    ctx.restore();
  } else if (variant === 3) {
    // Criss-cross — vertical stripes overlaid with horizontal stripes
    // (Classic Wembley/Old Trafford "tartan" look)
    for (let i = 0; i < 20; i++) {
      const x = (i / 20) * W;
      ctx.fillStyle = i % 2 === 0 ? dark : light;
      ctx.fillRect(x, 0, W / 20, H);
    }
    // Multiply-blend horizontal bands on top using semi-transparent overlay
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 12; i++) {
      const y = (i / 12) * H;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(220,255,220,1)'; // lift even rows
      } else {
        ctx.fillStyle = 'rgba(170,210,170,1)'; // darken odd rows
      }
      ctx.fillRect(0, y, W, H / 12);
    }
    ctx.globalCompositeOperation = 'source-over';
  } else if (variant === 4) {
    // Circular — concentric mow rings from the centre circle outward
    // (Looks like a freshly cut showcase pitch)
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.hypot(cx, cy);
    const ringW = maxR / 14;
    for (let i = 14; i >= 0; i--) {
      ctx.beginPath();
      ctx.arc(cx, cy, i * ringW, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? dark : light;
      ctx.fill();
    }
  } else if (variant === 5) {
    // Wide checker — 8×5 grid (classic FIFA-game style box pattern)
    const cols = 8, rows = 5;
    const cw = W / cols, ch = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? dark : light;
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }
  } else {
    // Variant 0 — vertical stripes (20 columns)
    for (let i = 0; i < 20; i++) {
      const x = (i / 20) * W;
      ctx.fillStyle = i % 2 === 0 ? dark : light;
      ctx.fillRect(x, 0, W / 20, H);
    }
  }
  // (avoid unused-var warning on darker)
  void darker;

  // ── Grass texture: speckle noise + subtle horizontal mow lines ───
  // Multiplicative noise so it looks like blades of grass
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // ±8 noise on each channel
    const n = (Math.random() - 0.5) * 18;
    data[i]     = Math.max(0, Math.min(255, data[i]     + n * 0.6));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 0.4));
  }
  ctx.putImageData(imgData, 0, 0);

  // Very subtle horizontal scan lines for that mown look
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.globalAlpha = 1;

  // ── Line markings ────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 5;

  const px = (v: number) => ((v + 55) / 110) * W;  // x: -55..+55 → 0..W
  const pz = (v: number) => ((v + 30) / 60) * H;   // z: -30..+30 → 0..H

  const line = (x1: number, z1: number, x2: number, z2: number) => {
    ctx.beginPath();
    ctx.moveTo(px(x1), pz(z1));
    ctx.lineTo(px(x2), pz(z2));
    ctx.stroke();
  };

  // Boundary
  line(-55, -30, 55, -30);
  line( 55, -30, 55,  30);
  line( 55,  30, -55,  30);
  line(-55,  30, -55, -30);

  // Centre line
  line(0, -30, 0, 30);

  // Centre circle
  ctx.beginPath();
  const cr = (9.15 / 55) * (W / 2);
  ctx.arc(W / 2, H / 2, cr, 0, Math.PI * 2);
  ctx.stroke();

  // Centre spot
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas
  line( 55, -20.16,  33.5, -20.16);
  line( 33.5, -20.16,  33.5,  20.16);
  line( 33.5,  20.16,  55,  20.16);
  line( 55,  -9.16,  49.5,  -9.16);
  line( 49.5,  -9.16,  49.5,  9.16);
  line( 49.5,   9.16,  55,   9.16);

  line(-55, -20.16, -33.5, -20.16);
  line(-33.5, -20.16, -33.5,  20.16);
  line(-33.5,  20.16, -55,  20.16);
  line(-55,  -9.16, -49.5,  -9.16);
  line(-49.5, -9.16, -49.5,  9.16);
  line(-49.5,  9.16, -55,  9.16);

  // Penalty spots
  const drawDot = (x: number, z: number) => {
    ctx.beginPath();
    ctx.arc(px(x), pz(z), 5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawDot(44, 0);
  drawDot(-44, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}
