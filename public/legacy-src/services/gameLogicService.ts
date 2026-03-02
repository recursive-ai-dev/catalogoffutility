/**
 * Enhanced Game Logic Service with Dynamic Location Scanning
 * Scans location folder every game load for accurate counts
 */

import { GameState, NPC, Location, StoryImpact } from '../types/game';
import { contentLoader } from './contentLoader';

class GameLogicService {
  private static instance: GameLogicService;
  private contentLoaded = false;
  
  private constructor() {}
  
  static getInstance(): GameLogicService {
    if (!GameLogicService.instance) {
      GameLogicService.instance = new GameLogicService();
    }
    return GameLogicService.instance;
  }

  async initialize(): Promise<void> {
    // ALWAYS reload content on every game initialization
    console.log('🔄 Initializing game logic - scanning locations folder...');
    await contentLoader.loadAllContent();
    this.contentLoaded = true;
    console.log('✅ Game logic initialized with fresh location scan');
    // Initialize tutorial if not completed
    this.initializeTutorial();
  }

  private initializeTutorial(): void {
    const gameStateStr = localStorage.getItem('ibt2-game-state-v2');
    if (!gameStateStr) return;
    const gameState = JSON.parse(gameStateStr);
    if (!gameState.tutorialCompleted) {
      gameState.tutorialStep = 0;
      gameState.tutorialCompleted = false;
      localStorage.setItem('ibt2-game-state-v2', JSON.stringify(gameState));
      console.log('🆕 Tutorial initialized for new player');
    }
  }

  // Enhanced NPC generation using dynamic content
  generateNPCs(locationId: string, locationIndex: number): NPC[] {
    return contentLoader.generateCharactersForLocation(locationId);
  }

  // Enhanced travel options using location pool management
  generateTravelOptions(visitedLocations: Set<string>, currentDay: number): string[] {
    return contentLoader.generateTravelOptions(visitedLocations, currentDay);
  }

  // Enhanced sanity calculation with adaptive difficulty based on player performance
  calculateSanityPenalty(locationIndex: number, isCorrectAnswer: boolean): number {
    if (isCorrectAnswer) return 0;
    
    // Get location-specific danger level
    const location = contentLoader.getAllLocations().find(loc => loc.index === locationIndex);
    const dangerMultiplier = location ? (location.dangerLevel || 1) : 1;
    
    // Get player performance metrics from game state
    let performanceModifier = 1;
    try {
      const gameStateStr = localStorage.getItem('ibt2-game-state-v2');
      if (gameStateStr) {
        const gameState = JSON.parse(gameStateStr);
        const answeredCount = gameState.answeredNPCs ? gameState.answeredNPCs.length : 0;
        const daysSurvived = gameState.daysSurvived || 0;
        const sanity = gameState.sanity || 100;
        // Increase difficulty if player has high success rate or long survival
        if (answeredCount > 10 || daysSurvived > 10) {
          performanceModifier = 1.2 + (answeredCount + daysSurvived) * 0.01;
        }
        // Reduce difficulty if player is struggling with low sanity
        if (sanity < 30) {
          performanceModifier *= 0.8;
        }
      }
    } catch (error) {
      console.error('Error calculating performance modifier:', error);
    }
    
    // Base penalty system with danger level scaling and performance adjustment
    const basePenalties: Record<number, number> = {
      1: 5 * dangerMultiplier * performanceModifier,
      2: 10 * dangerMultiplier * performanceModifier,
      3: 20 * dangerMultiplier * performanceModifier,
      4: 50 * dangerMultiplier * performanceModifier
    };
    
    if (locationIndex <= 4) {
      const basePenalty = basePenalties[locationIndex] || 5;
      // Add some randomization (±20% of base penalty)
      const variation = Math.floor(basePenalty * 0.2 * (Math.random() - 0.5));
      return Math.max(1, basePenalty + variation);
    } else {
      // High-level locations: 70-100% sanity loss with danger scaling and performance adjustment
      return Math.floor((70 + Math.random() * 30) * dangerMultiplier * performanceModifier);
    }
  }

  // Provide personalized feedback to player based on action outcome and history
  getFeedbackMessage(isCorrectAnswer: boolean, locationId: string, actionType: string): string {
    const location = contentLoader.getLocationById(locationId);
    const locationName = location ? location.name : "Unknown Place";
    let feedback = "";
    if (actionType === "answer") {
      const gameStateStr = localStorage.getItem('ibt2-game-state-v2');
      let answeredCount = 0;
      if (gameStateStr) {
        const gameState = JSON.parse(gameStateStr);
        answeredCount = gameState.answeredNPCs ? gameState.answeredNPCs.length : 0;
      }
      if (isCorrectAnswer) {
        feedback = `Your insight shines in ${locationName}! Correct answer!`;
        if (answeredCount > 5) feedback += ` You've answered ${answeredCount} questions correctly, a true thinker!`;
      } else {
        feedback = `Darkness clouds your mind in ${locationName}. Incorrect answer.`;
        if (answeredCount > 3) feedback += ` Even with ${answeredCount} correct answers, this one eluded you.`;
      }
    } else if (actionType === "travel") {
    feedback = `You venture into ${locationName}, feeling the weight of the unknown.`;
    // Check for dynamic event trigger
    if (Math.random() < 0.2) { // 20% chance for a dynamic event
      feedback += ` A sudden event unfolds! Something unusual catches your eye in the shadows...`;
      this.triggerDynamicEvent(locationId);
    }
    }
    return feedback;
  }

  // Trigger dynamic events for unexpected challenges, rewards, or story progression with player choices
  private triggerDynamicEvent(locationId: string): void {
    const roll = Math.random();
    let eventType: string;
    if (roll < 0.35) {
      eventType = 'challenge';
    } else if (roll < 0.65) {
      eventType = 'reward';
    } else if (roll < 0.85) {
      eventType = 'story';
    } else {
      eventType = 'choice';
    }
    const gameStateStr = localStorage.getItem('ibt2-game-state-v2');
    if (!gameStateStr) return;
    const gameState = JSON.parse(gameStateStr);
    if (eventType === 'challenge') {
      const sanityPenalty = Math.floor(5 + Math.random() * 15);
      gameState.sanity = Math.max(0, gameState.sanity - sanityPenalty);
      gameState.dynamicEvent = {
        type: 'challenge',
        message: `A sudden challenge! You lose ${sanityPenalty} sanity facing an unexpected threat. Brace yourself for the next encounter.`,
        locationId: locationId,
        timestamp: new Date().toISOString()
      };
    } else if (eventType === 'reward') {
      const sanityBonus = Math.floor(5 + Math.random() * 15);
      gameState.sanity = Math.min(120, gameState.sanity + sanityBonus);
      gameState.dynamicEvent = {
        type: 'reward',
        message: `A fortunate discovery! You gain ${sanityBonus} sanity from an unexpected find. Your spirits are lifted!`,
        locationId: locationId,
        timestamp: new Date().toISOString()
      };
    } else if (eventType === 'story') {
      gameState.dynamicEvent = {
        type: 'story',
        message: `A mysterious clue emerges from the shadows of ${locationId}. This could be a key to unraveling the larger puzzle. Keep exploring!`,
        locationId: locationId,
        timestamp: new Date().toISOString()
      };
    } else {
      gameState.dynamicEvent = {
        type: 'choice',
        message: `A critical decision looms in ${locationId}. Do you investigate the strange noise or stay hidden? Your choice will shape your fate.`,
        locationId: locationId,
        timestamp: new Date().toISOString(),
        choices: [
          { id: 'investigate', text: 'Investigate the noise', effect: 'risk' },
          { id: 'hide', text: 'Stay hidden', effect: 'safe' }
        ]
      };
    }
    localStorage.setItem('ibt2-game-state-v2', JSON.stringify(gameState));
    console.log(`🎲 Dynamic event triggered: ${eventType} at ${locationId}`);
  }

  // Enhanced special item discovery with location-specific items
  checkForSpecialItem(locationId: string, visitedLocations: Set<string>): { found: boolean; sanityBonus: number; itemName: string } {
    const location = contentLoader.getLocationById(locationId);
    if (!location) return { found: false, sanityBonus: 0, itemName: '' };
    
    // Higher discovery chance for locations with special features
    const baseChance = 0.35;
    const featureBonus = location.specialFeatures ? location.specialFeatures.length * 0.05 : 0;
    const discoveryChance = Math.min(0.8, baseChance + featureBonus);
    
    if (Math.random() < discoveryChance) {
      const items = this.getLocationSpecialItems(location);
      const selectedItem = items[Math.floor(Math.random() * items.length)];
      
      return {
        found: true,
        sanityBonus: this.calculateItemSanityBonus(selectedItem.rarity, location.dangerLevel),
        itemName: selectedItem.name
      };
    } else if (Math.random() < 0.1) { // 10% chance for a sanity recovery event if no item is found
      return {
        found: false,
        sanityBonus: Math.floor(5 + Math.random() * 10),
        itemName: 'Safe Haven'
      };
    }
    
    return { found: false, sanityBonus: 0, itemName: '' };
  }

  // Enhanced question difficulty with adaptive scaling based on player performance
  getQuestionDifficulty(locationIndex: number, daysSurvived: number): 'easy' | 'medium' | 'hard' | 'extreme' {
    const location = contentLoader.getAllLocations().find(loc => loc.index === locationIndex);
    const dangerLevel = location?.dangerLevel || 1;
    
    let performanceModifier = 0;
    try {
      const gameStateStr = localStorage.getItem('ibt2-game-state-v2');
      if (gameStateStr) {
        const gameState = JSON.parse(gameStateStr);
        const answeredCount = gameState.answeredNPCs ? gameState.answeredNPCs.length : 0;
        const sanity = gameState.sanity || 100;
        // Increase difficulty faster for skilled players
        performanceModifier = Math.floor(answeredCount / 3);
        // Slow down difficulty increase if player is struggling
        if (sanity < 40) {
          performanceModifier -= 2;
        }
      }
    } catch (error) {
      console.error('Error calculating difficulty modifier:', error);
    }
    
    const difficultyScore = locationIndex + Math.floor(daysSurvived / 5) + dangerLevel + performanceModifier;
    
    if (difficultyScore <= 4) return 'easy';
    if (difficultyScore <= 8) return 'medium';
    if (difficultyScore <= 12) return 'hard';
    return 'extreme';
  }

  // Enhanced survival scoring with content-aware bonuses
  calculateSurvivalScore(daysSurvived: number, sanity: number, answeredNPCs: number): number {
    let score = daysSurvived * 100;
    
    // Sanity bonus
    if (sanity > 80) score += 500;
    else if (sanity > 50) score += 200;
    
    // NPC interaction bonus with rarity multipliers
    const npcBonus = this.calculateNPCBonus(answeredNPCs);
    score += npcBonus;
    
    // Location discovery bonus
    const uniqueLocations = this.getUniqueLocationsVisited();
    score += uniqueLocations * 100;
    
    // Booster pack bonus
    const boosterPacks = contentLoader.getAvailableBoosterPacks();
    score += boosterPacks.length * 250;
    
    // Survival streak bonus
    if (daysSurvived >= 10) score += 1000;
    if (daysSurvived >= 20) score += 2000;
    if (daysSurvived >= 30) score += 5000;
    
    return score;
  }

  // Complete state transition logic with location pool management
  processLocationTravel(currentState: GameState, locationId: string): Partial<GameState> {
    const newVisitedLocations = new Set(currentState.visitedLocations);
    let sanityChange = 0;
    let specialItemFound = false;
    let itemName = '';
    
    if (locationId === 'cabin') {
      // Returning to cabin - reset location pool and increment days
      contentLoader.resetLocationPool();
      
      return {
        currentLocation: locationId as any,
        isInCabin: true,
        daysSurvived: currentState.daysSurvived + 1,
        currentNPCs: [],
        selectedNPC: null,
        availableLocations: []
      };
    } else {
      // Leaving cabin - remove location from pool and apply enhanced logic
      contentLoader.removeLocationFromPool(locationId);
      
      if (!newVisitedLocations.has(locationId)) {
        newVisitedLocations.add(locationId);
        
        const location = contentLoader.getLocationById(locationId);
        const basePenalty = location ? (location.dangerLevel * 2) : 5;
        sanityChange = -basePenalty;
        
        // Check for special items
        const itemResult = this.checkForSpecialItem(locationId, newVisitedLocations);
        if (itemResult.found) {
          sanityChange += itemResult.sanityBonus;
          specialItemFound = true;
          itemName = itemResult.itemName;
        }
      }
      
      const newNPCs = this.generateNPCs(locationId, 0); // Index will be looked up from location data
      
      return {
        currentLocation: locationId as any,
        isInCabin: false,
        sanity: Math.min(120, Math.max(0, currentState.sanity + sanityChange)) as any,
        visitedLocations: newVisitedLocations,
        currentNPCs: newNPCs,
        selectedNPC: null,
        availableLocations: []
      };
    }
  }

  // Process question answering with character-specific logic, feedback, and story impact
  processQuestionAnswer(currentState: GameState, npcId: string, answer: 'A' | 'B', correctAnswer: 'A' | 'B'): Partial<GameState> {
    const isCorrect = answer === correctAnswer;
    const location = contentLoader.getLocationById(currentState.currentLocation);
    const character = contentLoader.getAllLocations()
      .flatMap(loc => loc.characters || [])
      .find(char => char.id === npcId);
    
    // Use character difficulty if available, otherwise use location index
    const difficulty = character?.difficulty || location?.index || 1;
    const sanityPenalty = this.calculateSanityPenalty(difficulty, isCorrect);
    
    const newAnsweredNPCs = new Set(currentState.answeredNPCs);
    let storyImpact: StoryImpact | null = null;
    if (isCorrect) {
      newAnsweredNPCs.add(npcId as any);
      // 10% chance for a story clue on correct answer
      if (Math.random() < 0.1) {
        storyImpact = {
          type: 'clue',
          message: `Your correct answer reveals a hidden clue from ${character?.name || 'the character'}! This could be vital to your journey.`,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    const newSanity = Math.max(0, currentState.sanity - sanityPenalty);
    // Feedback message can be handled by a separate mechanism if needed, not added to state directly
    
    return {
      sanity: newSanity as any,
      answeredNPCs: newAnsweredNPCs,
      selectedNPC: null,
      storyImpact: storyImpact
    };
  }

  // Get location pool status for UI display
  getLocationPoolStatus(): { total: number; remaining: number; visited: number } {
    return contentLoader.getPoolStatus();
  }

  // Check if all locations have been visited (pool empty)
  areAllLocationsVisited(): boolean {
    return contentLoader.isLocationPoolEmpty();
  }

  // Private helper methods
  private getLocationSpecialItems(location: Location) {
    // Generate items based on location theme and special features
    const baseItems = [
      { name: 'Strange Object', rarity: 'common' },
      { name: 'Mysterious Artifact', rarity: 'rare' }
    ];
    
    // Add location-specific items based on special features
    if (location.specialFeatures) {
      location.specialFeatures.forEach(feature => {
        switch (feature) {
          case 'ancient_trees':
            baseItems.push({ name: 'Ancient Acorn', rarity: 'rare' });
            break;
          case 'ice_crystals':
            baseItems.push({ name: 'Frost Crystal', rarity: 'epic' });
            break;
          case 'hidden_paths':
            baseItems.push({ name: 'Pathfinder\'s Compass', rarity: 'rare' });
            break;
          case 'winter_magic':
            baseItems.push({ name: 'Winter\'s Heart', rarity: 'legendary' });
            break;
        }
      });
    }
    
    return baseItems;
  }

  private calculateItemSanityBonus(rarity: string, dangerLevel: number = 1): number {
    const bonuses: Record<string, number> = {
      common: 15,
      rare: 25,
      epic: 40,
      legendary: 60
    };
    
    const baseBonus = bonuses[rarity] || 15;
    // Higher danger locations give better items
    return Math.floor(baseBonus * (1 + dangerLevel * 0.2));
  }

  private calculateNPCBonus(answeredNPCs: number): number {
    // Calculate bonus based on NPC interactions with progressive scaling
    // Base bonus per NPC interaction
    const baseBonus = 50;
    // Progressive multiplier: increases with more interactions to reward engagement
    const progressiveMultiplier = 1 + Math.floor(answeredNPCs / 5) * 0.2;
    // Cap the multiplier to prevent excessive scoring
    const cappedMultiplier = Math.min(progressiveMultiplier, 2.5);
    return Math.floor(answeredNPCs * baseBonus * cappedMultiplier);
  }

  private getUniqueLocationsVisited(): number {
    try {
      const gameState = JSON.parse(localStorage.getItem('ibt2-game-state-v2') || '{}');
      return gameState.visitedLocations ? gameState.visitedLocations.length : 0;
    } catch {
      return 0;
    }
  }
}

export const gameLogicService = GameLogicService.getInstance();
