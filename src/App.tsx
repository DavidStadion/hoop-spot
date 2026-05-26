import { useEffect, useState } from 'react';
import { Game } from './game/Game';
import { Splash } from './game/Splash';
import { HowToPlay, shouldSkipHowToPlay } from './game/HowToPlay';
import { TeamMode } from './game/TeamMode';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { audio } from './lib/audio';

type Screen = 'splash' | 'howto' | 'game' | 'teams';

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

  function handlePickTeam() {
    setScreen('teams');
  }

  function handleHowToClose() {
    setScreen('game');
  }

  function handleQuit() {
    setScreen('splash');
    setExiting(false);
    resetRound();
  }

  if (screen === 'splash') return <Splash onStart={handleStart} onPickTeam={handlePickTeam} exiting={exiting} />;
  if (screen === 'howto')  return <HowToPlay onClose={handleHowToClose} />;
  if (screen === 'teams')  return <TeamMode onBack={() => setScreen('splash')} />;
  return <Game onQuit={handleQuit} />;
}
