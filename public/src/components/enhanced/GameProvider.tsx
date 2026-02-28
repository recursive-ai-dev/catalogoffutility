/**
 * Advanced Game Context Provider with Error Boundaries
 * Implements perfect React patterns with TypeScript
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useGameEngine, UseGameEngineReturn } from '../../hooks/useGameEngine';
import { GameState } from '../../types/core';

interface GameContextValue extends UseGameEngineReturn {
  // Additional context-specific methods
  resetError: () => void;
  getSelectors: () => GameStateSelectors;
}

interface GameStateSelectors {
  getSanityLevel: () => 'healthy' | 'concerned' | 'critical' | 'danger';
  getLocationDangerLevel: () => 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  getProgressPercentage: () => number;
  getAvailableActions: () => string[];
  canTravel: () => boolean;
  canInteract: () => boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  enableDevTools?: boolean;
  enableTimeTravel?: boolean;
}

function GameErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Game Engine Error</h1>
        <p className="mb-4 text-red-200">
          Something went wrong with the game engine. This is likely a temporary issue.
        </p>
        <pre className="bg-red-800 p-2 rounded text-xs mb-4 overflow-auto">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
}

export function GameProvider({ children, enableDevTools = false, enableTimeTravel = false }: GameProviderProps) {
  const gameEngine = useGameEngine({
    autoStart: true,
    enableDevTools,
    enableTimeTravel
  });

  const resetError = () => {
    // Reset error state
    window.location.reload();
  };

  const getSelectors = (): GameStateSelectors => {
    const state = gameEngine.state;
    
    return {
      getSanityLevel: () => {
        if (state.sanity >= 80) return 'healthy';
        if (state.sanity >= 50) return 'concerned';
        if (state.sanity >= 20) return 'critical';
        return 'danger';
      },
      
      getLocationDangerLevel: () => {
        // Implementation based on current location
        return 'safe';
      },
      
      getProgressPercentage: () => {
        return Math.min(100, (state.daysSurvived / 30) * 100);
      },
      
      getAvailableActions: () => {
        const actions: string[] = [];
        if (state.isInCabin) {
          actions.push('open_door', 'view_album', 'read_manual', 'adjust_settings');
        } else {
          actions.push('return_to_cabin');
          if (state.currentNPCs.length > 0) {
            actions.push('interact_with_npc');
          }
        }
        return actions;
      },
      
      canTravel: () => {
        return state.availableLocations.length > 0;
      },
      
      canInteract: () => {
        return state.selectedNPC !== null && !state.answeredNPCs.has(state.selectedNPC.id as any);
      }
    };
  };

  const contextValue: GameContextValue = {
    ...gameEngine,
    resetError,
    getSelectors
  };

  return (
    <ErrorBoundary
      FallbackComponent={GameErrorFallback}
      onReset={resetError}
      resetKeys={[gameEngine.state.daysSurvived]} // Reset on game restart
    >
      <GameContext.Provider value={contextValue}>
        {children}
      </GameContext.Provider>
    </ErrorBoundary>
  );
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Specialized hooks for different aspects of the game
export function useGameState(): GameState {
  const { state } = useGame();
  return state;
}

export function useGameActions() {
  const { executeCommand } = useGame();
  
  return {
    travelToLocation: (locationId: string) => executeCommand({
      type: 'TRAVEL_TO_LOCATION',
      timestamp: Date.now(),
      payload: { locationId: locationId as any }
    }),
    
    selectNPC: (npcId: string) => executeCommand({
      type: 'SELECT_NPC',
      timestamp: Date.now(),
      payload: { npcId: npcId as any }
    }),
    
    answerQuestion: (npcId: string, answer: 'A' | 'B') => executeCommand({
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: { npcId: npcId as any, answer }
    }),
    
    openDoor: () => executeCommand({
      type: 'OPEN_DOOR',
      timestamp: Date.now(),
      payload: {}
    }),
    
    resetGame: () => executeCommand({
      type: 'RESET_GAME',
      timestamp: Date.now(),
      payload: {}
    }),
    
    updateSettings: (settings: any) => executeCommand({
      type: 'UPDATE_SETTINGS',
      timestamp: Date.now(),
      payload: { settings }
    }),
    
    setSanity: (sanity: number, reason?: string) => executeCommand({
      type: 'SET_SANITY',
      timestamp: Date.now(),
      payload: { sanity, reason }
    }),
    
    addInventoryItem: (item: any) => executeCommand({
      type: 'ADD_INVENTORY_ITEM',
      timestamp: Date.now(),
      payload: { item }
    }),
    
    applyCosmetic: (cosmeticId: string, cosmeticType: string) => executeCommand({
      type: 'APPLY_COSMETIC',
      timestamp: Date.now(),
      payload: { cosmeticId, cosmeticType }
    }),
    
    applyUnlock: (unlockId: string, unlockType: string) => executeCommand({
      type: 'APPLY_UNLOCK',
      timestamp: Date.now(),
      payload: { unlockId, unlockType }
    }),
    
    updateAchievementProgress: (achievementId: string, progress: number, maxProgress: number) => executeCommand({
      type: 'UPDATE_ACHIEVEMENT_PROGRESS',
      timestamp: Date.now(),
      payload: { achievementId, progress, maxProgress }
    })
  };
}

export function useGameSelectors() {
  const { getSelectors } = useGame();
  return getSelectors();
}
