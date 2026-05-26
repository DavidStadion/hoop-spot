import { useEffect, useState } from 'react';
import { Game } from './game/Game';
import { Splash } from './game/Splash';
import { HowToPlay, shouldSkipHowToPlay } from './game/HowToPlay';
import { StatsBombMode } from './game/StatsBombMode';
import { ClubMode } from './game/ClubMode';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { audio } from './lib/audio';

type Screen = 'splash' | 'howto' | 'game' | 'statsbomb' | 'clubmode';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [exiting, setExiting] = useState(false);
  const resetRound = useGameStore((s) => s.resetRound);
  const audioEnabled = useSettingsStore((s) => s.audio);
  useEffect(() => { audio.setMuted(!audioEnabled); }, [audioEnabled]);

  function handleStart() {
    // First user gesture — safe to init AudioContext now
    audio.init();
    audio.setMuted(!useSettingsStore.getState().audio);
    setExiting(true);
    setTimeout(() => {
      setScreen(shouldSkipHowToPlay() ? 'game' : 'howto');
    }, 480);
  }

  function handleStatsBomb() {
    audio.init();
    audio.setMuted(!useSettingsStore.getState().audio);
    setScreen('statsbomb');
  }

  function handlePickClub() {
    audio.init();
    audio.setMuted(!useSettingsStore.getState().audio);
    setScreen('clubmode');
  }

  function handleHowToClose() {
    setScreen('game');
  }

  function handleQuit() {
    setScreen('splash');
    setExiting(false);
    resetRound();
  }

  if (screen === 'splash')    return <Splash onStart={handleStart} onStatsBomb={handleStatsBomb} onPickClub={handlePickClub} exiting={exiting} />;
  if (screen === 'howto')     return <HowToPlay onClose={handleHowToClose} />;
  if (screen === 'statsbomb') return <StatsBombMode onBack={() => setScreen('splash')} onPlay={() => setScreen('game')} />;
  if (screen === 'clubmode')  return <ClubMode onBack={() => setScreen('splash')} onPlay={() => setScreen('game')} />;
  return <Game onQuit={handleQuit} />;
}
