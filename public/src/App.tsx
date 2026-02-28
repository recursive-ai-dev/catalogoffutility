import React, { useState } from 'react';
import { GameProvider } from './components/enhanced/GameProvider';
import { GameInterface } from './components/GameInterface';
import { HorrorIntro } from './components/HorrorIntro';
import { GameIntro } from './components/GameIntro';

// --- App Shell ---
export const App: React.FC = () => {
  const [introPhase, setIntroPhase] = useState<'horror' | 'game' | 'complete'>('horror');

  // Handle intro completion
  const handleHorrorIntroComplete = () => {
    setIntroPhase('game');
  };

  const handleGameIntroComplete = () => {
    setIntroPhase('complete');
  };

  return (
    <>
      {introPhase === 'horror' && <HorrorIntro onComplete={handleHorrorIntroComplete} />}
      {introPhase === 'game' && <GameIntro onComplete={handleGameIntroComplete} />}
      {introPhase === 'complete' && (
        <GameProvider>
          <GameInterface />
        </GameProvider>
      )}
    </>
  );
};
