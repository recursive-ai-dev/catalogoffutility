import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { audioService } from '../services/audioService';

interface PuzzleMiniGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (sanityBonus: number) => void;
  locationId: string;
}

export function PuzzleMiniGame({ isOpen, onClose, onComplete, locationId }: PuzzleMiniGameProps) {
  const { game } = useTranslation();
  const [puzzleState, setPuzzleState] = useState<'idle' | 'active' | 'completed'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      generatePuzzle();
      setPuzzleState('active');
    }
  }, [isOpen]);

  const generatePuzzle = () => {
    const newSequence = Array.from({ length: 5 }, () => Math.floor(Math.random() * 4));
    setSequence(newSequence);
    setPlayerSequence([]);
    setCurrentStep(0);
  };

  const handlePlayerInput = (index: number) => {
    if (puzzleState !== 'active') return;

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    if (index !== sequence[currentStep]) {
      audioService.playSound('/audio/error.mp3');
      setPuzzleState('idle');
      setTimeout(() => {
        alert(game.puzzleFailed || 'Puzzle failed! Try again.');
        setPlayerSequence([]);
        setCurrentStep(0);
        setPuzzleState('active');
      }, 300);
      return;
    }

    audioService.playSound('/audio/click.mp3');
    setCurrentStep(currentStep + 1);

    if (newPlayerSequence.length === sequence.length) {
      setPuzzleState('completed');
      audioService.playSound('/audio/success.mp3');
      setTimeout(() => {
        onComplete(10); // Award 10 sanity points
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="retro-panel bg-pixel-dark border-2 border-pixel-accent p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4 glowing-text">
          {game.puzzleTitle || 'Mystic Puzzle'}
        </h2>
        <p className="text-sm text-gray-300 mb-6">
          {game.puzzleDescription || 'Solve the sequence to unlock a sanity bonus.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => handlePlayerInput(index)}
              className={`p-6 rounded-lg border-2 ${
                puzzleState === 'active' &&
                sequence[currentStep] === index &&
                playerSequence.length <= currentStep
                  ? 'bg-green-500 border-green-700 animate-pulse'
                  : puzzleState === 'completed' && sequence.includes(index)
                  ? 'bg-green-700 border-green-900'
                  : playerSequence.includes(index)
                  ? 'bg-blue-700 border-blue-900'
                  : 'bg-pixel-gray border-pixel-accent'
              } hover:bg-pixel-accent transition-colors duration-200`}
              disabled={puzzleState !== 'active'}
            >
              <span className="text-lg font-bold">
                {['A', 'B', 'C', 'D'][index]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="retro-button px-4 py-2 text-sm animate-pulse"
          >
            {game.close || 'Close'}
          </button>
          {puzzleState === 'completed' && (
            <span className="text-green-400 font-bold animate-fade-in">
              {game.puzzleCompleted || 'Puzzle Completed! +10 Sanity'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
