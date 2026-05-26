import * as THREE from 'three';

// NBA court — 94 ft × 50 ft → 28.65 m × 15.24 m
const COURT_W = 28.65;
const COURT_H = 15.24;
const HALF_W = COURT_W / 2;   // 14.325
const HALF_H = COURT_H / 2;   // 7.62

// Hoop / line constants in metres
const RIM_FROM_BASELINE = 1.575;        // 5'3" — centre of rim from baseline
const PAINT_DEPTH = 5.79;               // 19 ft — baseline → free-throw line
const PAINT_HALF_WIDTH = 2.44;          // 16 ft wide ÷ 2
const FT_CIRCLE_R = 1.83;               // 6 ft radius
const CENTRE_CIRCLE_R = 1.83;
const THREE_ARC_R = 7.24;               // 23'9" from rim centre
const CORNER_THREE_Z = 6.706;           // 22 ft sideline-corner-3 distance
const CORNER_THREE_X = 14.325 - 4.27;   // straight portion runs from baseline to 14 ft
const RESTRICTED_R = 1.22;              // 4 ft restricted area

export function makeCourtTexture(variant = 0): THREE.CanvasTexture {
  const W = 2048;
  const H = Math.round(W * (COURT_H / COURT_W));   // ≈ 1088
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Wood base ─────────────────────────────────────────────────────
  // Variant tweaks the parquet tone — Celtics-cream, Lakers-amber, Bulls-honey.
  const palettes = [
    { base: '#caa069', dark: '#a87f4a', light: '#e0bb84', grain: '#7a5630' }, // classic honey
    { base: '#d4ad79', dark: '#b48857', light: '#e7c594', grain: '#8a5e36' }, // Celtics-cream
    { base: '#b88553', dark: '#946232', light: '#d09a68', grain: '#5e3a18' }, // Lakers-amber
    { base: '#c89865', dark: '#a37242', light: '#dcae7d', grain: '#704522' }, // Bulls-honey
  ];
  const p = palettes[variant % palettes.length];

  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, H);

  // Parquet planks — vertical strips along the court's long axis
  const plankCount = 60;
  const plankW = W / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const shade = i % 2 === 0 ? p.dark : p.light;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = shade;
    ctx.fillRect(i * plankW, 0, plankW, H);
  }
  ctx.globalAlpha = 1;

  // Grain — short horizontal streaks within each plank
  ctx.strokeStyle = p.grain;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const len = 20 + Math.random() * 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (Math.random() - 0.5) * 1.4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Knots — occasional darker speckles
  ctx.fillStyle = p.grain;
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Subtle pixel-level noise so the surface isn't perfectly flat
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    data[i]     = Math.max(0, Math.min(255, data[i]     + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n * 0.85));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Floor sheen — soft horizontal highlight
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(255,240,210,0.10)');
  sheen.addColorStop(0.5, 'rgba(255,240,210,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.10)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // ── Line markings ────────────────────────────────────────────────
  const px = (v: number) => ((v + HALF_W) / COURT_W) * W;
  const pz = (v: number) => ((v + HALF_H) / COURT_H) * H;
  const pxScale = W / COURT_W;          // pixels per metre on x
  const pzScale = H / COURT_H;          // pixels per metre on z

  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'butt';

  const line = (x1: number, z1: number, x2: number, z2: number) => {
    ctx.beginPath();
    ctx.moveTo(px(x1), pz(z1));
    ctx.lineTo(px(x2), pz(z2));
    ctx.stroke();
  };

  // Boundary (sidelines + baselines)
  line(-HALF_W, -HALF_H,  HALF_W, -HALF_H);
  line( HALF_W, -HALF_H,  HALF_W,  HALF_H);
  line( HALF_W,  HALF_H, -HALF_W,  HALF_H);
  line(-HALF_W,  HALF_H, -HALF_W, -HALF_H);

  // Half-court line
  line(0, -HALF_H, 0, HALF_H);

  // Centre circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, CENTRE_CIRCLE_R * pxScale, 0, Math.PI * 2);
  ctx.stroke();

  // Centre logo dot
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Per-end markings (mirrored for each baseline)
  const drawEnd = (side: 1 | -1) => {
    const baselineX = side * HALF_W;
    const ftLineX   = side * (HALF_W - PAINT_DEPTH);
    const rimX      = side * (HALF_W - RIM_FROM_BASELINE);

    // Paint / key — 4.88 m wide × 5.79 m deep
    line(baselineX, -PAINT_HALF_WIDTH, ftLineX, -PAINT_HALF_WIDTH);
    line(baselineX,  PAINT_HALF_WIDTH, ftLineX,  PAINT_HALF_WIDTH);
    line(ftLineX,   -PAINT_HALF_WIDTH, ftLineX,  PAINT_HALF_WIDTH);

    // Free-throw circle — solid top arc (court-side), dashed bottom arc (paint-side)
    const ftCx = px(ftLineX);
    const ftCy = pz(0);
    const ftR  = FT_CIRCLE_R * pxScale;
    // Solid half facing centre court
    ctx.beginPath();
    if (side === 1) {
      ctx.arc(ftCx, ftCy, ftR, Math.PI / 2, -Math.PI / 2, true);
    } else {
      ctx.arc(ftCx, ftCy, ftR, -Math.PI / 2, Math.PI / 2, true);
    }
    ctx.stroke();
    // Dashed half over the paint
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    if (side === 1) {
      ctx.arc(ftCx, ftCy, ftR, -Math.PI / 2, Math.PI / 2);
    } else {
      ctx.arc(ftCx, ftCy, ftR, Math.PI / 2, -Math.PI / 2);
    }
    ctx.stroke();
    ctx.restore();

    // Three-point line — straight corner portions
    line(baselineX,  CORNER_THREE_Z, side * CORNER_THREE_X,  CORNER_THREE_Z);
    line(baselineX, -CORNER_THREE_Z, side * CORNER_THREE_X, -CORNER_THREE_Z);
    // Arc — centred on the rim
    const rimCx = px(rimX);
    const rimCy = pz(0);
    const arcR  = THREE_ARC_R * pxScale;
    // Compute angle where the arc meets the straight corner-3 line (z = ±CORNER_THREE_Z)
    const dx = (side * CORNER_THREE_X) - rimX;
    const dz = CORNER_THREE_Z;
    const theta = Math.atan2(dz, dx); // radians, measured from +x axis in canvas (pz grows downward = +z grows downward)
    ctx.beginPath();
    if (side === 1) {
      // Right hoop — arc opens toward centre court (negative x in canvas terms means smaller px)
      ctx.arc(rimCx, rimCy, arcR, -theta + Math.PI, theta + Math.PI, false);
    } else {
      ctx.arc(rimCx, rimCy, arcR, -theta, theta, false);
    }
    ctx.stroke();

    // Restricted-area arc under the basket
    ctx.beginPath();
    if (side === 1) {
      ctx.arc(rimCx, rimCy, RESTRICTED_R * pxScale, Math.PI / 2, -Math.PI / 2, true);
    } else {
      ctx.arc(rimCx, rimCy, RESTRICTED_R * pxScale, -Math.PI / 2, Math.PI / 2, true);
    }
    ctx.stroke();

    // Hash marks along the lane (4 lane spaces per side)
    const hashes = [1.83, 2.74, 3.66, 4.57]; // distances from baseline
    for (const d of hashes) {
      const hx = side * (HALF_W - d);
      const tick = 0.18; // metres
      line(hx, -PAINT_HALF_WIDTH, hx, -PAINT_HALF_WIDTH - tick);
      line(hx,  PAINT_HALF_WIDTH, hx,  PAINT_HALF_WIDTH + tick);
    }

    // Coach's box / hash on sidelines (28 ft from baseline — outside the court is fine to skip)
    // Free-throw lane block tick — short ticks at top of the key
    const blockY = PAINT_HALF_WIDTH;
    const blockX = side * (HALF_W - 2.13);
    line(blockX, blockY, blockX, blockY - 0.12);
    line(blockX, -blockY, blockX, -blockY + 0.12);
  };
  drawEnd(1);
  drawEnd(-1);

  // Bump line width back so any subsequent overlays match
  ctx.lineWidth = 4;
  // Reference: avoid unused warnings (pzScale used above)
  void pzScale;

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}
