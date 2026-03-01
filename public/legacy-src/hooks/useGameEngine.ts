/**
 * Enhanced Game Engine Hook with Location Pool Management
 * Integrates location pool system for no-repeat gameplay
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useImmer } from 'use-immer';
import { GameEngine } from '../core/GameEngine';
import { GameState, GameCommand, GameEvent } from '../types/core';
import { eventBus } from '../core/EventBus';
import { gameLogicService } from '../services/gameLogicService';
import { contentLoader } from '../services/contentLoader';
import { CacheService } from '../services/cacheService';
import { AchievementService } from '../services/achievementService';
import { rewardsService } from '../services/rewardsService';
import { errorHandlingService } from '../services/errorHandlingService';
import { storyService } from '../services/storyService';

export interface UseGameEngineOptions {
  autoStart?: boolean;
  enableTimeTravel?: boolean;
  enableDevTools?: boolean;
}

export interface UseGameEngineReturn {
  state: GameState;
  executeCommand: <T extends GameCommand>(command: T) => Promise<void>;
  subscribe: <T extends GameEvent>(eventType: string, handler: (event: T) => void) => () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useGameEngine(options: UseGameEngineOptions = {}): UseGameEngineReturn {
  const { autoStart = true, enableTimeTravel = false, enableDevTools = false } = options;
  
  const engineRef = useRef<GameEngine>();
  const [state, updateState] = useImmer<GameState>(() => ({
    sanity: 100 as any as any,
    daysSurvived: 0,
    currentLocation: 'cabin' as any,
    visitedLocations: new Set(['cabin'] as any),
    answeredNPCs: new Set(),
    isInCabin: true,
    availableLocations: [] as any,
    currentNPCs: [],
    selectedNPC: null,
    solvedPuzzles: 0,
    completedEvents: [],
    dailyStreak: 0,
    settings: {
      musicVolume: 75,
      soundVolume: 75,
      colorScheme: 'terminal',
      fullScreen: false,
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        fontSize: 'medium',
        colorBlindSupport: false,
        subtitles: false
      },
      performance: {
        quality: 'auto',
        frameRate: 'auto',
        enableAnimations: true,
        enableParticles: true,
        videoQuality: 'medium',
        preloadAssets: false
      },
      notifications: {
        achievements: true,
        warnings: true,
        tips: true,
        soundEffects: true
      }
    },
    achievements: [] as any,
    inventory: [] as any,
    stats: {
      totalPlayTime: 0,
      locationsVisited: 0,
      npcsEncountered: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      achievementsUnlocked: 0,
      itemsFound: 0,
      deathCount: 0,
      averageSanity: 100,
      longestSurvival: 0,
      favoriteLocation: 'cabin',
      playStyle: {
        explorer: 20,
        philosopher: 20,
        survivor: 20,
        socializer: 20,
        risktaker: 20
      }
    } as any,
    preferences: {
      autoSave: true,
      confirmActions: false,
      showHints: true,
      skipIntros: false,
      fastText: false
    } as any
  }));

  const [isLoading, setIsLoading] = useImmer(false);
  const [error, setError] = useImmer<Error | null>(null);
  const [canUndo, setCanUndo] = useImmer(false);
  const [canRedo, setCanRedo] = useImmer(false);

  // Track previous state for achievement triggers
  const previousStateRef = useRef<GameState>(state);

  // Initialize game engine with content loading and location pool
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize content loader first - this will handle all content loading
        await gameLogicService.initialize();
        console.log('Dynamic content system initialized');
        
        // Load saved game state if available
        const savedState = await CacheService.getInstance().loadGameState();
        if (savedState) {
          updateState(draft => {
            try {
              Object.assign(draft, savedState);
              // Ensure Sets and Maps are properly restored
              if (savedState.visitedLocations) {
                draft.visitedLocations = new Set(Array.isArray(savedState.visitedLocations) 
                  ? savedState.visitedLocations 
                  : ['cabin']);
              }
              if (savedState.answeredNPCs) {
                draft.answeredNPCs = new Set(Array.isArray(savedState.answeredNPCs) 
                  ? savedState.answeredNPCs 
                  : []);
              }
              if (savedState.achievements) {
                draft.achievements = new Set(Array.isArray(savedState.achievements) 
                  ? savedState.achievements 
                  : []);
              }
              if (savedState.achievementProgress) {
                draft.achievementProgress = new Map(Array.isArray(savedState.achievementProgress) 
                  ? savedState.achievementProgress 
                  : []);
              }
              if (savedState.appliedCosmetics) {
                draft.appliedCosmetics = new Set(Array.isArray(savedState.appliedCosmetics) 
                  ? savedState.appliedCosmetics 
                  : []);
              }
              if (savedState.unlockedFeatures) {
                draft.unlockedFeatures = new Set(Array.isArray(savedState.unlockedFeatures) 
                  ? savedState.unlockedFeatures 
                  : []);
              }
              if (savedState.inventory) {
                draft.inventory = Array.isArray(savedState.inventory) 
                  ? savedState.inventory 
                  : [];
              }
              
              // Reset location pool based on visited locations
              if (savedState.isInCabin) {
                // If in cabin, reset pool completely
                contentLoader.resetLocationPool();
              } else {
                // If not in cabin, remove visited locations from pool
                const visitedNonCabin = Array.from(draft.visitedLocations).filter(loc => loc !== 'cabin');
                visitedNonCabin.forEach(locationId => {
                  contentLoader.removeLocationFromPool(locationId);
                });
              }
            } catch (err) {
              errorHandlingService.handleGameStateError(err as Error, { savedState });
            }
          });
        } else {
          // New game - ensure location pool is reset
          contentLoader.resetLocationPool();
        }

        engineRef.current = GameEngine.getInstance();
        
        // Set up RewardsService integration
        if (typeof window !== 'undefined') {
          const { rewardsService } = await import('../services/rewardsService');
          rewardsService.setGameEngine(engineRef.current);
        }
        
        if (autoStart) {
          await engineRef.current.start();
        }

        // Subscribe to canonical engine state events.
        const unsubscribe = engineRef.current.subscribe('StateChanged' as any, (event: any) => {
          try {
            const nextState = event?.data?.newState || event?.data;
            if (!nextState) {
              return;
            }

            updateState(draft => {
              Object.assign(draft, nextState);
            });
          } catch (err) {
            errorHandlingService.handleGameStateError(err as Error, { event });
          }
        });

        // Setup dev tools if enabled
        if (enableDevTools && typeof window !== 'undefined') {
          (window as any).__GAME_ENGINE__ = engineRef.current;
          (window as any).__CONTENT_LOADER__ = contentLoader;
          (window as any).__ERROR_SERVICE__ = errorHandlingService;
        }

        // Start performance monitoring
        errorHandlingService.monitorPerformance();

        setIsLoading(false);
        return unsubscribe;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setIsLoading(false);
        errorHandlingService.reportError({
          type: 'game_logic',
          severity: 'critical',
          message: `Game engine initialization failed: ${error.message}`,
          stack: error.stack
        });
      }
    };

    const cleanup = initializeEngine();
    
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [autoStart, enableDevTools, updateState, setIsLoading, setError]);

  // Auto-save functionality with error handling
  useEffect(() => {
    // Check for autoSave property in state to maintain compatibility
    const autoSave = (state as any).preferences?.autoSave;
    if (autoSave && state.daysSurvived > 0) {
      const saveTimer = setTimeout(async () => {
        try {
          await CacheService.getInstance().saveGameState(state);
        } catch (err) {
          errorHandlingService.handleStorageError(err as Error, { state });
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(saveTimer);
    }
  }, [state]);

  // Achievement and reward checking with error handling
  useEffect(() => {
    const checkAchievementsAndRewards = async () => {
      try {
        const previousState = previousStateRef.current;
        
        // No direct achievement checks needed as AchievementService listens to state changes
        // via events in its own implementation.

        // Update rewards availability
        await rewardsService.updateRewardAvailability(state as any);
        
        // Update previous state reference
        previousStateRef.current = state;
      } catch (err) {
        errorHandlingService.reportError({
          type: 'game_logic',
          severity: 'medium',
          message: `Achievement/reward check failed: ${(err as Error).message}`,
          stack: (err as Error).stack,
          context: { state, previousState: previousStateRef.current }
        });
      }
    };

    checkAchievementsAndRewards();
  }, [state]);

  // Execute command with enhanced game logic integration and location pool management
  const executeCommand = useCallback(async <T extends GameCommand>(command: T) => {
    if (!engineRef.current) {
      throw new Error('Game engine not initialized');
    }

    try {
      setError(null);
      
      // Validate command structure
      if (!command.type || !command.timestamp) {
        throw new Error('Invalid command structure');
      }
      
      // Process command through enhanced game logic service
      let stateChanges: Partial<GameState> = {};
      let achievementTrigger = '';
      let achievementData: any = {};
      
      switch (command.type) {
        case 'TRAVEL_TO_LOCATION':
          try {
            stateChanges = gameLogicService.processLocationTravel(state as any, (command as any).payload.locationId) as any;
            achievementTrigger = 'location_visited';
            const location = contentLoader.getLocationById((command as any).payload.locationId);
            achievementData = { locationIndex: location?.index };
            
            // Log location pool status
            const poolStatus = gameLogicService.getLocationPoolStatus();
            console.log('Location pool status after travel:', poolStatus);
          } catch (err) {
            errorHandlingService.handleGameStateError(err as Error, { command, state });
            throw err;
          }
          break;
          
        case 'ANSWER_QUESTION':
          try {
            const { npcId, answer } = (command as any).payload;
            const question = contentLoader.getQuestionByNpcId(npcId);
            if (question) {
              stateChanges = gameLogicService.processQuestionAnswer(state as any, npcId, answer, question.correctAnswer) as any;
              achievementTrigger = answer === question.correctAnswer ? 'correct_answer' : 'incorrect_answer';
              
              // Update stats safely with type assertion
              (stateChanges as any).stats = {
                ...((state as any).stats || {}),
                questionsAnswered: (((state as any).stats)?.questionsAnswered || 0) + 1,
                correctAnswers: (((state as any).stats)?.correctAnswers || 0) + (answer === question.correctAnswer ? 1 : 0)
              };
            }
          } catch (err) {
            errorHandlingService.handleGameStateError(err as Error, { command, state });
            throw err;
          }
          break;
          
        case 'OPEN_DOOR':
          try {
            const availableLocations = gameLogicService.generateTravelOptions(state.visitedLocations as any, state.daysSurvived) as any;
            stateChanges = { availableLocations: availableLocations as any };
            
            // Log available locations and pool status
            const poolStatus = gameLogicService.getLocationPoolStatus();
            console.log('Door opened - Available locations:', availableLocations.length, 'Pool status:', poolStatus);
          } catch (err) {
            errorHandlingService.handleGameStateError(err as Error, { command, state });
            throw err;
          }
          break;
          
        case 'SELECT_NPC':
          try {
            const selectedNPC = state.currentNPCs.find(npc => npc.id === (command as any).payload.npcId);
            stateChanges = { selectedNPC: selectedNPC || null };
          } catch (err) {
            errorHandlingService.handleGameStateError(err as Error, { command, state });
            throw err;
          }
          break;
          
        case 'RESET_GAME':
          try {
            // Reset location pool when game resets
            contentLoader.resetLocationPool();
            
            stateChanges = {
              sanity: 100 as any as any,
              daysSurvived: 0,
              currentLocation: 'cabin' as any,
              visitedLocations: new Set(['cabin'] as any) as any,
              answeredNPCs: new Set(),
              isInCabin: true,
              availableLocations: [],
              currentNPCs: [],
              selectedNPC: null,
              stats: {
                ...((state as any).stats || {}),
                deathCount: (((state as any).stats)?.deathCount || 0) + 1
              }
            } as any;
            await CacheService.getInstance().clearAll();
            
            console.log('Game reset - Location pool restored');
          } catch (err) {
            errorHandlingService.handleStorageError(err as Error, { command, state });
            throw err;
          }
          break;
          
        case 'UPDATE_SETTINGS':
          try {
            const newSettings = (command as any).payload.settings;
            stateChanges = {
              settings: { ...state.settings, ...newSettings }
            };
            await CacheService.getInstance().saveSettings(stateChanges.settings as any);
            
            // Check for theme achievement
            if (newSettings.colorScheme) {
              const usedThemes = JSON.parse(localStorage.getItem('usedThemes') || '[]');
              if (!usedThemes.includes(newSettings.colorScheme)) {
                usedThemes.push(newSettings.colorScheme);
                localStorage.setItem('usedThemes', JSON.stringify(usedThemes));
                // No direct call needed; achievement will be checked via state change event
              }
            }
          } catch (err) {
            errorHandlingService.handleStorageError(err as Error, { command, state });
            throw err;
          }
          break;
          
        default:
          // Additional command types are handled by the core engine/command processor.
          stateChanges = {};
          break;
      }
      
      // Apply state changes safely with type assertion
      updateState(draft => {
        try {
          Object.assign(draft, stateChanges as any);
        } catch (err) {
          errorHandlingService.handleGameStateError(err as Error, { stateChanges, draft });
          throw err;
        }
      });
      
      // Update story progress based on the command
      if (command.type === 'TRAVEL_TO_LOCATION' || command.type === 'ANSWER_QUESTION' || command.type === 'OPEN_DOOR') {
        storyService.updateStoryProgress(state as any);
      }
      
      // Publish event for state change
      eventBus.publish({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: { commandType: command.type, payload: command.payload, stateChanges }
      });
      
      // Trigger achievements if applicable
      if (achievementTrigger) {
        // No direct achievement check needed; handled by AchievementService internally
      }
      
      await engineRef.current.executeCommand(command);
    } catch (err) {
      const error = err as Error;
      setError(error);
      errorHandlingService.reportError({
        type: 'game_logic',
        severity: 'high',
        message: `Command execution failed: ${error.message}`,
        stack: error.stack,
        context: { command, state }
      });
      throw err;
    }
  }, [state, updateState, setError]);

  // Subscribe to events with error handling
    const subscribe = useCallback(<T extends GameEvent>(
    eventType: string,
    handler: (event: T) => void
  ) => {
    if (!engineRef.current) {
      return () => {};
    }
    
    const wrappedHandler = (event: any) => {
      try {
        handler(event as T);
      } catch (err) {
        errorHandlingService.reportError({
          type: 'ui',
          severity: 'medium',
          message: `Event handler failed: ${(err as Error).message}`,
          context: { eventType, event }
        });
      }
    };
    
    return engineRef.current.subscribe(eventType as any, wrappedHandler);
  }, []);

  // Time travel functions with error handling
  const undo = useCallback(async () => {
    if (!engineRef.current || !enableTimeTravel) return;
    
    try {
      console.log('Undo functionality');
    } catch (err) {
      setError(err as Error);
      errorHandlingService.reportError({
        type: 'game_logic',
        severity: 'medium',
        message: `Undo failed: ${(err as Error).message}`
      });
    }
  }, [enableTimeTravel, setError]);

  const redo = useCallback(async () => {
    if (!engineRef.current || !enableTimeTravel) return;
    
    try {
      console.log('Redo functionality');
    } catch (err) {
      setError(err as Error);
      errorHandlingService.reportError({
        type: 'game_logic',
        severity: 'medium',
        message: `Redo failed: ${(err as Error).message}`
      });
    }
  }, [enableTimeTravel, setError]);

  // Memoized return value for performance
  return useMemo(() => ({
    state,
    executeCommand,
    subscribe,
    canUndo,
    canRedo,
    undo,
    redo,
    isLoading,
    error
  }), [state, executeCommand, subscribe, canUndo, canRedo, undo, redo, isLoading, error]);
}

// Specialized hooks for specific game actions
export function useGameActions() {
  const { executeCommand } = useGameEngine();

  const travelToLocation = useCallback(async (locationId: string) => {
    await executeCommand({
      type: 'TRAVEL_TO_LOCATION',
      timestamp: Date.now(),
      payload: { locationId: locationId as any }
    });
  }, [executeCommand]);

  const selectNPC = useCallback(async (npcId: string) => {
    await executeCommand({
      type: 'SELECT_NPC',
      timestamp: Date.now(),
      payload: { npcId: npcId as any }
    });
  }, [executeCommand]);

  const answerQuestion = useCallback(async (npcId: string, answer: 'A' | 'B') => {
    await executeCommand({
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: { npcId: npcId as any, answer }
    });
  }, [executeCommand]);

  const openDoor = useCallback(async () => {
    await executeCommand({
      type: 'OPEN_DOOR',
      timestamp: Date.now(),
      payload: {}
    });
  }, [executeCommand]);

  const resetGame = useCallback(async () => {
    await executeCommand({
      type: 'RESET_GAME',
      timestamp: Date.now(),
      payload: {}
    });
  }, [executeCommand]);

  const updateSettings = useCallback(async (settings: any) => {
    await executeCommand({
      type: 'UPDATE_SETTINGS',
      timestamp: Date.now(),
      payload: { settings }
    });
  }, [executeCommand]);
  
  const setSanity = useCallback(async (sanity: number, reason?: string) => {
    await executeCommand({
      type: 'SET_SANITY',
      timestamp: Date.now(),
      payload: { sanity, reason }
    });
  }, [executeCommand]);
  
  const addInventoryItem = useCallback(async (item: any) => {
    await executeCommand({
      type: 'ADD_INVENTORY_ITEM',
      timestamp: Date.now(),
      payload: { item }
    });
  }, [executeCommand]);
  
  const applyCosmetic = useCallback(async (cosmeticId: string, cosmeticType: string) => {
    await executeCommand({
      type: 'APPLY_COSMETIC',
      timestamp: Date.now(),
      payload: { cosmeticId, cosmeticType }
    });
  }, [executeCommand]);
  
  const applyUnlock = useCallback(async (unlockId: string, unlockType: string) => {
    await executeCommand({
      type: 'APPLY_UNLOCK',
      timestamp: Date.now(),
      payload: { unlockId, unlockType }
    });
  }, [executeCommand]);
  
  const updateAchievementProgress = useCallback(async (achievementId: string, progress: number, maxProgress: number) => {
    await executeCommand({
      type: 'UPDATE_ACHIEVEMENT_PROGRESS',
      timestamp: Date.now(),
      payload: { achievementId, progress, maxProgress }
    });
  }, [executeCommand]);

  return {
    travelToLocation,
    selectNPC,
    answerQuestion,
    openDoor,
    resetGame,
    updateSettings,
    setSanity,
    addInventoryItem,
    applyCosmetic,
    applyUnlock,
    updateAchievementProgress
  };
}
