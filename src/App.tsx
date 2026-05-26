import { useEffect, useState } from 'react';
import { Game } from './game/Game';
import { Splash } from './game/Splash';
import { HowToPlay, shouldSkipHowToPlay } from './game/HowToPlay';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { audio } from './lib/audio';

type Screen = 'splash' | 'howto' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [exiting, setExiting] = useState(false);
  const resetRound = useGameStore((s) => s.resetRound);
  const audioEnabled = useSettingsStore((s) => s.audio);
  useEffect(() => { audio.setMuted(!audioEnabled); }, [audioEnabled]);

  function handleStart() {
    audio.init();
    audio.setMuted(!useSettingsStore.getState().audio);
    setExiting(true);
    setTimeout(() => {
      setScreen(shouldSkipHowToPlay() ? 'game' : 'howto');
    }, 480);
  }

  function handleHowToClose() {
    setScreen('game');
  }

  function handleQuit() {
    setScreen('splash');
    setExiting(false);
    resetRound();
  }

  if (screen === 'splash') return <Splash onStart={handleStart} exiting={exiting} />;
  if (screen === 'howto')  return <HowToPlay onClose={handleHowToClose} />;
  return <Game onQuit={handleQuit} />;
}
