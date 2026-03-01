import React, { useState, useEffect } from 'react';
import { AchievementUnlockedEvent } from '../../types/core';
import { useGameEngine } from '../../hooks/useGameEngine';

export const AchievementNotification: React.FC = () => {
  const [achievement, setAchievement] = useState<{
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const gameEngine = useGameEngine();

  useEffect(() => {
    if (!gameEngine) return;

    const handleAchievementUnlocked = (event: AchievementUnlockedEvent) => {
      setAchievement({
        id: event.data.achievementId,
        name: event.data.name,
        description: event.data.description,
        rarity: event.data.rarity,
      });
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const unsubscribe = gameEngine.subscribe<AchievementUnlockedEvent>('AchievementUnlocked', handleAchievementUnlocked);

    return () => {
      unsubscribe();
    };
  }, [gameEngine]);

  if (!achievement || !isVisible) return null;

  // Define colors based on rarity
  let borderColor = '';
  let textColor = '';
  switch (achievement.rarity) {
    case 'common':
      borderColor = 'border-gray-400';
      textColor = 'text-gray-300';
      break;
    case 'rare':
      borderColor = 'border-blue-400';
      textColor = 'text-blue-300';
      break;
    case 'epic':
      borderColor = 'border-purple-400';
      textColor = 'text-purple-300';
      break;
    case 'legendary':
      borderColor = 'border-yellow-400';
      textColor = 'text-yellow-300';
      break;
  }

  return (
    <div
      className={`fixed top-4 right-4 bg-gray-900 ${borderColor} border-2 p-4 rounded-lg shadow-lg z-50 max-w-xs animate-fade-in-out`}
      role="alert"
    >
      <h3 className={`text-xl font-bold ${textColor} mb-1`}>{achievement.name}</h3>
      <p className="text-gray-300 text-sm">{achievement.description}</p>
    </div>
  );
};
