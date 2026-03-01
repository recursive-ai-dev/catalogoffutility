import { LocationId, NPCId, SanityLevel } from './core';

export interface GameState {
  sanity: SanityLevel;
  daysSurvived: number;
  currentLocation: LocationId;
  visitedLocations: Set<LocationId>;
  answeredNPCs: Set<NPCId>;
  isInCabin: boolean;
  availableLocations: LocationId[];
  currentNPCs: NPC[];
  selectedNPC: NPC | null;
  settings: GameSettings;
  achievements: Achievement[];
  inventory: InventoryItem[];
  stats: GameStats;
  preferences: PlayerPreferences;
  relationships: Record<string, number>; // Tracks relationship values with NPCs
  storyState: Record<string, any>; // Tracks story-specific state changes
  storyImpact: StoryImpact | null; // Tracks immediate story impacts from player actions
}

export interface GameSettings {
  musicVolume: number;
  soundVolume: number;
  colorScheme: 'terminal' | 'amber' | 'cyan' | 'synthwave' | 'alert' | 'matrix';
  fullScreen: boolean;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
  notifications: NotificationSettings;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  colorBlindSupport: boolean;
  subtitles: boolean;
}

export interface PerformanceSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'auto';
  frameRate: 30 | 60 | 120 | 'auto';
  enableAnimations: boolean;
  enableParticles: boolean;
  videoQuality: 'low' | 'medium' | 'high';
  preloadAssets: boolean;
}

export interface NotificationSettings {
  achievements: boolean;
  warnings: boolean;
  tips: boolean;
  soundEffects: boolean;
}

export interface PlayerPreferences {
  autoSave: boolean;
  confirmActions: boolean;
  showHints: boolean;
  skipIntros: boolean;
  fastText: boolean;
}

export interface Location {
  id: LocationId;
  name: string;
  description: string;
  imagePath: string;
  videoPath: string;
  musicPath: string;
  index: number;
  dangerLevel: number;
  atmosphere: 'peaceful' | 'tense' | 'mysterious' | 'dangerous' | 'chaotic';
  weather: WeatherCondition;
  weatherEffects: {
    sanityModifier: number;
    description: string;
  };
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  specialFeatures: string[];
  characters?: NPC[]; // Characters specific to this location
}

export interface WeatherCondition {
  type: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  intensity: 'light' | 'moderate' | 'heavy';
  visibility: number; // 0-100%
}

export interface NPC {
  id: NPCId;
  name: string;
  imagePath: string;
  videoPath: string;
  questionId: string;
  personality: NPCPersonality;
  difficulty: number;
  relationship: number; // -100 to 100
  backstory: string;
  motivations: string[];
  fears: string[];
}

export interface NPCPersonality {
  archetype: 'wise' | 'mysterious' | 'friendly' | 'hostile' | 'neutral' | 'chaotic' | 'guardian';
  traits: string[];
  emotionalState: 'calm' | 'agitated' | 'sad' | 'angry' | 'fearful' | 'hopeful';
  trustLevel: number; // 0-100
  communicationStyle: 'direct' | 'cryptic' | 'poetic' | 'aggressive' | 'gentle';
}

export interface Question {
  id: string;
  npcId: string;
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
  philosophy: string;
  difficulty: number;
  category: 'ethics' | 'metaphysics' | 'epistemology' | 'aesthetics' | 'logic' | 'existential';
  consequences: QuestionConsequences;
  hints: string[];
}

export interface QuestionConsequences {
  correctAnswer: {
    sanityChange: number;
    relationshipChange: number;
    unlockAchievement?: string;
    specialEffect?: string;
  };
  incorrectAnswer: {
    sanityChange: number;
    relationshipChange: number;
    additionalPenalty?: string;
  };
}

export interface HighScore {
  daysSurvived: number;
  date: string;
  finalSanity: SanityLevel;
  score: number;
  achievements: Achievement[];
  playStyle: PlayStyle;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'survival' | 'exploration' | 'social' | 'knowledge' | 'special';
  unlockedAt: string;
  progress: number;
  maxProgress: number;
  hidden: boolean;
  rewards: AchievementReward[];
}

export interface AchievementReward {
  type: 'sanity' | 'item' | 'unlock' | 'cosmetic';
  value: number | string;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'tool' | 'key' | 'artifact' | 'memory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: ItemEffect[];
  quantity: number;
  discoveredAt: string;
  locationFound: string;
}

export interface ItemEffect {
  type: 'sanity_boost' | 'protection' | 'insight' | 'luck' | 'relationship' | 'unlock';
  magnitude: number;
  duration: number; // in game days, -1 for permanent
  conditions: string[];
}

export interface GameStats {
  totalPlayTime: number;
  locationsVisited: number;
  npcsEncountered: number;
  questionsAnswered: number;
  correctAnswers: number;
  achievementsUnlocked: number;
  itemsFound: number;
  deathCount: number;
  averageSanity: number;
  longestSurvival: number;
  favoriteLocation: string;
  playStyle: PlayStyle;
}

export interface PlayStyle {
  explorer: number; // 0-100
  philosopher: number; // 0-100
  survivor: number; // 0-100
  socializer: number; // 0-100
  risktaker: number; // 0-100
}

export interface StoryImpact {
  type: 'clue' | 'event' | 'choice';
  message: string;
  timestamp: string;
}

// Enhanced event system - Import from core.ts to avoid duplication
import { GameEvent } from './core';

// Save system enhancements
export interface SaveSlot {
  id: string;
  name: string;
  gameState: GameState;
  screenshot: string; // base64 encoded
  createdAt: string;
  lastModified: string;
  playTime: number;
  isAutoSave: boolean;
}

// Booster Pack System
export interface BoosterPack {
  id: string;
  name: string;
  description: string;
  version: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockRequirements?: {
    daysSurvived?: number;
    loginStreak?: number;
    achievements?: string[];
    sanityLevel?: number;
  };
  locations?: Location[];
  characters?: NPC[];
  items?: InventoryItem[];
  achievements?: Achievement[];
}

// Mod support interfaces
export interface ModInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
}

export interface CustomContent {
  locations: Location[];
  npcs: NPC[];
  questions: Question[];
  achievements: Achievement[];
  items: InventoryItem[];
}
