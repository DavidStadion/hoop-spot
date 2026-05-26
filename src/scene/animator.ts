import * as THREE from 'three';
import type { Goal, CameraShot } from '../data/types';
import { Ball } from './ball';
import type { GoalHandle } from './goal';
import type { Trail } from './trail';
import { getSettings } from '../store/settingsStore';
import { audio } from '../lib/audio';

type Events = {
  waypoint: (wp: { label: string; isGoal?: boolean }) => void;
  'label-hide': () => void;
  'birds-eye-start': () => void;
  'birds-eye-end': () => void;
  'goal-scored': (pos: { x: number; z: number }) => void;
  'cinematic-start': () => void;
  'cinematic-end': () => void;
  'goal-stinger': () => void;
  complete: () => void;
};
type Listener<T extends keyof Events> = Events[T];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Animator {
  private ball: Ball;
  private goals: Map<number, GoalHandle>;
  private trail: Trail;
  private listeners: Partial<{ [K in keyof Events]: Listener<K>[] }> = {};

  // Read every frame by Scene tick for dynamic cameras
  activeShotType: CameraShot | null = null;
  attackingGoalX = 55;
  birdsEyeActive = false;

  constructor(
    ball: Ball,
    goals: Map<number, GoalHandle>,
    trail: Trail,
  ) {
    this.ball = ball;
    this.goals = goals;
    this.trail = trail;
  }

  on<K extends keyof Events>(event: K, fn: Listener<K>) {
    if (!this.listeners[event]) this.listeners[event] = [] as never;
    (this.listeners[event] as Listener<K>[]).push(fn);
  }

  private emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
    const fns = this.listeners[event] as ((...a: Parameters<Events[K]>) => void)[] | undefined;
    fns?.forEach((f) => f(...args));
  }

  async playGoal(goal: Goal) {
    const wps = goal.buildup;
    this.trail.clear();
    this.birdsEyeActive = false;

    // Determine which goal we're attacking from the last waypoint
    const lastWp = wps[wps.length - 1];
    this.attackingGoalX = lastWp.x > 0 ? 55 : -55;

    this.ball.place(wps[0].x, wps[0].z);
    this.activeShotType = 'wide';

    // Audio: kickoff whistle + start crowd ambient
    if (getSettings().audio) {
      audio.startCrowd(0.16);
      audio.whistle();
    }

    this.emit('waypoint', { label: wps[0].label });
    await wait(900);

    const specials = goal.meta.specials ?? [];
    const hasKeeperPov = specials.includes('keeperPov');
    const hasCrowdPan  = specials.includes('crowdPan');
    const hasCableCam  = specials.includes('cableCam');

    for (let i = 1; i < wps.length; i++) {
      const prev = wps[i - 1];
      const curr = wps[i];

      this.emit('label-hide');

      const settings = getSettings();

      // Switch camera shot — dynamic system picks it up immediately.
      // Dribble waypoints use the dedicated tight chase camera unless disabled.
      const useDribbleCam = curr.dribble && settings.dribbleCam;
      // For 'cableCam' goals: middle waypoints (not first, not last, not dribble) use the cable-cam shot
      const isMiddleWaypoint = i > 1 && i < wps.length - 1;
      const useCableCam = hasCableCam && isMiddleWaypoint && !curr.dribble;
      // For 'keeperPov' goals: the strike itself uses the keeper-POV camera
      const useKeeperPov = hasKeeperPov && curr.isGoal;

      this.activeShotType =
        useKeeperPov  ? 'keeper-pov' :
        useCableCam   ? 'cable-cam'  :
        useDribbleCam ? 'dribble'    :
        curr.camera;

      // Cinematic mode kicks in for the goal shot (if enabled in settings)
      if (curr.isGoal && settings.cinematic) {
        this.emit('cinematic-start');
        // Small extra beat of anticipation before the strike
        await wait(280);
      } else {
        // Small lead before ball moves so camera starts swinging first
        await wait(180);
      }

      const dist = Math.hypot(curr.x - prev.x, curr.z - prev.z);
      // Dribbles: ball stays on the floor (no arc), ground end height.
      // Passes/shots: existing arc logic.
      const arcHeight = curr.dribble ? 0 : (curr.arc ?? (curr.isGoal ? 2.2 : dist > 20 ? 3.5 : 0.3));
      const endY = curr.dribble ? 0.32 : (curr.endY ?? 0.32);
      // The goal shot plays in slow-mo (×1.7 duration) if cinematic enabled
      const baseDur = curr.duration ?? 900;
      const dur = (curr.isGoal && settings.cinematic) ? Math.round(baseDur * 1.7) : baseDur;

      // Audio: kick / shot sound + crowd swell on the strike
      if (settings.audio) {
        if (curr.isGoal) {
          audio.kick(1.3);
          audio.crowdSwell(0.4, 0.15, 0.4, 0.6);
        } else if (!curr.dribble) {
          audio.kick(0.85);
        }
      }

      await this.ball.move(prev, curr, dur, arcHeight, this.trail, endY, curr.dribble ?? false);

      if (curr.isGoal) {
        const goalX = curr.x > 0 ? 55 : -55;
        this.goals.get(goalX)?.ripple();
        this.emit('goal-scored', { x: curr.x, z: curr.z });
        if (settings.audio) audio.goalRoar();
        this.emit('goal-stinger');  // The Cinematic component decides whether to render it
        this.emit('waypoint', { label: curr.label, isGoal: true });

        // Hold close (or keeper-POV) shot on the ball in the net
        await wait(900);

        // Crowd-pan special: tilt up to the back of the stand before birds-eye
        if (hasCrowdPan) {
          this.activeShotType = 'crowd-pan';
          await wait(1100);
        }

        if (settings.cinematic) this.emit('cinematic-end');

        // Birds-eye: Scene tick reads this flag and animates up
        // Hold long enough for player labels to appear and be read
        this.emit('birds-eye-start');
        this.birdsEyeActive = true;
        await wait(3500);
        this.birdsEyeActive = false;
        this.emit('birds-eye-end');
      } else {
        this.emit('waypoint', { label: curr.label });
        await wait(480);
      }
    }

    this.activeShotType = null;
    // Crowd fades out as the round closes for guessing
    if (getSettings().audio) audio.stopCrowd();
    this.emit('complete');
  }

  reset() {
    audio.stopCrowd();
    this.ball.hide();
    this.trail.clear();
    this.activeShotType = null;
    this.birdsEyeActive = false;
    this.emit('label-hide');
  }
}
