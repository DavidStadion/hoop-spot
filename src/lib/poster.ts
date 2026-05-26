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
  g1.addColorStop(0, 'rgba(0, 214, 107, 0.22)');
  g1.addColorStop(1, 'rgba(0, 214, 107, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // ── Header section ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 28px Inter, Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('GOAL SPOT', 80, 80);

  // Year/competition pill
  const compText = `${goal.meta.comp.toUpperCase()} · ${goal.meta.year}`;
  ctx.font = '800 26px Inter, Arial, sans-serif';
  const compW = ctx.measureText(compText).width;
  const pillX = 80, pillY = 140;
  const pillH = 52;
  const pillPad = 22;
  roundedRect(ctx, pillX, pillY, compW + pillPad * 2, pillH, 999);
  ctx.fillStyle = 'rgba(0, 214, 107, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 214, 107, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#00d66b';
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

  // Stadium + clock line
  ctx.font = '600 24px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  const stadiumPart = goal.meta.stadium ? `${goal.meta.stadium} · ` : '';
  ctx.fillText(`${stadiumPart}${goal.meta.clock}`, 80, subY + 56);

  // ── Pitch section ──────────────────────────────────────────────
  // Pitch coordinates in original game: x ∈ [-55,55], z ∈ [-30,30]
  // Map to a pitch area on the poster.
  const pitchPad = 80;
  const pitchTop = subY + 56 + 100;
  const pitchW = W - pitchPad * 2;          // 920
  const pitchH = pitchW * (60 / 110);       // proportional, ~502
  const pitchLeft = pitchPad;

  drawPitch(ctx, pitchLeft, pitchTop, pitchW, pitchH);
  drawGoalPath(ctx, goal, pitchLeft, pitchTop, pitchW, pitchH);

  // ── Footer ─────────────────────────────────────────────────────
  const footY = pitchTop + pitchH + 100;
  ctx.textAlign = 'left';
  ctx.font = '700 26px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(goal.fact, 80, footY);

  // Bottom branding
  ctx.font = '800 22px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textBaseline = 'bottom';
  ctx.fillText('GOAL SPOT', 80, H - 80);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#00d66b';
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

function drawPitch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Vertical stripes
  const stripes = 18;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#358a40' : '#54bd62';
    ctx.fillRect(x + (i * w) / stripes, y, w / stripes + 1, h);
  }

  // Markings
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 4;
  // Boundary
  ctx.strokeRect(x, y, w, h);
  // Centre line
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  // Centre circle
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, (9.15 / 55) * (w / 2), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Penalty / goal areas — right (attacking) side
  const pxRight = x + w;
  const py = (v: number) => y + ((v + 30) / 60) * h;
  const px = (v: number) => x + ((v + 55) / 110) * w;

  // Right pen area
  ctx.beginPath();
  ctx.moveTo(pxRight, py(-20.16));
  ctx.lineTo(px(33.5), py(-20.16));
  ctx.lineTo(px(33.5), py(20.16));
  ctx.lineTo(pxRight, py(20.16));
  ctx.stroke();
  // Right goal area
  ctx.beginPath();
  ctx.moveTo(pxRight, py(-9.16));
  ctx.lineTo(px(49.5), py(-9.16));
  ctx.lineTo(px(49.5), py(9.16));
  ctx.lineTo(pxRight, py(9.16));
  ctx.stroke();
  // Pen spot
  ctx.beginPath();
  ctx.arc(px(44), py(0), 5, 0, Math.PI * 2);
  ctx.fill();

  // Left pen area
  ctx.beginPath();
  ctx.moveTo(x, py(-20.16));
  ctx.lineTo(px(-33.5), py(-20.16));
  ctx.lineTo(px(-33.5), py(20.16));
  ctx.lineTo(x, py(20.16));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, py(-9.16));
  ctx.lineTo(px(-49.5), py(-9.16));
  ctx.lineTo(px(-49.5), py(9.16));
  ctx.lineTo(x, py(9.16));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(-44), py(0), 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoalPath(
  ctx: CanvasRenderingContext2D,
  goal: Goal,
  x: number, y: number, w: number, h: number,
) {
  // Game pitch coords: x ∈ [-55, 55] (left→right), z ∈ [-30, 30] (top→bottom)
  const px = (v: number) => x + ((v + 55) / 110) * w;
  const py = (v: number) => y + ((v + 30) / 60) * h;

  const points = goal.buildup.map(wp => ({ ...wp, sx: px(wp.x), sy: py(wp.z) }));

  // Draw segments — dashed for dribble, solid for pass
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    ctx.beginPath();
    if (curr.dribble) {
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = '#00d66b';
      ctx.lineWidth = 5;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = curr.isGoal ? '#ffd54a' : '#ffffff';
      ctx.lineWidth = 6;
    }
    ctx.lineCap = 'round';
    ctx.moveTo(prev.sx, prev.sy);
    // Slight curve for arc passes
    if (!curr.dribble && curr.arc && curr.arc > 1.5) {
      const mx = (prev.sx + curr.sx) / 2;
      const my = (prev.sy + curr.sy) / 2 - 24 * curr.arc;
      ctx.quadraticCurveTo(mx, my, curr.sx, curr.sy);
    } else {
      ctx.lineTo(curr.sx, curr.sy);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Numbered waypoint markers
  points.forEach((p, i) => {
    const isGoal = !!p.isGoal;
    const r = isGoal ? 28 : 22;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = isGoal ? '#00d66b' : '#0d1826';
    ctx.fill();
    ctx.strokeStyle = isGoal ? '#00d66b' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = isGoal ? '#080f1a' : '#ffffff';
    ctx.font = `900 ${isGoal ? 24 : 22}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isGoal ? '⚽' : String(i + 1), p.sx, p.sy + 1);

    // Label
    if (p.label && !isGoal) {
      ctx.font = '700 22px Inter, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      // Offset label so it doesn't overlap the dot
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
    a.download = `goal-spot-${goal.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }, 'image/png');
}
