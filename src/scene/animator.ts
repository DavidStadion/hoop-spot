import type { Play, CameraShot, ShotType, Waypoint } from '../data/types';
import { Ball } from './ball';
import type { HoopHandle } from './hoop';
import type { Trail } from './trail';
import { getSettings } from '../store/settingsStore';
import { audio } from '../lib/audio';

type Events = {
  waypoint: (wp: { label: string; isBasket?: boolean }) => void;
  'label-hide': () => void;
  'birds-eye-start': () => void;
  'birds-eye-end': () => void;
  'basket-scored': (pos: { x: number; z: number }) => void;
  'cinematic-start': () => void;
  'cinematic-end': () => void;
  'basket-stinger': () => void;
  complete: () => void;
};
type Listener<T extends keyof Events> = Events[T];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Hoop rim is at x = ±12.75 (1.575 m from baseline of a 28.65 m court).
export const HOOP_X = 12.75;

/** Arc height (metres) per shot type, used when the waypoint doesn't override. */
function arcFor(shotType: ShotType, dist: number): number {
  switch (shotType) {
    case 'dribble':   return 0;
    case 'pass':      return dist > 6 ? 1.1 : 0.25;
    case 'layup':     return 1.4;
    case 'dunk':      return 0.8;            // ascending drive then slam — low arc
    case 'jumpShot':  return 4.0;
    case 'three':     return 4.8;
    case 'freeThrow': return 4.2;
    default:          return 1.0;
  }
}

/** Settle height of the ball at the END of the segment (metres). */
function endYFor(wp: Waypoint, shotType: ShotType): number {
  if (wp.endY != null) return wp.endY;
  if (wp.isBasket) return 3.05;              // ball at rim height (just dropped through)
  if (shotType === 'dribble') return 0.32;
  return 0.32;
}

export class Animator {
  private ball: Ball;
  private hoops: Map<number, HoopHandle>;
  private trail: Trail;
  private listeners: Partial<{ [K in keyof Events]: Listener<K>[] }> = {};

  // Read every frame by Scene tick for dynamic cameras
  activeShotType: CameraShot | null = null;
  attackingGoalX = HOOP_X;
  birdsEyeActive = false;

  constructor(ball: Ball, hoops: Map<number, HoopHandle>, trail: Trail) {
    this.ball = ball;
    this.hoops = hoops;
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

  async playGoal(play: Play) {
    const wps = play.buildup;
    this.trail.clear();
    this.birdsEyeActive = false;

    const lastWp = wps[wps.length - 1];
    this.attackingGoalX = lastWp.x > 0 ? HOOP_X : -HOOP_X;

    this.ball.place(wps[0].x, wps[0].z);
    this.activeShotType = 'wide';

    if (getSettings().audio) {
      audio.startCrowd(0.16);
      audio.whistle();
    }

    this.emit('waypoint', { label: wps[0].label });
    await wait(900);

    const specials = play.meta.specials ?? [];
    const hasSwishCam  = specials.includes('swishCam');
    const hasCableCam  = specials.includes('cableCam');

    for (let i = 1; i < wps.length; i++) {
      const prev = wps[i - 1];
      const curr = wps[i];

      this.emit('label-hide');

      const settings = getSettings();
      const isBasket = !!(curr.isBasket || curr.isGoal);
      const shotType: ShotType =
        curr.shotType ?? (curr.dribble ? 'dribble' : isBasket ? 'jumpShot' : 'pass');
      const isDribble = shotType === 'dribble';

      // Camera selection
      const useDribbleCam = isDribble && settings.dribbleCam;
      const isMiddleWaypoint = i > 1 && i < wps.length - 1;
      const useCableCam = hasCableCam && isMiddleWaypoint && !isDribble;
      const useSwishCam = hasSwishCam && isBasket;

      this.activeShotType =
        useSwishCam   ? 'swish-cam' :
        useCableCam   ? 'cable-cam' :
        useDribbleCam ? 'dribble'   :
        curr.camera;

      // Cinematic mode on the basket
      if (isBasket && settings.cinematic) {
        this.emit('cinematic-start');
        await wait(280);
      } else {
        await wait(180);
      }

      const dist = Math.hypot(curr.x - prev.x, curr.z - prev.z);
      const arcHeight = curr.arc ?? arcFor(shotType, dist);
      const endY = endYFor(curr, shotType);
      const baseDur = curr.duration ?? 900;
      const dur = (isBasket && settings.cinematic) ? Math.round(baseDur * 1.7) : baseDur;

      // Audio per shot type
      if (settings.audio) {
        if (isBasket) {
          // shot release sound, then swish on landing handled below
          if (shotType === 'dunk')      audio.kick(1.1);
          else if (shotType === 'three') audio.kick(0.75);
          else                           audio.kick(0.85);
          audio.crowdSwell(0.4, 0.15, 0.4, 0.6);
        } else if (isDribble) {
          // dribble bounces are emitted by the ball mid-flight (see Ball)
        } else {
          audio.pass();
        }
      }

      await this.ball.move(prev, curr, dur, arcHeight, this.trail, endY, isDribble);

      if (isBasket) {
        const hoopX = curr.x > 0 ? HOOP_X : -HOOP_X;
        this.hoops.get(hoopX)?.ripple();
        this.emit('basket-scored', { x: curr.x, z: curr.z });
        if (settings.audio) {
          audio.swish();
          audio.basketRoar();
        }
        this.emit('basket-stinger');
        this.emit('waypoint', { label: curr.label, isBasket: true });

        // Hold the closeup on the rim for a beat — much better than panning
        // to a broken crowd shot in the indoor arena.
        await wait(1500);

        if (settings.cinematic) this.emit('cinematic-end');

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
