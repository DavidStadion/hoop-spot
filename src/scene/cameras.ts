import * as THREE from 'three';
import type { CameraShot } from '../data/types';

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3 };

const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type DynamicShot = {
  compute: (ball: THREE.Vector3, hoopX: number) => Shot;
  posSpeed: number;
  lookSpeed: number;
};

// All positions tuned for a 28.65 × 15.24 m NBA court with hoops at x = ±12.75.
export const DYNAMIC_SHOTS: Record<CameraShot, DynamicShot> = {
  // Pulled back — broadcast wide showing both ends
  wide: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      const focusX = ball.x * 0.5 + hoopX * 0.15;
      return {
        pos: vec(focusX - side * 3, 9, 17),
        look: vec(ball.x + side * 3, 1.5, ball.z * 0.3),
      };
    },
    posSpeed: 1.4,
    lookSpeed: 2.0,
  },

  // Courtside follow — chest height behind the carrier
  follow: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(ball.x - side * 5.5, 3.4, ball.z * 0.5 + 6.5),
        look: vec(ball.x + side * 4, 1.8, ball.z * 0.4),
      };
    },
    posSpeed: 4.0,
    lookSpeed: 5.5,
  },

  // Tight chase — knee height, glued to the dribbler
  dribble: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(ball.x - side * 2.8, 1.6, ball.z + 2.6),
        look: vec(ball.x + side * 2.4, 1.0, ball.z),
      };
    },
    posSpeed: 6.5,
    lookSpeed: 7.5,
  },

  // Baseline courtside, tracking the ball's x with a fixed depth
  side: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(ball.x - side * 1.5, 1.9, 9.5),
        look: vec(ball.x + side * 2.8, 1.6, ball.z * 0.3),
      };
    },
    posSpeed: 4.5,
    lookSpeed: 5.5,
  },

  // Behind the baseline / behind the hoop — looks back across the court
  baseline: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(hoopX + side * 4.0, 3.6, ball.z * 0.3 + 5.5),
        look: vec(ball.x, 2.4, ball.z * 0.4),
      };
    },
    posSpeed: 2.8,
    lookSpeed: 4.0,
  },

  // Low courtside in front of the rim — ball flies INTO net toward camera
  close: {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(hoopX - side * 5.5, 2.4, 4.5),
        look: vec(ball.x, ball.y + 0.3, ball.z),
      };
    },
    posSpeed: 5.0,
    lookSpeed: 7.0,
  },

  // Swish cam — just under the rim looking up at the ball coming through
  'swish-cam': {
    compute: (ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(hoopX + side * 0.55, 2.45, 0),         // tucked behind/under rim
        look: vec(ball.x, ball.y + 0.15, ball.z),
      };
    },
    posSpeed: 6.0,
    lookSpeed: 8.0,
  },

  // Crowd-pan — courtside camera tilts up into the lower bowl
  'crowd-pan': {
    compute: (_ball, hoopX) => {
      const side = hoopX > 0 ? 1 : -1;
      return {
        pos: vec(hoopX - side * 4.5, 3.2, 5.5),
        look: vec(hoopX + side * 25, 14, 0),
      };
    },
    posSpeed: 2.6,
    lookSpeed: 2.6,
  },

  // Cable-cam — high mid-court sweep
  'cable-cam': {
    compute: (ball) => {
      return {
        pos: vec(ball.x * 0.5, 11, 12),
        look: vec(ball.x, 1.4, ball.z * 0.4),
      };
    },
    posSpeed: 2.4,
    lookSpeed: 3.2,
  },
};

// After basket: broadcast elevated end-to-end shot showing the full court.
export function getBirdsEyeShot(_hoopX: number): Shot {
  return {
    pos: vec(0, 18, 22),
    look: vec(2, 0, 0),
  };
}

export function lerpCamera(
  camera: THREE.PerspectiveCamera,
  from: Shot,
  to: Shot,
  t: number,
) {
  camera.position.lerpVectors(from.pos, to.pos, t);
  const look = new THREE.Vector3().lerpVectors(from.look, to.look, t);
  camera.lookAt(look);
}
