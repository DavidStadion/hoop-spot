import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scene } from '../scene/Scene';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import styles from './Game.module.css';

type LabelPos = { label: string; x: number; y: number; isGoal: boolean; idx: number };

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const goal = useGameStore((s) => s.goal);
  const phase = useGameStore((s) => s.phase);
  const birdsEye = useGameStore((s) => s.birdsEye);
  const exploring = useGameStore((s) => s.exploring);
  const { setLabel, setPhase, setBirdsEye, setExploring, setCinematic, triggerGoalStinger } = useGameStore();
  const [wpLabels, setWpLabels] = useState<LabelPos[]>([]);
  const projRafRef = useRef(0);

  // Whether labels should be projected + shown
  const showLabels = birdsEye || phase === 'guessing' || phase === 'correct' || phase === 'wrong';

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scene = new Scene(canvas);
    sceneRef.current = scene;
    const unmount = scene.mount(canvas.parentElement!);
    return () => {
      unmount();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.refreshPitch();
    const settings = useSettingsStore.getState();
    scene.applyAtmosphere(
      settings.lighting ? (goal.meta.lighting ?? 'day') : 'day',
      settings.weather  ? (goal.meta.weather  ?? 'clear') : 'clear',
    );
    scene.animator.reset();
    scene.animator.on('waypoint', ({ label }) => setLabel(label));
    scene.animator.on('label-hide', () => setLabel(''));
    scene.animator.on('birds-eye-start', () => setBirdsEye(true));
    scene.animator.on('birds-eye-end', () => setBirdsEye(false));
    scene.animator.on('complete', () => {
      scene.freezeTrail();
      setPhase('guessing');
    });
    scene.animator.on('goal-scored', ({ x, z }) => {
      scene.triggerShake(620, 0.65);
      scene.triggerGoalBurst(x, z);
    });
    scene.animator.on('cinematic-start', () => setCinematic(true));
    scene.animator.on('cinematic-end',   () => setCinematic(false));
    scene.animator.on('goal-stinger',    () => triggerGoalStinger());
  }, [goal]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const scene = sceneRef.current;
    if (!scene) return;
    // Reset before play — so Replay starts from a clean state
    scene.animator.reset();
    setExploring(false);
    setWpLabels([]);
    scene.animator.playGoal(goal);
  }, [phase, goal]);

  // Live-apply atmosphere whenever weather/lighting settings change
  const settingsWeather  = useSettingsStore((s) => s.weather);
  const settingsLighting = useSettingsStore((s) => s.lighting);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.applyAtmosphere(
      settingsLighting ? (goal.meta.lighting ?? 'day') : 'day',
      settingsWeather  ? (goal.meta.weather  ?? 'clear') : 'clear',
    );
  }, [settingsWeather, settingsLighting, goal]);

  // Pre-kickoff camera: slow orbit by default, or a cinematic fly-in for
  // 'flyIn' special goals — descends from 140m up to the starting waypoint.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (phase === 'countdown') {
      const useFlyIn = goal.meta.specials?.includes('flyIn');
      if (useFlyIn) {
        const start = goal.buildup[0];
        scene.startFlyIn(start.x, start.z);
      } else {
        scene.startIdleOrbit();
      }
    } else {
      scene.stopIdleOrbit();
      scene.stopFlyIn();
    }
  }, [phase, goal]);

  // Toggle OrbitControls
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (exploring) scene.enableExplore();
    else scene.disableExplore();
  }, [exploring]);

  // Disable explore when answered
  useEffect(() => {
    if (phase === 'correct' || phase === 'wrong' || phase === 'idle') {
      setExploring(false);
    }
  }, [phase]);

  // Project waypoint labels whenever they should show (continuous RAF)
  useEffect(() => {
    cancelAnimationFrame(projRafRef.current);
    if (!showLabels) {
      setWpLabels([]);
      return;
    }
    const project = () => {
      const scene = sceneRef.current;
      const canvas = canvasRef.current;
      if (!scene || !canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const positions: LabelPos[] = goal.buildup.map((wp, idx) => {
        const v = new THREE.Vector3(wp.x, 0, wp.z);
        v.project(scene.camera);
        return { label: wp.label, x: (v.x + 1) / 2 * w, y: (-v.y + 1) / 2 * h, isGoal: wp.isGoal ?? false, idx };
      });
      setWpLabels(positions);
      projRafRef.current = requestAnimationFrame(project);
    };
    projRafRef.current = requestAnimationFrame(project);
    return () => cancelAnimationFrame(projRafRef.current);
  }, [showLabels, goal]);

  const showGuessBtn = phase === 'guessing' && exploring;

  return (
    <div className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {wpLabels.map((lp) => (
        <div
          key={lp.idx}
          className={`${styles.waypointLabel} ${lp.isGoal ? styles.waypointGoal : ''}`}
          style={{ left: lp.x, top: lp.y, animationDelay: birdsEye ? `${lp.idx * 90}ms` : '0ms' }}
        >
          <span className={styles.waypointStep}>{lp.idx + 1}</span>
          {lp.label}
        </div>
      ))}

      {showGuessBtn && (
        <div className={styles.exploreActive}>
          <span className={styles.exploreHint}>Drag to orbit · Pinch to zoom</span>
          <button className={styles.guessBtn} onClick={() => setExploring(false)}>
            Make your guess →
          </button>
        </div>
      )}
    </div>
  );
}
