import * as THREE from 'three';

export function makeStadiumTexture(): THREE.CanvasTexture {
  const W = 2048, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Roof + upper-bowl gradient (dark indoor arena, no sky) ───────
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    '#05080d');   // ceiling
  grad.addColorStop(0.18, '#0c1219');   // catwalk
  grad.addColorStop(0.35, '#171c25');   // upper bowl
  grad.addColorStop(0.65, '#1b2230');   // mid bowl
  grad.addColorStop(1,    '#252a36');   // lower courtside fade
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Suspended catwalk light strip ────────────────────────────────
  const catY = H * 0.10;
  ctx.fillStyle = '#1a1e26';
  ctx.fillRect(0, catY - 4, W, 12);
  // Bulbs along the catwalk
  for (let i = 0; i < 28; i++) {
    const x = (i / 28) * W + W / 56;
    const grd = ctx.createRadialGradient(x, catY + 2, 0, x, catY + 2, 26);
    grd.addColorStop(0,   'rgba(255,247,210,0.95)');
    grd.addColorStop(0.4, 'rgba(255,237,180,0.40)');
    grd.addColorStop(1,   'rgba(255,237,180,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, catY + 2, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint mid-band concourse divider (between upper + lower bowls)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, H * 0.42, W, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, H * 0.42 + 6, W, 2);

  // ── Crowd — tiered rows of small head+shoulder silhouettes ───────
  const rng = mulberry32(0xb45ba114);
  // Team-coloured jersey palette (mix neutrals + warm reds/oranges + cool blues)
  const jerseys = [
    '#222b3b', '#1c2230', '#2a2f3d',     // neutrals (most fans)
    '#3a1a14', '#54211a', '#7a2a1d',     // home reds
    '#c84a1f', '#ff8a3d', '#ffb060',     // bright orange (home team)
    '#1a2a52', '#243b6e', '#2c4a8a',     // cool blues
    '#5a5246', '#7a6a4e',                 // tan / khaki
    '#eeeeee',                            // occasional white shirt
  ];

  // Two density tiers — upper bowl tighter rows, lower bowl wider gaps
  const tiers = [
    { yStart: 0.20, yEnd: 0.42, rowGap: 9,  spacing: 11, headR: 1.7 },
    { yStart: 0.50, yEnd: 0.96, rowGap: 12, spacing: 14, headR: 2.2 },
  ];

  for (const tier of tiers) {
    const yTop = H * tier.yStart;
    const yBot = H * tier.yEnd;
    for (let y = yTop; y < yBot; y += tier.rowGap) {
      // Each row offset slightly to look like staggered seats
      const offset = (Math.floor(y / tier.rowGap) % 2) * (tier.spacing / 2);
      for (let x = -tier.spacing; x < W + tier.spacing; x += tier.spacing) {
        const px = x + offset + (rng() - 0.5) * 2;
        const py = y + (rng() - 0.5) * 2;
        const jersey = jerseys[Math.floor(rng() * jerseys.length)];

        // Body block — small rectangle of jersey colour
        ctx.fillStyle = jersey;
        ctx.fillRect(px - tier.headR * 1.4, py, tier.headR * 2.8, tier.headR * 3);

        // Head — slightly darker than jersey, warm tones for skin variation
        const skinPick = rng();
        const skin =
          skinPick > 0.85 ? '#d9b08a' :
          skinPick > 0.55 ? '#a87b5a' :
          skinPick > 0.25 ? '#7b5239' :
                            '#4d331e';
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(px, py - tier.headR * 0.4, tier.headR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Sparse white "phone screen" specks scattered through crowd ───
  for (let i = 0; i < 220; i++) {
    const x = rng() * W;
    const y = H * 0.22 + rng() * H * 0.72;
    const a = 0.25 + rng() * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  // ── Subtle vertical gridlines for seat sections (rare aisles) ────
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * W + W / 28;
    ctx.fillRect(x, H * 0.20, 2, H * 0.78);
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

  ctx.fillStyle = '#1a0a05';
  ctx.fillRect(0, 0, W, H);

  ctx.font = `bold ${H * 0.72}px 'Arial', sans-serif`;
  ctx.fillStyle = '#ff8a3d';
  ctx.textBaseline = 'middle';
  const word = '  HOOPSPOT  ';
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
