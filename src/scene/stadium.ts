import * as THREE from 'three';
import { makeStadiumTexture, makeBoardTexture } from './textures/stadium-texture';
import { COURT_WIDTH, COURT_HEIGHT } from './court';

// ─── Sponsor board copy ──────────────────────────────────────────────
const BOARD_TEXTS = [
  { bg: '#1a0a05', fg: '#ff8a3d', text: 'HOOP SPOT' },
  { bg: '#0a1a2a', fg: '#ffffff', text: 'WHO SCORED?' },
  { bg: '#2a1505', fg: '#ffb060', text: 'BUCKETS REPLAYED' },
  { bg: '#0a1a2a', fg: '#ff6a1f', text: 'NOTHING BUT NET' },
];
// ─────────────────────────────────────────────────────────────────────

export function buildStadium(scene: THREE.Scene): { backdropBoardTex: THREE.Texture; ledBoardTextures: THREE.Texture[] } {
  const ledBoardTextures: THREE.Texture[] = [];

  // Court apron — dark stained wood ellipse that hugs the court
  const apronHalfX = COURT_WIDTH / 2 + 6.0;
  const apronHalfZ = COURT_HEIGHT / 2 + 4.5;

  const apronFill = new THREE.Mesh(
    new THREE.CircleGeometry(1, 96),
    new THREE.MeshLambertMaterial({ color: 0x3a2814 }),
  );
  apronFill.rotation.x = -Math.PI / 2;
  apronFill.position.y = -0.04;
  apronFill.scale.set(apronHalfX, apronHalfZ, 1);
  scene.add(apronFill);

  // Outer concrete halo — fades into the backdrop
  const concrete = new THREE.Mesh(
    new THREE.CircleGeometry(1, 96),
    new THREE.MeshBasicMaterial({ color: 0x0a0d12 }),
  );
  concrete.rotation.x = -Math.PI / 2;
  concrete.position.y = -0.06;
  concrete.scale.set(apronHalfX + 24, apronHalfZ + 18, 1);
  scene.add(concrete);

  // ── 360° arena bowl backdrop (crowd) ─────────────────────────────
  const stadGeo = new THREE.CylinderGeometry(60, 60, 70, 80, 1, true);
  const stadMat = new THREE.MeshBasicMaterial({ map: makeStadiumTexture(), side: THREE.BackSide });
  const stadium = new THREE.Mesh(stadGeo, stadMat);
  stadium.position.y = 16;
  stadium.scale.set(1.35, 1, 1);
  scene.add(stadium);

  // ── Courtside sponsor boards — three flat rectangles in a row ────
  // Placed along the FAR sideline (away from the broadcast camera) just
  // outside the playing area, like bet365's courtside placement.
  const boardW = 4.6;
  const boardH = 1.3;
  const boardD = 0.18;
  const boardGap = 0.4;
  const boardZ = -(COURT_HEIGHT / 2 + 1.4);   // tucked just behind the far sideline
  const totalSpan = boardW * 3 + boardGap * 2;
  const startX = -totalSpan / 2 + boardW / 2;

  // Single row of scrolling LED boards at floor level.
  // Each board shows roughly one full text segment at a time so the message
  // is readable rather than squashed into many tiny copies. repeat.x is
  // tuned so board.width × repeat ≈ one segment of the LED texture.
  const ledTex = makeLedTex(BOARD_TEXTS);
  ledTex.repeat.set(0.45, 1);
  ledBoardTextures.push(ledTex);
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTex });

  for (let i = 0; i < 3; i++) {
    const geo = new THREE.BoxGeometry(boardW, boardH, boardD);
    const mesh = new THREE.Mesh(geo, ledMat);
    mesh.position.set(startX + i * (boardW + boardGap), boardH / 2, boardZ);
    scene.add(mesh);
  }
  void totalSpan;

  return { backdropBoardTex: ledTex, ledBoardTextures };
}

function makeLedTex(segments: { bg: string; fg: string; text: string }[]): THREE.CanvasTexture {
  const H = 128;
  const segW = 640;
  const W = segW * segments.length;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  segments.forEach((seg, i) => {
    const x = i * segW;
    ctx.fillStyle = seg.bg;
    ctx.fillRect(x, 0, segW, H);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, 0, segW, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(x, H - 2, segW, 2);

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

    if (i < segments.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + segW - 1, 6, 1, H - 12);
    }
  });

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
