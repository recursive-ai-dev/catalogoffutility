/**
 * Comprehensive Validation Service with Schema Validation
 * Uses Zod-like validation for runtime type safety
 */

import { GameCommand } from '../types/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ValidationService {
  private static instance: ValidationService;

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  async validateCommand(command: GameCommand): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!command.type) {
      errors.push('Command type is required');
    }

    if (!command.timestamp) {
      errors.push('Command timestamp is required');
    }

    // Command-specific validation
    switch (command.type) {
      case 'TRAVEL_TO_LOCATION':
        this.validateTravelCommand(command, errors, warnings);
        break;
      case 'SELECT_NPC':
        this.validateSelectNPCCommand(command, errors, warnings);
        break;
      case 'ANSWER_QUESTION':
        this.validateAnswerCommand(command, errors, warnings);
        break;
      case 'UPDATE_SETTINGS':
        this.validateSettingsCommand(command, errors, warnings);
        break;
      case 'SET_SANITY':
        this.validateSetSanityCommand(command, errors, warnings);
        break;
      case 'ADD_INVENTORY_ITEM':
        this.validateAddInventoryItemCommand(command, errors, warnings);
        break;
      case 'APPLY_COSMETIC':
        this.validateApplyCosmeticCommand(command, errors, warnings);
        break;
      case 'APPLY_UNLOCK':
        this.validateApplyUnlockCommand(command, errors, warnings);
        break;
      case 'UPDATE_ACHIEVEMENT_PROGRESS':
        this.validateUpdateAchievementProgressCommand(command, errors, warnings);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private validateSetSanityCommand(command: any, errors: string[], warnings: string[]): void {
    const sanity = command.payload?.sanity;
    if (typeof sanity !== 'number') {
      errors.push('Sanity must be a number');
    } else if (sanity < 0 || sanity > 120) {
      warnings.push('Sanity value will be clamped to valid range (0-120)');
    }
  }
  
  private validateAddInventoryItemCommand(command: any, errors: string[], warnings: string[]): void {
    const item = command.payload?.item;
    if (!item) {
      errors.push('Item is required for add inventory command');
      return;
    }
    
    if (!item.id || typeof item.id !== 'string') {
      errors.push('Item must have a valid ID');
    }
    
    if (!item.name || typeof item.name !== 'string') {
      errors.push('Item must have a valid name');
    }
    
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push('Item quantity must be a positive number');
    }
  }
  
  private validateApplyCosmeticCommand(command: any, errors: string[], warnings: string[]): void {
    if (!command.payload?.cosmeticId || typeof command.payload.cosmeticId !== 'string') {
      errors.push('Cosmetic ID is required and must be a string');
    }
    
    if (!command.payload?.cosmeticType || typeof command.payload.cosmeticType !== 'string') {
      errors.push('Cosmetic type is required and must be a string');
    }
  }
  
  private validateApplyUnlockCommand(command: any, errors: string[], warnings: string[]): void {
    if (!command.payload?.unlockId || typeof command.payload.unlockId !== 'string') {
      errors.push('Unlock ID is required and must be a string');
    }
    
    if (!command.payload?.unlockType || typeof command.payload.unlockType !== 'string') {
      errors.push('Unlock type is required and must be a string');
    }
  }
  
  private validateUpdateAchievementProgressCommand(command: any, errors: string[], warnings: string[]): void {
    const { achievementId, progress, maxProgress } = command.payload || {};
    
    if (!achievementId || typeof achievementId !== 'string') {
      errors.push('Achievement ID is required and must be a string');
    }
    
    if (typeof progress !== 'number' || progress < 0) {
      errors.push('Progress must be a non-negative number');
    }
    
    if (typeof maxProgress !== 'number' || maxProgress <= 0) {
      errors.push('Max progress must be a positive number');
    }
    
    if (typeof progress === 'number' && typeof maxProgress === 'number' && progress > maxProgress) {
      warnings.push('Progress exceeds max progress - will be clamped');
    }
  }

  private validateTravelCommand(command: any, errors: string[], warnings: string[]): void {
    if (!command.payload?.locationId) {
      errors.push('Location ID is required for travel command');
    }

    if (typeof command.payload.locationId !== 'string') {
      errors.push('Location ID must be a string');
    }
  }

  private validateSelectNPCCommand(command: any, errors: string[], warnings: string[]): void {
    if (!command.payload?.npcId) {
      errors.push('NPC ID is required for select command');
    }
  }

  private validateAnswerCommand(command: any, errors: string[], warnings: string[]): void {
    if (!command.payload?.npcId) {
      errors.push('NPC ID is required for answer command');
    }

    if (!['A', 'B'].includes(command.payload?.answer)) {
      errors.push('Answer must be either "A" or "B"');
    }
  }

  private validateSettingsCommand(command: any, errors: string[], warnings: string[]): void {
    const settings = command.payload?.settings;
    if (!settings) {
      errors.push('Settings object is required');
      return;
    }

    if (settings.musicVolume !== undefined) {
      if (typeof settings.musicVolume !== 'number' || settings.musicVolume < 0 || settings.musicVolume > 100) {
        errors.push('Music volume must be a number between 0 and 100');
      }
    }

    if (settings.soundVolume !== undefined) {
      if (typeof settings.soundVolume !== 'number' || settings.soundVolume < 0 || settings.soundVolume > 100) {
        errors.push('Sound volume must be a number between 0 and 100');
      }
    }
  }

  validateGameState(state: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Sanity validation
    if (typeof state.sanity !== 'number' || state.sanity < 0 || state.sanity > 120) {
      errors.push('Sanity must be a number between 0 and 120');
    }

    // Days survived validation
    if (typeof state.daysSurvived !== 'number' || state.daysSurvived < 0) {
      errors.push('Days survived must be a non-negative number');
    }

    // Location validation
    if (!state.currentLocation || typeof state.currentLocation !== 'string') {
      errors.push('Current location must be a valid string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}