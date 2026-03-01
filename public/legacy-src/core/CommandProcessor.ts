/**
 * Modular Command Processor Implementation
 * Handles all game commands with a plugin-based architecture for extensibility
 */

import { GameCommand, CommandResult, GameState } from '../types/core';
import { GameState as GameStateGame } from '../types/game';
import { GameEngine } from './GameEngine';
import { ValidationService } from '../services/ValidationService';
import { gameLogicService } from '../services/gameLogicService';
import { CacheService } from '../services/cacheService';
import { contentLoader } from '../services/contentLoader';

/**
 * Interface for command handlers to ensure consistent processing
 */
interface CommandHandler {
  type: string;
  handle(command: GameCommand, currentState: GameState, gameEngine: GameEngine, cacheService: CacheService): Promise<CommandResult> | CommandResult;
}

export class CommandProcessor {
  private commandHistory: GameCommand[] = [];
  private undoStack: GameCommand[] = [];
  private validationService: ValidationService;
  private cacheServiceInstance: CacheService;
  private handlers: Map<string, CommandHandler> = new Map();

  constructor(private gameEngine: GameEngine) {
    this.validationService = ValidationService.getInstance();
    this.cacheServiceInstance = CacheService.getInstance();
    this.registerHandlers();
  }

  /**
   * Registers all command handlers for different command types
   */
  private registerHandlers(): void {
    this.handlers.set('TRAVEL_TO_LOCATION', {
      type: 'TRAVEL_TO_LOCATION',
      handle: (command, currentState, gameEngine, cacheService) => this.handleTravelCommand(command, currentState, gameEngine, cacheService)
    });
    this.handlers.set('SELECT_NPC', {
      type: 'SELECT_NPC',
      handle: (command, currentState, gameEngine) => this.handleSelectNPCCommand(command, currentState, gameEngine)
    });
    this.handlers.set('ANSWER_QUESTION', {
      type: 'ANSWER_QUESTION',
      handle: (command, currentState, gameEngine, cacheService) => this.handleAnswerCommand(command, currentState, gameEngine, cacheService)
    });
    this.handlers.set('OPEN_DOOR', {
      type: 'OPEN_DOOR',
      handle: (command, currentState, gameEngine) => this.handleOpenDoorCommand(command, currentState, gameEngine)
    });
    this.handlers.set('RESET_GAME', {
      type: 'RESET_GAME',
      handle: (command, currentState, gameEngine, cacheService) => this.handleResetCommand(command, currentState, gameEngine, cacheService)
    });
    this.handlers.set('UPDATE_SETTINGS', {
      type: 'UPDATE_SETTINGS',
      handle: (command, currentState, gameEngine, cacheService) => this.handleSettingsCommand(command, currentState, gameEngine, cacheService)
    });
    this.handlers.set('UNLOCK_ACHIEVEMENT', {
      type: 'UNLOCK_ACHIEVEMENT',
      handle: (command, currentState, gameEngine) => this.handleUnlockAchievementCommand(command, currentState, gameEngine)
    });
    this.handlers.set('SET_SANITY', {
      type: 'SET_SANITY',
      handle: (command, currentState, gameEngine) => this.handleSetSanityCommand(command, currentState, gameEngine)
    });
    this.handlers.set('ADD_INVENTORY_ITEM', {
      type: 'ADD_INVENTORY_ITEM',
      handle: (command, currentState, gameEngine) => this.handleAddInventoryItemCommand(command, currentState, gameEngine)
    });
    this.handlers.set('APPLY_COSMETIC', {
      type: 'APPLY_COSMETIC',
      handle: (command, currentState, gameEngine) => this.handleApplyCosmeticCommand(command, currentState, gameEngine)
    });
    this.handlers.set('APPLY_UNLOCK', {
      type: 'APPLY_UNLOCK',
      handle: (command, currentState, gameEngine) => this.handleApplyUnlockCommand(command, currentState, gameEngine)
    });
    this.handlers.set('UPDATE_ACHIEVEMENT_PROGRESS', {
      type: 'UPDATE_ACHIEVEMENT_PROGRESS',
      handle: (command, currentState, gameEngine) => this.handleUpdateAchievementProgressCommand(command, currentState, gameEngine)
    });
  }

  /**
   * Executes a game command using the appropriate handler
   */
  async execute<T extends GameCommand>(command: T): Promise<CommandResult> {
    // Validate command
    const validation = await this.validationService.validateCommand(command);
    if (!validation.isValid) {
      throw new Error(`Invalid command: ${validation.errors.join(', ')}`);
    }

    // Find the appropriate handler
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`Unknown command type: ${command.type}`);
    }

    // Execute command using handler
    const result = await handler.handle(command, this.gameEngine.getState(), this.gameEngine, this.cacheServiceInstance);
    
    // Add to history
    this.commandHistory.push(command);
    this.undoStack = []; // Clear undo stack on new command
    
    return result;
  }

  private handleTravelCommand(command: any, currentState: GameState, gameEngine: GameEngine, cacheService: CacheService): CommandResult {
    const { locationId } = command.payload;
    
    try {
      const stateChanges = gameLogicService.processLocationTravel(currentState as unknown as GameStateGame, locationId);
      
      // Update state through state manager
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        Object.assign(draft, stateChanges);
      });
      
      // Emit state change event
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: Object.keys(stateChanges) as Array<keyof GameState>
        }
      });
      
      // Save state if returning to cabin
      if (locationId === 'cabin') {
        cacheService.saveGameState(newState);
      }
      
      return { success: true, data: { newLocation: locationId } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleSelectNPCCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { npcId } = command.payload;
    
    try {
      const selectedNPC = currentState.currentNPCs.find(npc => npc.id === npcId);
      if (!selectedNPC) {
        throw new Error('NPC not found');
      }
      
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.selectedNPC = selectedNPC;
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['selectedNPC']
        }
      });
      
      return { success: true, data: { selectedNPC } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleAnswerCommand(command: any, currentState: GameState, gameEngine: GameEngine, cacheService: CacheService): CommandResult {
    const { npcId, answer } = command.payload;
    
    try {
      // Find the question for this NPC using content loader
      const question = contentLoader.getQuestionByNpcId(npcId);
      
      if (!question) {
        throw new Error('Question not found for NPC');
      }
      
      const stateChanges = gameLogicService.processQuestionAnswer(
        currentState as unknown as GameStateGame, 
        npcId, 
        answer, 
        question.correctAnswer
      );
      
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        Object.assign(draft, stateChanges);
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: Object.keys(stateChanges) as Array<keyof GameState>
        }
      });
      
      // Track analytics
      cacheService.trackEvent('question_answered', {
        npcId,
        answer,
        correct: answer === question.correctAnswer,
        sanityAfter: newState.sanity
      });
      
      // Add high score if game ends
      if (newState.sanity === 0) {
        const score = gameLogicService.calculateSurvivalScore(
          newState.daysSurvived,
          currentState.sanity,
          newState.answeredNPCs.size
        );
        cacheService.addHighScore(newState.daysSurvived, currentState.sanity, score);
      }
      
      return { 
        success: true, 
        data: { 
          correct: answer === question.correctAnswer,
          sanityChange: newState.sanity - currentState.sanity
        } 
      };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleOpenDoorCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    try {
      const availableLocations = gameLogicService.generateTravelOptions(
        currentState.visitedLocations as unknown as Set<string>,
        currentState.daysSurvived
      );
      
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.availableLocations = availableLocations;
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['availableLocations']
        }
      });
      
      return { success: true, data: { availableLocations } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleResetCommand(command: any, currentState: GameState, gameEngine: GameEngine, cacheService: CacheService): CommandResult {
    try {
      // Clear saved state
      cacheService.set('ibt2-game-state-v2', null);
      
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.sanity = 100;
        draft.daysSurvived = 0;
        draft.currentLocation = 'cabin';
        draft.visitedLocations = new Set(['cabin']);
        draft.answeredNPCs = new Set();
        draft.isInCabin = true;
        draft.availableLocations = [];
        draft.currentNPCs = [];
        draft.selectedNPC = null;
        // Reset new fields
        draft.achievementProgress = new Map();
        draft.inventory = [];
        draft.appliedCosmetics = new Set();
        draft.unlockedFeatures = new Set();
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['sanity', 'daysSurvived', 'currentLocation', 'visitedLocations', 'answeredNPCs', 'isInCabin', 'availableLocations', 'currentNPCs', 'selectedNPC', 'achievementProgress', 'inventory', 'appliedCosmetics', 'unlockedFeatures']
        }
      });
      
      // Track reset event
      cacheService.trackEvent('game_reset', {
        previousDays: currentState.daysSurvived,
        previousSanity: currentState.sanity
      });
      
      return { success: true, data: { message: 'Game reset successfully' } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleSettingsCommand(command: any, currentState: GameState, gameEngine: GameEngine, cacheService: CacheService): CommandResult {
    const { settings } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        Object.assign(draft.settings, settings);
      });
      
      // Save settings
      cacheService.saveSettings(newState.settings);
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['settings']
        }
      });
      
      return { success: true, data: { updatedSettings: settings } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private handleUnlockAchievementCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { achievementId } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.achievements.add(achievementId);
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['achievements']
        }
      });
      
      return { success: true, data: { achievementId } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  canUndo(): boolean {
    return this.commandHistory.length > 0;
  }

  canRedo(): boolean {
    return this.undoStack.length > 0;
  }

  async undo(): Promise<CommandResult | null> {
    if (!this.canUndo()) return null;

    const lastCommand = this.commandHistory.pop()!;
    this.undoStack.push(lastCommand);
    
    // Execute inverse command
    const inverseCommand = this.createInverseCommand(lastCommand);
    return this.executeCommand(inverseCommand);
  }

  async redo(): Promise<CommandResult | null> {
    if (!this.canRedo()) return null;

    const command = this.undoStack.pop()!;
    return this.execute(command);
  }

  private executeCommand(command: GameCommand): Promise<CommandResult> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`Unknown command type: ${command.type}`);
    }
    return Promise.resolve(handler.handle(command, this.gameEngine.getState(), this.gameEngine, this.cacheServiceInstance));
  }

  private handleSetSanityCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { sanity, reason } = command.payload;
    
    try {
      // Validate sanity bounds
      const clampedSanity = Math.max(0, Math.min(120, sanity));
      
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.sanity = clampedSanity;
      });
      
      gameEngine.emit({
        type: 'SanityChanged',
        timestamp: Date.now(),
        data: {
          oldValue: currentState.sanity,
          newValue: clampedSanity,
          delta: clampedSanity - currentState.sanity,
          reason: reason || 'Reward claimed'
        }
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['sanity']
        }
      });
      
      return { success: true, data: { newSanity: clampedSanity, delta: clampedSanity - currentState.sanity } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }
  
  private handleAddInventoryItemCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { item } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        // Check if item already exists and update quantity
        const existingItemIndex = draft.inventory.findIndex((i: any) => i.id === item.id);
        if (existingItemIndex >= 0) {
          draft.inventory[existingItemIndex].quantity += item.quantity;
        } else {
          draft.inventory.push(item);
        }
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['inventory']
        }
      });
      
      return { success: true, data: { addedItem: item } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }
  
  private handleApplyCosmeticCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { cosmeticId, cosmeticType } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.appliedCosmetics.add(cosmeticId);
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['appliedCosmetics']
        }
      });
      
      return { success: true, data: { appliedCosmetic: cosmeticId, type: cosmeticType } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }
  
  private handleApplyUnlockCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { unlockId, unlockType } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.unlockedFeatures.add(unlockId);
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['unlockedFeatures']
        }
      });
      
      return { success: true, data: { unlockedFeature: unlockId, type: unlockType } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }
  
  private handleUpdateAchievementProgressCommand(command: any, currentState: GameState, gameEngine: GameEngine): CommandResult {
    const { achievementId, progress, maxProgress } = command.payload;
    
    try {
      const stateManager = (gameEngine as any).stateManager;
      const newState = stateManager.updateState((draft: any) => {
        draft.achievementProgress.set(achievementId, {
          achievementId,
          currentProgress: progress,
          maxProgress,
          lastUpdated: new Date().toISOString()
        });
      });
      
      gameEngine.emit({
        type: 'StateChanged',
        timestamp: Date.now(),
        data: {
          previousState: currentState,
          newState: newState,
          changedKeys: ['achievementProgress']
        }
      });
      
      return { success: true, data: { achievementId, progress, maxProgress } };
    } catch (error) {
      return { success: false, data: null, error: (error as Error).message };
    }
  }

  private createInverseCommand(command: GameCommand): GameCommand {
    // Create inverse commands for undo functionality
    switch (command.type) {
      case 'TRAVEL_TO_LOCATION':
        return {
          type: 'TRAVEL_TO_LOCATION',
          timestamp: Date.now(),
          payload: { locationId: 'cabin' } // Return to cabin
        };
      default:
        throw new Error(`Cannot create inverse for command: ${command.type}`);
    }
  }
}
