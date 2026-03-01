/**
 * Complete Rewards Service with Daily Bonuses and Achievement Integration
 * Handles all reward claiming, daily bonuses, and special unlocks
 */

import { GameState, Achievement, InventoryItem } from '../types/game';
import { CacheService } from './cacheService';
import { AchievementService } from './achievementService';
import { GameEngine } from '../core/GameEngine';
import { InventoryItem as CoreInventoryItem } from '../types/core';

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'sanity' | 'item' | 'unlock' | 'cosmetic' | 'daily_bonus';
  value: number | string;
  available: boolean;
  cooldown?: number; // in milliseconds
  lastClaimed?: string;
  requirements?: {
    achievements?: string[];
    daysSurvived?: number;
    sanityLevel?: number;
    locationsVisited?: number;
  };
}

export class RewardsService {
  private static instance: RewardsService;
  private cacheService: CacheService;
  private gameEngine: GameEngine | null = null;
  private rewards: Map<string, Reward> = new Map();

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.initializeRewards();
    this.loadRewards();
  }
  
  public setGameEngine(engine: GameEngine): void {
    this.gameEngine = engine;
  }

  static getInstance(): RewardsService {
    if (!RewardsService.instance) {
      RewardsService.instance = new RewardsService();
    }
    return RewardsService.instance;
  }

  private initializeRewards(): void {
    const baseRewards: Reward[] = [
      {
        id: 'daily_sanity_boost',
        name: 'Daily Sanity Boost',
        description: '+10 Sanity restoration - A daily respite from the darkness.',
        type: 'daily_bonus',
        value: 10,
        available: true,
        cooldown: 24 * 60 * 60 * 1000 // 24 hours
      },
      {
        id: 'hourly_focus',
        name: 'Hourly Focus',
        description: '+3 Sanity for staying engaged - Keep your mind sharp.',
        type: 'sanity',
        value: 3,
        available: true,
        cooldown: 60 * 60 * 1000 // 1 hour
      },
      {
        id: 'wisdom_insight',
        name: 'Wisdom Insight',
        description: 'Reveals the correct answer for the next question - Ancient knowledge guides you.',
        type: 'unlock',
        value: 'next_question_hint',
        available: false,
        requirements: {
          achievements: ['philosopher']
        }
      },
      {
        id: 'safe_passage',
        name: 'Safe Passage',
        description: 'No sanity loss for the next location visit - A protective charm shields you.',
        type: 'unlock',
        value: 'safe_travel',
        available: false,
        requirements: {
          daysSurvived: 5
        }
      },
      {
        id: 'explorer_compass',
        name: 'Explorer\'s Compass',
        description: 'Always shows 3 travel options when opening the door - Navigate the unknown with certainty.',
        type: 'unlock',
        value: 'max_travel_options',
        available: false,
        requirements: {
          achievements: ['explorer']
        }
      },
      {
        id: 'sanity_crystal',
        name: 'Sanity Crystal',
        description: 'Rare crystal that provides +25 sanity - A glowing relic of hope.',
        type: 'item',
        value: 25,
        available: false,
        requirements: {
          locationsVisited: 10
        }
      },
      {
        id: 'golden_aura',
        name: 'Golden Aura',
        description: 'Cosmetic effect that makes your character glow - Shine with the light of survivors.',
        type: 'cosmetic',
        value: 'golden_glow',
        available: false,
        requirements: {
          achievements: ['perfectionist']
        }
      },
      {
        id: 'weekly_bonus',
        name: 'Weekly Survival Bonus',
        description: '+50 Sanity and special item - A reward for enduring a week in this forsaken land.',
        type: 'daily_bonus',
        value: 50,
        available: true,
        cooldown: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      {
        id: 'long_term_survivor',
        name: 'Long-Term Survivor',
        description: 'Bonus for surviving 15 days: +30 Sanity - Your resilience is legendary.',
        type: 'sanity',
        value: 30,
        available: false,
        requirements: {
          daysSurvived: 15
        }
      },
      {
        id: 'story_arc_unlock',
        name: 'Hidden Story Arc',
        description: 'Unlocks a hidden story arc after visiting 12 locations - Uncover the secrets buried in this world.',
        type: 'unlock',
        value: 'hidden_story_arc',
        available: false,
        requirements: {
          locationsVisited: 12
        }
      },
      {
        id: 'master_explorer',
        name: 'Master Explorer',
        description: 'Cosmetic badge for visiting all locations - Wear the mark of a true wanderer.',
        type: 'cosmetic',
        value: 'master_explorer_badge',
        available: false,
        requirements: {
          locationsVisited: 15
        }
      },
      {
        id: 'progressive_challenge_1',
        name: 'First Challenge Quest',
        description: 'Complete a series of tasks for a unique reward - Begin your journey to greatness.',
        type: 'unlock',
        value: 'challenge_quest_1',
        available: false,
        requirements: {
          daysSurvived: 3
        }
      },
      {
        id: 'progressive_challenge_2',
        name: 'Advanced Challenge Quest',
        description: 'A tougher series of tasks for a greater reward - Prove your worth against greater odds.',
        type: 'unlock',
        value: 'challenge_quest_2',
        available: false,
        requirements: {
          daysSurvived: 7,
          locationsVisited: 5
        }
      },
      {
        id: 'streak_bonus_3',
        name: '3-Day Streak Bonus',
        description: 'Bonus for logging in 3 consecutive days: +15 Sanity - Your persistence is rewarded.',
        type: 'sanity',
        value: 15,
        available: false,
        requirements: {
          daysSurvived: 3
        }
      },
      {
        id: 'streak_bonus_7',
        name: '7-Day Streak Bonus',
        description: 'Bonus for logging in 7 consecutive days: +30 Sanity and cosmetic item - A hero\'s endurance.',
        type: 'sanity',
        value: 30,
        available: false,
        requirements: {
          daysSurvived: 7
        }
      },
      {
        id: 'ancient_relic',
        name: 'Ancient Relic',
        description: 'A powerful artifact that boosts sanity by +40 - A forgotten treasure of immense power.',
        type: 'item',
        value: 40,
        available: false,
        requirements: {
          locationsVisited: 20,
          achievements: ['explorer_gold']
        }
      },
      {
        id: 'mystic_theme',
        name: 'Mystic Theme',
        description: 'Unlocks a mystical UI theme - Surround yourself with arcane energies.',
        type: 'cosmetic',
        value: 'mystic_theme',
        available: false,
        requirements: {
          daysSurvived: 10,
          achievements: ['survivor_silver']
        }
      },
      {
        id: 'sanity_shield',
        name: 'Sanity Shield',
        description: 'Reduces sanity loss by 25% for the next 3 travels - A barrier against the darkness.',
        type: 'unlock',
        value: 'sanity_shield_3',
        available: false,
        requirements: {
          daysSurvived: 8,
          locationsVisited: 7
        }
      },
      {
        id: 'event_challenge_reward',
        name: 'Event Challenge Reward',
        description: 'Special reward for completing a limited-time event - Proof of your triumph in unique trials.',
        type: 'item',
        value: 30,
        available: false,
        requirements: {
          achievements: ['event_survival_challenge']
        }
      },
      {
        id: 'veteran_survivor',
        name: 'Veteran Survivor',
        description: 'Bonus for surviving 30 days: +50 Sanity - A testament to unyielding will.',
        type: 'sanity',
        value: 50,
        available: false,
        requirements: {
          daysSurvived: 30
        }
      },
      {
        id: 'legendary_aura',
        name: 'Legendary Aura',
        description: 'Cosmetic aura of legend - Your presence inspires awe in this forsaken land.',
        type: 'cosmetic',
        value: 'legendary_aura',
        available: false,
        requirements: {
          daysSurvived: 25,
          achievements: ['survivor_gold']
        }
      },
      {
        id: 'streak_bonus_14',
        name: '14-Day Streak Bonus',
        description: 'Bonus for logging in 14 consecutive days: +50 Sanity and rare item - Unstoppable dedication.',
        type: 'sanity',
        value: 50,
        available: false,
        requirements: {
          daysSurvived: 14
        }
      }
    ];

    baseRewards.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  async updateRewardAvailability(gameState: GameState): Promise<void> {
    // Retrieve unlocked achievements from game state directly
    let achievementIds: string[] = Array.from(gameState.achievements).map(ach => ach.id);

    for (const [id, reward] of this.rewards) {
      let available = true;

      if (reward.requirements) {
        // Check achievement requirements
        if (reward.requirements.achievements) {
          available = reward.requirements.achievements.every(achId => 
            achievementIds.includes(achId)
          );
        }

        // Check other requirements
        if (available && reward.requirements.daysSurvived) {
          available = gameState.daysSurvived >= reward.requirements.daysSurvived;
        }

        if (available && reward.requirements.sanityLevel) {
          available = gameState.sanity >= reward.requirements.sanityLevel;
        }

        if (available && reward.requirements.locationsVisited) {
          available = gameState.visitedLocations.size >= reward.requirements.locationsVisited;
        }
      }

      // Check cooldown for daily/weekly bonuses
      if (available && reward.cooldown && reward.lastClaimed) {
        const timeSinceLastClaim = Date.now() - new Date(reward.lastClaimed).getTime();
        available = timeSinceLastClaim >= reward.cooldown;
      }

      reward.available = available;
    }

    await this.saveRewards();
  }

  async claimReward(rewardId: string, gameState: GameState): Promise<{
    success: boolean;
    newGameState?: Partial<GameState>;
    message?: string;
  }> {
    const reward = this.rewards.get(rewardId);
    if (!reward || !reward.available) {
      return { success: false, message: 'Reward not available' };
    }

    if (!this.gameEngine) {
      console.warn('GameEngine not set on RewardsService, falling back to basic implementation');
      return this.claimRewardBasic(rewardId, gameState);
    }

    let message = '';
    let streakBonus = 0;
    const commands: any[] = [];

    // Check for daily bonus to apply streak bonus
    if (reward.type === 'daily_bonus' && reward.id === 'daily_sanity_boost') {
      const streakData = await this.getStreakData();
      streakData.currentStreak += 1;
      await this.saveStreakData(streakData);
      streakBonus = Math.floor((streakData.currentStreak - 1) * 2); // 2 sanity per consecutive day after the first
      if (streakBonus > 0) {
        message += `Streak Bonus: +${streakBonus} sanity for ${streakData.currentStreak} day streak! `;
      }
      // Check for streak milestone rewards
      if (streakData.currentStreak >= 3) {
        const streakReward3 = this.rewards.get('streak_bonus_3');
        if (streakReward3 && !streakReward3.lastClaimed) {
          streakReward3.available = true;
          message += `Unlocked 3-Day Streak Bonus! Claim it for additional rewards! `;
        }
      }
      if (streakData.currentStreak >= 7) {
        const streakReward7 = this.rewards.get('streak_bonus_7');
        if (streakReward7 && !streakReward7.lastClaimed) {
          streakReward7.available = true;
          message += `Unlocked 7-Day Streak Bonus! Claim it for amazing rewards! `;
        }
      }
    }

    // Handle different reward types with command system
    switch (reward.type) {
      case 'sanity':
      case 'daily_bonus':
        const sanityBonus = (typeof reward.value === 'number' ? reward.value : 10) + streakBonus;
        const newSanity = Math.min(120, gameState.sanity + sanityBonus);
        commands.push({
          type: 'SET_SANITY',
          timestamp: Date.now(),
          payload: { sanity: newSanity, reason: `Reward: ${reward.name}` }
        });
        message += `Gained ${sanityBonus} sanity!`;
        break;

      case 'item':
        const newItem: CoreInventoryItem = {
          id: `${rewardId}_${Date.now()}`,
          name: reward.name,
          description: reward.description,
          type: 'reward',
          rarity: 'rare',
          effects: [{
            type: 'sanity_boost',
            magnitude: typeof reward.value === 'number' ? reward.value : 10,
            duration: -1
          }],
          quantity: 1,
          acquiredAt: new Date().toISOString(),
          source: 'reward_system'
        };
        commands.push({
          type: 'ADD_INVENTORY_ITEM',
          timestamp: Date.now(),
          payload: { item: newItem }
        });
        message = `Received ${reward.name}!`;
        break;

      case 'unlock':
        commands.push({
          type: 'APPLY_UNLOCK',
          timestamp: Date.now(),
          payload: { unlockId: reward.id, unlockType: reward.value }
        });
        message = `Unlocked ${reward.name}!`;
        if (reward.id.startsWith('progressive_challenge')) {
          message += ` Begin your quest now for unique challenges and rewards!`;
        }
        break;

      case 'cosmetic':
        commands.push({
          type: 'APPLY_COSMETIC',
          timestamp: Date.now(),
          payload: { cosmeticId: reward.id, cosmeticType: reward.value }
        });
        message = `Unlocked cosmetic: ${reward.name}!`;
        break;
    }

    // Execute all commands
    try {
      for (const command of commands) {
        await this.gameEngine.executeCommand(command);
      }
      
      // Mark as claimed and set cooldown
      reward.lastClaimed = new Date().toISOString();
      if (reward.cooldown) {
        reward.available = false;
      }

      await this.saveRewards();
      return { success: true, message };
    } catch (error) {
      console.error('Error executing reward commands:', error);
      return { success: false, message: 'Failed to apply reward effects' };
    }
  }
  
  // Fallback method for when GameEngine is not available
  private async claimRewardBasic(rewardId: string, gameState: GameState): Promise<{
    success: boolean;
    newGameState?: Partial<GameState>;
    message?: string;
  }> {
    const reward = this.rewards.get(rewardId);
    if (!reward || !reward.available) {
      return { success: false, message: 'Reward not available' };
    }

    let newGameState: Partial<GameState> = {};
    let message = '';

    switch (reward.type) {
      case 'sanity':
      case 'daily_bonus':
        const sanityBonus = typeof reward.value === 'number' ? reward.value : 10;
        newGameState.sanity = Math.min(120, gameState.sanity + sanityBonus) as any;
        message += `Gained ${sanityBonus} sanity!`;
        break;
        
      default:
        message = `Claimed ${reward.name}! (Basic mode - some effects may not apply)`;
        break;
    }

    reward.lastClaimed = new Date().toISOString();
    if (reward.cooldown) {
      reward.available = false;
    }

    await this.saveRewards();
    return { success: true, newGameState, message };
  }

  // Get streak data for daily login bonuses
  private async getStreakData(): Promise<{ currentStreak: number, lastClaimDate: string | null }> {
    const saved = await this.cacheService.get<{ currentStreak: number, lastClaimDate: string | null }>('streakData');
    if (saved) {
      const lastClaimDate = saved.lastClaimDate ? new Date(saved.lastClaimDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (lastClaimDate) {
        lastClaimDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          return { currentStreak: 0, lastClaimDate: null };
        }
      }
      return saved;
    }
    return { currentStreak: 0, lastClaimDate: null };
  }

  // Save streak data for daily login bonuses
  private async saveStreakData(data: { currentStreak: number, lastClaimDate: string | null }): Promise<void> {
    data.lastClaimDate = new Date().toISOString();
    await this.cacheService.set('streakData', data);
  }

  getAvailableRewards(): Reward[] {
    return Array.from(this.rewards.values()).filter(r => r.available);
  }

  getAllRewards(): Reward[] {
    return Array.from(this.rewards.values());
  }

  getNextDailyBonus(): { available: boolean; timeUntilNext?: number } {
    const dailyReward = this.rewards.get('daily_sanity_boost');
    if (!dailyReward) return { available: false };

    if (dailyReward.available) {
      return { available: true };
    }

    if (dailyReward.lastClaimed && dailyReward.cooldown) {
      const timeSinceLastClaim = Date.now() - new Date(dailyReward.lastClaimed).getTime();
      const timeUntilNext = dailyReward.cooldown - timeSinceLastClaim;
      
      if (timeUntilNext > 0) {
        return { available: false, timeUntilNext };
      } else {
        dailyReward.available = true;
        this.saveRewards();
        return { available: true };
      }
    }

    return { available: false };
  }

  private async saveRewards(): Promise<void> {
    const rewardData = Array.from(this.rewards.values());
    await this.cacheService.set('rewards', rewardData);
  }

  private async loadRewards(): Promise<void> {
    const saved = await this.cacheService.get<Reward[]>('rewards');
    if (saved) {
      saved.forEach(reward => {
        this.rewards.set(reward.id, reward);
      });
    }
  }
}

export const rewardsService = RewardsService.getInstance();

// Initialize with GameEngine when available
if (typeof window !== 'undefined') {
  // This will be set by the GameEngine initialization
  setTimeout(() => {
    try {
      const gameEngine = (window as any).__GAME_ENGINE__;
      if (gameEngine) {
        rewardsService.setGameEngine(gameEngine);
      }
    } catch (error) {
      console.log('GameEngine not available for RewardsService integration');
    }
  }, 100);
}
