import * as THREE from 'three';
import type { CameraShot } from '../data/types';

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3 };

const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type DynamicShot = {
  compute: (ball: THREE.Vector3, goalX: number) => Shot;
  /** Camera position lerp speed per second */
  posSpeed: number;
  /** LookAt target lerp speed per second */
  lookSpeed: number;
};

export const DYNAMIC_SHOTS: Record<CameraShot, DynamicShot> = {
  // Pulled back — slowly tracks the centre of the action
  wide: {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      const focusX = ball.x * 0.4 + goalX * 0.2;
      return {
        pos: vec(focusX - side * 8, 30, 65),
        look: vec(ball.x + side * 12, 1, ball.z * 0.25),
      };
    },
    posSpeed: 1.2,
    lookSpeed: 1.8,
  },

  // Low behind the ball — feel like the tracking camera chasing a run
  follow: {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(ball.x - side * 22, 9, ball.z * 0.6 + 20),
        look: vec(ball.x + side * 14, 2.5, ball.z * 0.4),
      };
    },
    posSpeed: 3.5,
    lookSpeed: 5,
  },

  // Dribble chase — tight, low to the ground, glued behind the ball.
  // Used when a single player is carrying the ball; the camera tracks
  // the ball travelling on the floor rather than arcing through the air.
  dribble: {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        // Lower & closer than 'follow' — runs along the ground with the ball
        pos: vec(ball.x - side * 11, 3.6, ball.z + 9),
        look: vec(ball.x + side * 9, 1.2, ball.z),
      };
    },
    posSpeed: 5.5,   // snappier so the camera stays glued to the carrier
    lookSpeed: 6.5,
  },

  // Low touchline camera — tracks ball's x, fixed depth
  side: {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(ball.x - side * 3, 5, 40),
        look: vec(ball.x + side * 8, 2, ball.z * 0.3),
      };
    },
    posSpeed: 4,
    lookSpeed: 5,
  },

  // Elevated behind attacking goal, tracking ball on approach
  'behind-goal': {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(goalX + side * 14, 10, ball.z * 0.25 + 24),
        look: vec(ball.x, 3, ball.z * 0.5),
      };
    },
    posSpeed: 2.5,
    lookSpeed: 4,
  },

  // Low in front of goal — always shows ball coming IN to net
  close: {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(goalX - side * 19, 3.5, 11),
        look: vec(ball.x, ball.y + 0.5, ball.z),
      };
    },
    posSpeed: 5,
    lookSpeed: 7,
  },

  // Goalkeeper POV — camera sits behind/just above the keeper looking out at
  // the incoming ball. Ball flies AT the camera dramatically.
  'keeper-pov': {
    compute: (ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(goalX + side * 1.6, 1.85, 0),       // just behind goal line, head height
        look: vec(ball.x, ball.y + 0.2, ball.z),     // staring at the ball
      };
    },
    posSpeed: 6,
    lookSpeed: 8,
  },

  // Crowd-pan — after the goal, camera tilts up from the net to the back of
  // the stand to sell the celebration before the birds-eye replay.
  'crowd-pan': {
    compute: (_ball, goalX) => {
      const side = goalX > 0 ? 1 : -1;
      return {
        pos: vec(goalX - side * 14, 8, 14),
        look: vec(goalX + side * 80, 38, 0),         // way up & past the goal into the crowd
      };
    },
    posSpeed: 2.4,
    lookSpeed: 2.4,
  },

  // Cable-cam — elevated rail running along the touchline, sweeping with play.
  // Used for long tactical build-ups (Cambiasso, Champions League moves).
  'cable-cam': {
    compute: (ball) => {
      return {
        pos: vec(ball.x * 0.6, 22, 38),              // high, mid-pitch, follows x
        look: vec(ball.x, 1.2, ball.z * 0.5),
      };
    },
    posSpeed: 2.2,
    lookSpeed: 3.0,
  },
};

// After goal: broadcast-style elevated side shot showing the entire pitch.
// Camera is off the touchline, high enough to frame the full 110×60 pitch
// in a landscape viewport (FOV 42). The trail of play is clearly visible.
export function getBirdsEyeShot(_goalX: number): Shot {
  return {
    pos: vec(0, 55, 78),
    look: vec(8, 0, 0),
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
