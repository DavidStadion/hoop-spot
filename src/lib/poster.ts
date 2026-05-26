import type { Goal } from '../data/types';

// Portrait poster — 1080×1920 (Instagram story / phone wallpaper friendly).
const W = 1080;
const H = 1920;

export function buildPoster(goal: Goal): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Background ─────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    '#0a1828');
  bg.addColorStop(0.45, '#0e2236');
  bg.addColorStop(1,    '#070d18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft accent glow (top-left)
  const g1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 700);
  g1.addColorStop(0, 'rgba(244, 90, 14, 0.22)');
  g1.addColorStop(1, 'rgba(244, 90, 14, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // ── Header section ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 28px Inter, Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('HOOP SPOT', 80, 80);

  // Year/competition pill
  const compText = `${goal.meta.comp.toUpperCase()} · ${goal.meta.year}`;
  ctx.font = '800 26px Inter, Arial, sans-serif';
  const compW = ctx.measureText(compText).width;
  const pillX = 80, pillY = 140;
  const pillH = 52;
  const pillPad = 22;
  roundedRect(ctx, pillX, pillY, compW + pillPad * 2, pillH, 999);
  ctx.fillStyle = 'rgba(244, 90, 14, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 90, 14, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f45a0e';
  ctx.fillText(compText, pillX + pillPad, pillY + 13);

  // Scorer name — huge
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  const scorerName = goal.scorer.toUpperCase();
  let scorerFontSize = 124;
  ctx.font = `900 ${scorerFontSize}px Inter, Arial, sans-serif`;
  while (ctx.measureText(scorerName).width > W - 160 && scorerFontSize > 60) {
    scorerFontSize -= 4;
    ctx.font = `900 ${scorerFontSize}px Inter, Arial, sans-serif`;
  }
  ctx.fillText(scorerName, 80, 230);

  // Subtitle: teams + score
  const subY = 230 + scorerFontSize + 24;
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const matchLine = `${goal.meta.homeTeam} ${goal.meta.homeScore}–${goal.meta.awayScore} ${goal.meta.awayTeam}`;
  ctx.fillText(matchLine, 80, subY);

  // Arena + clock line
  ctx.font = '600 24px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  const arenaName = goal.meta.arena ?? goal.meta.stadium;
  const arenaPart = arenaName ? `${arenaName} · ` : '';
  ctx.fillText(`${arenaPart}${goal.meta.clock}`, 80, subY + 56);

  // ── Court section ──────────────────────────────────────────────
  // NBA court coords: x ∈ [-14.325, 14.325], z ∈ [-7.62, 7.62]
  const courtPad = 80;
  const courtTop = subY + 56 + 100;
  const courtW = W - courtPad * 2;           // 920
  const courtH = courtW * (15.24 / 28.65);   // proportional, ~489
  const courtLeft = courtPad;

  drawCourt(ctx, courtLeft, courtTop, courtW, courtH);
  drawPlayPath(ctx, goal, courtLeft, courtTop, courtW, courtH);

  // ── Footer ─────────────────────────────────────────────────────
  const footY = courtTop + courtH + 100;
  ctx.textAlign = 'left';
  ctx.font = '700 26px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(goal.fact, 80, footY);

  // Bottom branding
  ctx.font = '800 22px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textBaseline = 'bottom';
  ctx.fillText('HOOP SPOT', 80, H - 80);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#f45a0e';
  ctx.fillText('★ MOMENT REPLAYED', W - 80, H - 80);

  return canvas;
}

// ─── Helpers ─────────────────────────────────────────────────────

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawCourt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // NBA court — 28.65 × 15.24 m. Hoops at x = ±12.75.
  const HALF_X = 14.325;
  const HALF_Z = 7.62;
  const px = (v: number) => x + ((v + HALF_X) / (HALF_X * 2)) * w;
  const py = (v: number) => y + ((v + HALF_Z) / (HALF_Z * 2)) * h;
  const pxScale = w / (HALF_X * 2);

  // Wood parquet base
  ctx.fillStyle = '#caa069';
  ctx.fillRect(x, y, w, h);

  // Vertical plank shading
  const planks = 60;
  for (let i = 0; i < planks; i++) {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = i % 2 === 0 ? '#a87f4a' : '#e0bb84';
    ctx.fillRect(x + (i * w) / planks, y, w / planks + 1, h);
  }
  ctx.globalAlpha = 1;

  // Soft sheen
  const sheen = ctx.createLinearGradient(0, y, 0, y + h);
  sheen.addColorStop(0, 'rgba(255,240,210,0.10)');
  sheen.addColorStop(0.5, 'rgba(255,240,210,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);

  // Markings
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(x, y, w, h);

  // Half-court line
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();

  // Centre circle (radius 1.83 m)
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 1.83 * pxScale, 0, Math.PI * 2);
  ctx.stroke();

  // Per-end key/paint, free-throw circle, three-point line, restricted-area arc
  const drawEnd = (side: 1 | -1) => {
    const baselineX = side * HALF_X;
    const ftLineX   = side * (HALF_X - 5.79);
    const rimX      = side * (HALF_X - 1.575);
    const paintHalfW = 2.44;
    const ftR = 1.83;
    const threeR = 7.24;
    const cornerZ = 6.706;
    const cornerX = side * (HALF_X - 4.27);

    // Paint
    ctx.beginPath();
    ctx.moveTo(px(baselineX), py(-paintHalfW));
    ctx.lineTo(px(ftLineX),   py(-paintHalfW));
    ctx.lineTo(px(ftLineX),   py( paintHalfW));
    ctx.lineTo(px(baselineX), py( paintHalfW));
    ctx.stroke();

    // Free-throw circle (solid)
    ctx.beginPath();
    ctx.arc(px(ftLineX), py(0), ftR * pxScale, 0, Math.PI * 2);
    ctx.stroke();

    // Three-point straight corner portions
    ctx.beginPath();
    ctx.moveTo(px(baselineX), py( cornerZ));
    ctx.lineTo(px(cornerX),   py( cornerZ));
    ctx.moveTo(px(baselineX), py(-cornerZ));
    ctx.lineTo(px(cornerX),   py(-cornerZ));
    ctx.stroke();

    // Three-point arc
    const dx = cornerX - rimX;
    const theta = Math.atan2(cornerZ, dx);
    ctx.beginPath();
    if (side === 1) {
      ctx.arc(px(rimX), py(0), threeR * pxScale, -theta + Math.PI, theta + Math.PI, false);
    } else {
      ctx.arc(px(rimX), py(0), threeR * pxScale, -theta, theta, false);
    }
    ctx.stroke();

    // Rim marker
    ctx.beginPath();
    ctx.arc(px(rimX), py(0), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5a26';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
  };
  drawEnd(1);
  drawEnd(-1);
}

function drawPlayPath(
  ctx: CanvasRenderingContext2D,
  goal: Goal,
  x: number, y: number, w: number, h: number,
) {
  // NBA court coords: x ∈ [-14.325, 14.325], z ∈ [-7.62, 7.62]
  const HALF_X = 14.325;
  const HALF_Z = 7.62;
  const px = (v: number) => x + ((v + HALF_X) / (HALF_X * 2)) * w;
  const py = (v: number) => y + ((v + HALF_Z) / (HALF_Z * 2)) * h;

  const points = goal.buildup.map(wp => ({ ...wp, sx: px(wp.x), sy: py(wp.z) }));

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const isDribble = curr.shotType === 'dribble' || curr.dribble;
    const isBasket = !!(curr.isBasket || curr.isGoal);
    ctx.beginPath();
    if (isDribble) {
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = '#ff8a3d';        // orange for dribble (matches rim)
      ctx.lineWidth = 5;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = isBasket ? '#ffd54a' : '#ffffff';
      ctx.lineWidth = 6;
    }
    ctx.lineCap = 'round';
    ctx.moveTo(prev.sx, prev.sy);
    // Curve arcs for passes/shots — bigger lift for high-arc shots
    if (!isDribble && curr.arc && curr.arc > 1.5) {
      const mx = (prev.sx + curr.sx) / 2;
      const my = (prev.sy + curr.sy) / 2 - 14 * curr.arc;
      ctx.quadraticCurveTo(mx, my, curr.sx, curr.sy);
    } else {
      ctx.lineTo(curr.sx, curr.sy);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Numbered waypoint markers
  points.forEach((p, i) => {
    const isBasket = !!(p.isBasket || p.isGoal);
    const r = isBasket ? 28 : 22;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = isBasket ? '#ff5a26' : '#0d1826';
    ctx.fill();
    ctx.strokeStyle = isBasket ? '#ff5a26' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${isBasket ? 24 : 22}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isBasket ? '🏀' : String(i + 1), p.sx, p.sy + 1);

    if (p.label && !isBasket) {
      ctx.font = '700 22px Inter, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.sx + r + 10, p.sy);
    }
  });
}

// ─── Download helper ─────────────────────────────────────────────
export function downloadPoster(goal: Goal): void {
  const canvas = buildPoster(goal);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoop-spot-${goal.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }, 'image/png');
}
