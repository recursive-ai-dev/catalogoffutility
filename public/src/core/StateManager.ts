/**
 * Immutable State Manager with Time Travel Debugging
 * Uses Immer for perfect immutability and performance
 */

import { produce, Draft } from 'immer';
import { GameState, SanityLevel, createLocationId } from '../types/core';
import { CacheService } from '../services/cacheService';

export class StateManager {
  private currentState: GameState;
  private stateHistory: GameState[] = [];
  private maxHistorySize = 100;
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
    this.currentState = this.getInitialState();
  }

  async initialize(): Promise<void> {
    const savedState = await this.cacheService.loadGameState();
    if (savedState) {
      this.currentState = savedState;
    }
  }

  getCurrentState(): Readonly<GameState> {
    return this.currentState;
  }

  updateState<T extends keyof GameState>(
    updater: (draft: Draft<GameState>) => void
  ): GameState {
    const newState = produce(this.currentState, updater);
    
    // Add to history for time travel debugging
    this.stateHistory.push(this.currentState);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    this.currentState = newState;
    return newState;
  }

  // Time travel debugging methods
  canUndo(): boolean {
    return this.stateHistory.length > 0;
  }

  undo(): GameState | null {
    if (!this.canUndo()) return null;
    
    const previousState = this.stateHistory.pop()!;
    this.currentState = previousState;
    return previousState;
  }

  getStateHistory(): ReadonlyArray<GameState> {
    return [...this.stateHistory];
  }

  async persist(): Promise<void> {
    await this.cacheService.saveGameState(this.currentState);
  }

  private getInitialState(): GameState {
    return {
      sanity: 100 as SanityLevel,
      daysSurvived: 0,
      currentLocation: createLocationId('cabin'),
      visitedLocations: new Set([createLocationId('cabin')]),
      answeredNPCs: new Set(),
      isInCabin: true,
      availableLocations: [],
      currentNPCs: [],
      selectedNPC: null,
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
        },
        performance: {
          quality: 'auto',
          frameRate: 'auto',
          enableAnimations: true,
        },
      },
      achievements: new Set(),
      achievementProgress: new Map(),
      solvedPuzzles: 0,
      inventory: [],
      appliedCosmetics: new Set(),
      unlockedFeatures: new Set(),
      completedEvents: [],
      dailyStreak: 0
    };
  }
}
