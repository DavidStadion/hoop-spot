import * as THREE from 'three';
import { makeStadiumTexture, makeBoardTexture } from './textures/stadium-texture';

// ─── Sponsor board copy ──────────────────────────────────────────────
// Edit these to change what appears on the LED perimeter boards.
// Each side of the pitch shows 4 segments cycling around.
const BOARD_TEXTS = {
  northTouchline: [
    { bg: '#0a1f3c', fg: '#00d66b', text: 'GOAL SPOT' },
    { bg: '#1a0a2e', fg: '#c084fc', text: 'MOMENTS REPLAYED' },
    { bg: '#0a1f3c', fg: '#ffffff', text: 'WHO SCORED?' },
    { bg: '#0e2a10', fg: '#4ade80', text: 'GOAL SPOT' },
  ],
  southTouchline: [
    { bg: '#1a0505', fg: '#f87171', text: 'THE BEST GOALS' },
    { bg: '#0a1f3c', fg: '#60a5fa', text: 'GOAL SPOT' },
    { bg: '#1a1a05', fg: '#facc15', text: 'GUESS THE SCORER' },
    { bg: '#0a1f3c', fg: '#ffffff', text: 'GOAL SPOT' },
  ],
  rightGoalFlank: [
    { bg: '#0a1f3c', fg: '#00d66b', text: 'GOAL SPOT' },
    { bg: '#1a0a2e', fg: '#ffffff', text: 'BACK OF THE NET' },
  ],
  leftGoalFlank: [
    { bg: '#1a0505', fg: '#f87171', text: 'GOAL SPOT' },
    { bg: '#0e2a10', fg: '#4ade80', text: 'WONDER GOALS' },
  ],
};
// ─────────────────────────────────────────────────────────────────────

export function buildStadium(scene: THREE.Scene): { backdropBoardTex: THREE.Texture; ledBoardTextures: THREE.Texture[] } {
  const ledBoardTextures: THREE.Texture[] = [];
  // ── Small dark ground plane just covering the pitch corners ──────
  // (Pitch is 110×60, corners need ~63 radius; keep tight so it doesn't catch crowd-flash bleed)
  const groundGeo = new THREE.CircleGeometry(66, 48);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x060c16 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  // ── Full 360° stadium backdrop ────────────────────────────────────
  const stadGeo = new THREE.CylinderGeometry(105, 105, 90, 80, 1, true);
  const stadMat = new THREE.MeshBasicMaterial({ map: makeStadiumTexture(), side: THREE.BackSide });
  const stadium = new THREE.Mesh(stadGeo, stadMat);
  stadium.position.y = 18;
  scene.add(stadium);

  // (Skirt removed — was catching crowd-flash bleed. Backdrop fills the void.)

  // ── Full 360° curved perimeter boards ────────────────────────────
  const backdropBoardTex = makeBoardTexture();
  const boardGeo = new THREE.CylinderGeometry(64, 64, 2.4, 80, 1, true);
  const boardMat = new THREE.MeshBasicMaterial({ map: backdropBoardTex });
  const boards = new THREE.Mesh(boardGeo, boardMat);
  boards.position.y = 1.2;
  scene.add(boards);

  // ── Touchline boards ─────────────────────────────────────────────
  buildTouchlineBoards(scene, ledBoardTextures);

  // ── Goal-flank boards ─────────────────────────────────────────────
  buildGoalFlankBoards(scene, ledBoardTextures);

  return { backdropBoardTex, ledBoardTextures };
}

// Clean LED-board texture — one message per segment, centred, no tiling within a segment.
// Designed to be scrolled horizontally via texture.offset.x for that real-stadium LED feel.
function makeLedTex(segments: { bg: string; fg: string; text: string }[]): THREE.CanvasTexture {
  const H = 128;
  const segW = 640; // wide enough for messages like "GUESS THE SCORER" to breathe
  const W = segW * segments.length;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  segments.forEach((seg, i) => {
    const x = i * segW;

    // Background panel
    ctx.fillStyle = seg.bg;
    ctx.fillRect(x, 0, segW, H);

    // Top highlight line (LED bezel feel)
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, 0, segW, 2);
    // Bottom shadow line
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x, H - 2, segW, 2);

    // Single centred text — auto-shrink to fit segment
    const padding = 32;
    const maxW = segW - padding * 2;
    let fontSize = Math.round(H * 0.58);
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(seg.text).width > maxW && fontSize > 24) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    }
    ctx.fillStyle = seg.fg;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(seg.text, x + segW / 2, H / 2);

    // Thin divider between segments
    if (i < segments.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + segW - 1, 6, 1, H - 12);
    }
  });

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 8;
  return tex;
}

function buildTouchlineBoards(scene: THREE.Scene, ledTextures: THREE.Texture[]) {
  const H = 1.6;
  const D = 0.18;
  const totalLen = 110;
  const gap = 1.5;

  const sides = [
    { zSign:  1, segments: BOARD_TEXTS.northTouchline },
    { zSign: -1, segments: BOARD_TEXTS.southTouchline },
  ];

  for (const { zSign, segments } of sides) {
    const tex = makeLedTex(segments);
    // Stretch so multiple messages are visible along the touchline at any time
    tex.repeat.set(2, 1);
    ledTextures.push(tex);
    const geo = new THREE.BoxGeometry(totalLen, H, D);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, H / 2, zSign * (30 + gap));
    scene.add(mesh);
  }
}

function buildGoalFlankBoards(scene: THREE.Scene, ledTextures: THREE.Texture[]) {
  const GW = 7.32;
  const boardLen = 14;
  const boardH = 1.6;
  const boardD = 0.18;
  const xGap = 1.5;

  const configs = [
    { goalX:  55, segments: BOARD_TEXTS.rightGoalFlank },
    { goalX: -55, segments: BOARD_TEXTS.leftGoalFlank },
  ];

  for (const { goalX, segments } of configs) {
    const sign = goalX > 0 ? 1 : -1;
    const xPos = goalX + sign * xGap;
    const tex = makeLedTex(segments);
    tex.repeat.set(1, 1);
    ledTextures.push(tex);

    for (const zSign of [-1, 1]) {
      const zPos = zSign * (GW / 2 + boardLen / 2 + 0.5);
      const geo = new THREE.BoxGeometry(boardD, boardH, boardLen);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xPos, boardH / 2, zPos);
      scene.add(mesh);
    }
  }
}
