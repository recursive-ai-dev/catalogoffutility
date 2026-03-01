/**
 * Achievement Service for managing and tracking player achievements
 * Integrates with the game engine to check for achievement conditions on state changes
 */

import { GameEngine } from '../core/GameEngine';
import { GameState, StateChangedEvent, Achievement } from '../types/core';

export class AchievementService {
  private static instance: AchievementService;
  private engine: GameEngine;
  private achievements: Map<string, AchievementDefinition> = new Map();
  private unlockedAchievements: Set<string> = new Set();

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.initializeAchievements();
    this.setupEventListeners();
  }

  static getInstance(engine: GameEngine): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService(engine);
    }
    return AchievementService.instance;
  }

  private initializeAchievements(): void {
    // Define achievements with tiers
    this.achievements.set('survivor_bronze', {
      id: 'survivor_bronze',
      name: 'Survivor - Bronze',
      description: 'Survive for 5 days',
      rarity: 'common',
      condition: (state: GameState) => state.daysSurvived >= 5,
      tier: 'bronze',
      category: 'survival',
      loreSnippet: 'You recall a distant memory of your first night in this strange land, the cold biting at your skin as you huddled by a makeshift fire. Survival was uncertain, but you endured.',
      visualEffect: 'bronzeGlow',
      soundEffect: 'achievementBronze',
    });
    this.achievements.set('survivor_silver', {
      id: 'survivor_silver',
      name: 'Survivor - Silver',
      description: 'Survive for 10 days',
      rarity: 'rare',
      condition: (state: GameState) => state.daysSurvived >= 10,
      tier: 'silver',
      category: 'survival',
      loreSnippet: 'As days turned into weeks, you discovered an ancient carving on a tree, hinting at others who survived here long before you. Their strength inspires your own.',
      visualEffect: 'silverShine',
      soundEffect: 'achievementSilver',
    });
    this.achievements.set('survivor_gold', {
      id: 'survivor_gold',
      name: 'Survivor - Gold',
      description: 'Survive for 20 days',
      rarity: 'epic',
      condition: (state: GameState) => state.daysSurvived >= 20,
      tier: 'gold',
      category: 'survival',
      loreSnippet: 'Two decades of survival have etched your name into the lore of this land. A vision reveals a forgotten hero who once stood where you stand now, their legacy now intertwined with yours.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
    this.achievements.set('explorer_bronze', {
      id: 'explorer_bronze',
      name: 'Explorer - Bronze',
      description: 'Visit 3 different locations',
      rarity: 'common',
      condition: (state: GameState) => state.visitedLocations.size >= 3,
      tier: 'bronze',
      category: 'exploration',
      loreSnippet: 'Each new place tells a story. You uncover a weathered journal page describing a traveler’s first steps into unknown territories, much like your own journey.',
      visualEffect: 'bronzeGlow',
      soundEffect: 'achievementBronze',
    });
    this.achievements.set('explorer_silver', {
      id: 'explorer_silver',
      name: 'Explorer - Silver',
      description: 'Visit 6 different locations',
      rarity: 'rare',
      condition: (state: GameState) => state.visitedLocations.size >= 6,
      tier: 'silver',
      category: 'exploration',
      loreSnippet: 'Your map grows with each discovery. A hidden cave painting reveals an ancient explorer’s path, mirroring your own relentless curiosity.',
      visualEffect: 'silverShine',
      soundEffect: 'achievementSilver',
    });
    this.achievements.set('explorer_gold', {
      id: 'explorer_gold',
      name: 'Explorer - Gold',
      description: 'Visit 10 different locations',
      rarity: 'epic',
      condition: (state: GameState) => state.visitedLocations.size >= 10,
      tier: 'gold',
      category: 'exploration',
      loreSnippet: 'You’ve charted lands few have seen. A spectral guide appears, recounting tales of a legendary explorer whose footsteps you now follow, their spirit guiding your path.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
    this.achievements.set('philosopher_bronze', {
      id: 'philosopher_bronze',
      name: 'Philosopher - Bronze',
      description: 'Answer questions from 5 different NPCs',
      rarity: 'common',
      condition: (state: GameState) => state.answeredNPCs.size >= 5,
      tier: 'bronze',
      category: 'interaction',
      loreSnippet: 'Wisdom begins with listening. An old sage’s riddle echoes in your mind, revealing a fragment of this world’s ancient philosophy.',
      visualEffect: 'bronzeGlow',
      soundEffect: 'achievementBronze',
    });
    this.achievements.set('philosopher_silver', {
      id: 'philosopher_silver',
      name: 'Philosopher - Silver',
      description: 'Answer questions from 10 different NPCs',
      rarity: 'rare',
      condition: (state: GameState) => state.answeredNPCs.size >= 10,
      tier: 'silver',
      category: 'interaction',
      loreSnippet: 'Conversations deepen your understanding. A mysterious figure shares a parable of balance, a key tenet of the forgotten teachings of this realm.',
      visualEffect: 'silverShine',
      soundEffect: 'achievementSilver',
    });
    this.achievements.set('philosopher_gold', {
      id: 'philosopher_gold',
      name: 'Philosopher - Gold',
      description: 'Answer questions from 20 different NPCs',
      rarity: 'epic',
      condition: (state: GameState) => state.answeredNPCs.size >= 20,
      tier: 'gold',
      category: 'interaction',
      loreSnippet: 'Your mind is a repository of truths. In a dream, a council of ancient thinkers welcomes you, unveiling the core mystery of existence in this enigmatic world.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
    // Puzzle achievements
    this.achievements.set('puzzler_bronze', {
      id: 'puzzler_bronze',
      name: 'Puzzler - Bronze',
      description: 'Solve 3 puzzles',
      rarity: 'common',
      condition: (state: GameState) => state.solvedPuzzles >= 3,
      tier: 'bronze',
      category: 'puzzle',
      loreSnippet: 'Each solved puzzle reveals a piece of the greater mystery. A dusty tome mentions a novice riddle-solver, much like yourself, beginning their journey.',
      visualEffect: 'bronzeGlow',
      soundEffect: 'achievementBronze',
    });
    this.achievements.set('puzzler_silver', {
      id: 'puzzler_silver',
      name: 'Puzzler - Silver',
      description: 'Solve 7 puzzles',
      rarity: 'rare',
      condition: (state: GameState) => state.solvedPuzzles >= 7,
      tier: 'silver',
      category: 'puzzle',
      loreSnippet: 'Patterns emerge with each solution. A cryptic scroll describes a dedicated solver who unlocked hidden paths, mirroring your growing expertise.',
      visualEffect: 'silverShine',
      soundEffect: 'achievementSilver',
    });
    this.achievements.set('puzzler_gold', {
      id: 'puzzler_gold',
      name: 'Puzzler - Gold',
      description: 'Solve 15 puzzles',
      rarity: 'epic',
      condition: (state: GameState) => state.solvedPuzzles >= 15,
      tier: 'gold',
      category: 'puzzle',
      loreSnippet: 'You’ve mastered the art of the enigma. A vision of an ancient puzzle-master congratulates you, revealing a final riddle that ties all your solutions together.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
    // Item collection achievements
    this.achievements.set('collector_bronze', {
      id: 'collector_bronze',
      name: 'Collector - Bronze',
      description: 'Collect 5 unique items',
      rarity: 'common',
      condition: (state: GameState) => state.inventory.size >= 5,
      tier: 'bronze',
      category: 'collection',
      loreSnippet: 'Every item has a story. You find a worn ledger listing a scavenger’s first finds, reminiscent of your own humble beginnings.',
      visualEffect: 'bronzeGlow',
      soundEffect: 'achievementBronze',
    });
    this.achievements.set('collector_silver', {
      id: 'collector_silver',
      name: 'Collector - Silver',
      description: 'Collect 10 unique items',
      rarity: 'rare',
      condition: (state: GameState) => state.inventory.size >= 10,
      tier: 'silver',
      category: 'collection',
      loreSnippet: 'Your collection grows impressive. An old merchant’s note speaks of a trader who sought rare artifacts, much like your own pursuit.',
      visualEffect: 'silverShine',
      soundEffect: 'achievementSilver',
    });
    this.achievements.set('collector_gold', {
      id: 'collector_gold',
      name: 'Collector - Gold',
      description: 'Collect 20 unique items',
      rarity: 'epic',
      condition: (state: GameState) => state.inventory.size >= 20,
      tier: 'gold',
      category: 'collection',
      loreSnippet: 'A hoard worthy of legend. A spectral curator appears, showing you a gallery of relics from ages past, now linked to your own vast collection.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
    // Temporary event-based achievement
    this.achievements.set('event_survival_challenge', {
      id: 'event_survival_challenge',
      name: 'Survival Challenge Champion',
      description: 'Survive the "Night of Shadows" event',
      rarity: 'legendary',
      condition: (state: GameState) => state.completedEvents.includes('night_of_shadows'),
      tier: 'gold',
      category: 'event',
      loreSnippet: 'Darkness tested your resolve. A haunting whisper recounts the terror of the Night of Shadows, a trial you’ve now conquered, earning a place in whispered tales.',
      visualEffect: 'goldBurst',
      soundEffect: 'achievementGold',
    });
  }

  private setupEventListeners(): void {
    this.engine.on<StateChangedEvent>('StateChanged', (event) => {
      const newState = event.data.newState;
      this.checkAchievements(newState);
    });
  }

  private checkAchievements(state: GameState): void {
    for (const [id, achievement] of this.achievements) {
      // Update progress first
      this.updateAchievementProgress(id, state);
      
      // Check for unlock
      if (!state.achievements.has(id) && achievement.condition(state)) {
        this.unlockAchievement(id);
      }
    }
  }
  
  private updateAchievementProgress(achievementId: string, state: GameState): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;
    
    let progress = 0;
    let maxProgress = 1;
    
    // Calculate progress based on achievement type and current state
    switch (achievement.category) {
      case 'survival':
        if (achievementId.includes('bronze')) {
          progress = Math.min(state.daysSurvived, 5);
          maxProgress = 5;
        } else if (achievementId.includes('silver')) {
          progress = Math.min(state.daysSurvived, 10);
          maxProgress = 10;
        } else if (achievementId.includes('gold')) {
          progress = Math.min(state.daysSurvived, 20);
          maxProgress = 20;
        }
        break;
      case 'exploration':
        if (achievementId.includes('bronze')) {
          progress = Math.min(state.visitedLocations.size, 3);
          maxProgress = 3;
        } else if (achievementId.includes('silver')) {
          progress = Math.min(state.visitedLocations.size, 6);
          maxProgress = 6;
        } else if (achievementId.includes('gold')) {
          progress = Math.min(state.visitedLocations.size, 10);
          maxProgress = 10;
        }
        break;
      case 'interaction':
        if (achievementId.includes('bronze')) {
          progress = Math.min(state.answeredNPCs.size, 5);
          maxProgress = 5;
        } else if (achievementId.includes('silver')) {
          progress = Math.min(state.answeredNPCs.size, 10);
          maxProgress = 10;
        } else if (achievementId.includes('gold')) {
          progress = Math.min(state.answeredNPCs.size, 20);
          maxProgress = 20;
        }
        break;
      case 'puzzle':
        if (achievementId.includes('bronze')) {
          progress = Math.min(state.solvedPuzzles, 3);
          maxProgress = 3;
        } else if (achievementId.includes('silver')) {
          progress = Math.min(state.solvedPuzzles, 7);
          maxProgress = 7;
        } else if (achievementId.includes('gold')) {
          progress = Math.min(state.solvedPuzzles, 15);
          maxProgress = 15;
        }
        break;
      case 'collection':
        if (achievementId.includes('bronze')) {
          progress = Math.min(state.inventory.length, 5);
          maxProgress = 5;
        } else if (achievementId.includes('silver')) {
          progress = Math.min(state.inventory.length, 10);
          maxProgress = 10;
        } else if (achievementId.includes('gold')) {
          progress = Math.min(state.inventory.length, 20);
          maxProgress = 20;
        }
        break;
    }
    
    // Update progress through command system
    this.engine.executeCommand({
      type: 'UPDATE_ACHIEVEMENT_PROGRESS',
      timestamp: Date.now(),
      payload: { achievementId, progress, maxProgress }
    }).catch(error => {
      console.error('Failed to update achievement progress:', error);
    });
  }

  private unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return;

    this.unlockedAchievements.add(achievementId);
    console.log(`Achievement Unlocked: ${achievement.name} - ${achievement.description}`);

    // Trigger a UI notification or event with enhanced feedback
    this.engine.emit({
      type: 'AchievementUnlocked',
      timestamp: Date.now(),
      data: {
        achievementId: achievementId,
        name: achievement.name,
        description: achievement.description,
        rarity: achievement.rarity,
        loreSnippet: achievement.loreSnippet || '',
        visualEffect: achievement.visualEffect || 'defaultGlow',
        soundEffect: achievement.soundEffect || 'achievementDefault',
        unlockedAt: new Date().toISOString(),
      },
    });

    // Update state to include the new achievement
    this.engine.executeCommand({
      type: 'UNLOCK_ACHIEVEMENT',
      timestamp: Date.now(),
      payload: { achievementId },
    });
  }

  public getUnlockedAchievements(): Set<string> {
    return new Set(this.unlockedAchievements);
  }
  
  public getAchievementProgress(achievementId: string): { current: number; max: number } | null {
    const currentState = this.engine.getState();
    const progressData = currentState.achievementProgress.get(achievementId);
    
    if (progressData) {
      return {
        current: progressData.currentProgress,
        max: progressData.maxProgress
      };
    }
    
    return null;
  }

  public getAchievementDetails(achievementId: string): AchievementDefinition | undefined {
    return this.achievements.get(achievementId);
  }

  public getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }
  
  public getAchievementWithProgress(achievementId: string): (AchievementDefinition & { progress: number; maxProgress: number }) | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;
    
    const progressData = this.getAchievementProgress(achievementId);
    return {
      ...achievement,
      progress: progressData?.current || 0,
      maxProgress: progressData?.max || 1
    };
  }
  
  public getAllAchievementsWithProgress(): (AchievementDefinition & { progress: number; maxProgress: number })[] {
    return Array.from(this.achievements.keys()).map(id => this.getAchievementWithProgress(id)!).filter(Boolean);
  }
}

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (state: GameState) => boolean;
  tier: 'bronze' | 'silver' | 'gold';
  category: 'survival' | 'exploration' | 'interaction' | 'puzzle' | 'collection' | 'event';
  loreSnippet?: string;
  visualEffect?: string;
  soundEffect?: string;
}
