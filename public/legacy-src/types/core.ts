/**
 * Enhanced Core Type Definitions with Generics and Advanced TypeScript Features
 * 
 * Features:
 * - Branded types for runtime safety
 * - Generic event/command system
 * - Discriminated unions
 * - Type guards
 * - Comprehensive documentation
 * - Test utility types
 */

// Branded types with factory functions
export type LocationId = string & { readonly brand: unique symbol };
export type NPCId = string & { readonly brand: unique symbol }; 
export type SanityLevel = number & { readonly brand: unique symbol };

/** Factory function for LocationId with enhanced validation */
export function createLocationId(id: string): LocationId {
  if (!id || id.trim().length === 0 || id.length > 50) {
    throw new Error('Invalid location ID: Must be non-empty and less than 50 characters');
  }
  return id as LocationId;
}

/** Factory function for NPCId with enhanced validation */
export function createNPCId(id: string): NPCId {
  if (!id || id.trim().length === 0 || id.length > 50) {
    throw new Error('Invalid NPC ID: Must be non-empty and less than 50 characters');
  }
  return id as NPCId;
}

/** Type guard for LocationId */
export function isLocationId(id: unknown): id is LocationId {
  return typeof id === 'string' && id.length > 0;
}

/** Type guard for NPCId */  
export function isNPCId(id: unknown): id is NPCId {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Generic Event System with Discriminated Unions and Constrained Generics
 * 
 * @template T - Event type string literal for better type inference
 * @template D - Event payload type with serialization support
 */
export interface GameEvent<T extends string = string, D extends object = object> {
  /** Event type discriminator */
  readonly type: T;
  /** Unix timestamp of event */
  readonly timestamp: number;
  /** Event-specific payload */
  readonly data: D;
  /** Optional metadata */
  readonly meta?: {
    /** Source of the event */
    source?: string;
    /** Correlation ID for tracing */
    correlationId?: string;
  };
  /** Serialization method for converting event to JSON */
  toJSON?(): string;
}

/** Discriminated union of all game event types */
export type GameEventType = 
  | StateChangedEvent
  | CommandExecutedEvent
  | LocationEnteredEvent
  | NPCInteractedEvent
  | SanityChangedEvent
  | GameOverEvent
  | SettingsUpdatedEvent
  | EngineEvent
  | MetricsEvent
  | ErrorEvent
  | RecoveryAttemptedEvent
  | AchievementUnlockedEvent;

/** Engine lifecycle events */
export interface EngineEvent extends GameEvent<'EngineEvent', {
  type: 'started' | 'stopped';
}> {}

/** Metrics collection events */
export interface MetricsEvent extends GameEvent<'Metrics', {
  metricType: string;
  [key: string]: unknown;
}> {}

/** Enhanced error events with detailed error information */
export interface ErrorEvent extends GameEvent<'Error', {
  command?: GameCommand;
  error: Error;
  errorCode?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}> {}

/** Recovery attempt events */  
export interface RecoveryAttemptedEvent extends GameEvent<'RecoveryAttempted', {
  error: Error;
  success: boolean;
  reason?: string;
}> {}

/** State changed event */
export interface StateChangedEvent extends GameEvent<'StateChanged', {
  previousState: GameState;
  newState: GameState;
  changedKeys: Array<keyof GameState>;
}> {}

/** Command executed event */
export interface CommandExecutedEvent extends GameEvent<'CommandExecuted', {
  command: GameCommand;
  result: CommandResult;
  executionTime: number;
}> {}

/** Location entered event */  
export interface LocationEnteredEvent extends GameEvent<'LocationEntered', {
  locationId: LocationId;
  previousLocation: LocationId;
  isFirstVisit: boolean;
}> {}

/** NPC interacted event */
export interface NPCInteractedEvent extends GameEvent<'NPCInteracted', {
  npcId: NPCId;
  action: 'selected' | 'answered';
  isCorrectAnswer?: boolean;
}> {}

/** Sanity changed event */
export interface SanityChangedEvent extends GameEvent<'SanityChanged', {
  oldValue: SanityLevel;
  newValue: SanityLevel;
  delta: number;
  reason: string;
}> {}

/** Game over event */
export interface GameOverEvent extends GameEvent<'GameOver', {
  finalScore: number;
  reason: 'sanity_depleted' | 'manual_reset';
  daysSurvived: number;
}> {}

/** Settings updated event */
export interface SettingsUpdatedEvent extends GameEvent<'SettingsUpdated', {
  changedSettings: Array<keyof GameSettings>;
  previousSettings: Partial<GameSettings>;
  newSettings: Partial<GameSettings>;
}> {}

/** Achievement unlocked event */
export interface AchievementUnlockedEvent extends GameEvent<'AchievementUnlocked', {
  achievementId: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
}> {}

/** Optimized type guard for GameEvent with minimal checks */
export function isGameEvent(event: unknown): event is GameEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as GameEvent;
  return typeof e.type === 'string' && typeof e.timestamp === 'number' && 'data' in e;
}

// Remove duplicate GameEventData and BaseGameEvent reference

/**
 * Generic Command System with Payload Validation and Constrained Generics
 * 
 * @template T - Command type string literal for better type inference
 * @template P - Command payload type with serialization support
 */
export interface GameCommand<T extends string = string, P extends object = object> {
  /** Command type discriminator */
  readonly type: T;
  /** Unix timestamp of command */
  readonly timestamp: number;
  /** Command-specific payload */
  readonly payload: P;
  /** Optional metadata */
  readonly meta?: {
    /** Source of the command */
    source?: string;
    /** Correlation ID for tracing */
    correlationId?: string;
  };
  /** Serialization method for converting command to JSON */
  toJSON?(): string;
}

/** Optimized type guard for GameCommand with minimal checks */
export function isGameCommand(command: unknown): command is GameCommand {
  if (typeof command !== 'object' || command === null) return false;
  const c = command as GameCommand;
  return typeof c.type === 'string' && typeof c.timestamp === 'number' && 'payload' in c;
}

// Remove duplicate command interfaces that use BaseCommand

// Remove duplicate GameCommand type definition

/** Travel to location command */
export interface TravelCommand extends GameCommand<'TRAVEL_TO_LOCATION', {
  locationId: LocationId;
}> {}

/** Select NPC command */
export interface SelectNPCCommand extends GameCommand<'SELECT_NPC', {
  npcId: NPCId;
}> {}

/** Answer question command */
export interface AnswerQuestionCommand extends GameCommand<'ANSWER_QUESTION', {
  npcId: NPCId;
  answer: 'A' | 'B';
}> {}

/** Open door command */
export interface OpenDoorCommand extends GameCommand<'OPEN_DOOR', {}> {}

/** Reset game command */
export interface ResetGameCommand extends GameCommand<'RESET_GAME', {}> {}

/** Update settings command */
export interface UpdateSettingsCommand extends GameCommand<'UPDATE_SETTINGS', {
  settings: Partial<GameSettings>;
}> {}

/** Unlock achievement command */
export interface UnlockAchievementCommand extends GameCommand<'UNLOCK_ACHIEVEMENT', {
  achievementId: string;
}> {}

/** Set sanity command */
export interface SetSanityCommand extends GameCommand<'SET_SANITY', {
  sanity: number;
  reason?: string;
}> {}

/** Add inventory item command */
export interface AddInventoryItemCommand extends GameCommand<'ADD_INVENTORY_ITEM', {
  item: InventoryItem;
}> {}

/** Apply cosmetic reward command */
export interface ApplyCosmeticCommand extends GameCommand<'APPLY_COSMETIC', {
  cosmeticId: string;
  cosmeticType: string;
}> {}

/** Apply unlock reward command */
export interface ApplyUnlockCommand extends GameCommand<'APPLY_UNLOCK', {
  unlockId: string;
  unlockType: string;
}> {}

/** Update achievement progress command */
export interface UpdateAchievementProgressCommand extends GameCommand<'UPDATE_ACHIEVEMENT_PROGRESS', {
  achievementId: string;
  progress: number;
  maxProgress: number;
}> {}

/** 
 * Standardized command result with type-safe data and error handling
 * 
 * @template D - Result data type specific to the command (defaults to unknown)
 * @template E - Error type for detailed error reporting (defaults to string)
 */
export interface CommandResult<D = unknown, E = string> {
  /** Whether command succeeded */
  success: boolean;
  /** Result data specific to the command outcome */
  data: D;
  /** Detailed error information if the command failed */
  error?: E;
  /** Optional metadata for performance and debugging */
  meta?: {
    /** Execution time in milliseconds */
    executionTime?: number;
    /** Non-critical warnings or additional information */
    warnings?: string[];
  };
}

/** Type guard for CommandResult ensuring type safety */
export function isCommandResult<D = unknown>(result: unknown): result is CommandResult<D> {
  return typeof result === 'object' && result !== null &&
    'success' in result && typeof result.success === 'boolean' &&
    'data' in result;
}

/**
 * Complete game state with computed properties
 * 
 * @note All properties are readonly to enforce immutability
 */
export interface GameState {
  readonly sanity: SanityLevel;
  readonly daysSurvived: number;
  readonly currentLocation: LocationId;
  readonly visitedLocations: ReadonlySet<LocationId>;
  readonly answeredNPCs: ReadonlySet<NPCId>;
  readonly isInCabin: boolean;
  readonly availableLocations: ReadonlyArray<LocationId>;
  readonly currentNPCs: ReadonlyArray<NPC>;
  readonly selectedNPC: NPC | null;
  readonly settings: GameSettings;
  readonly achievements: ReadonlySet<string>;
  readonly achievementProgress: ReadonlyMap<string, AchievementProgress>;
  readonly solvedPuzzles: number;
  readonly inventory: ReadonlyArray<InventoryItem>;
  readonly appliedCosmetics: ReadonlySet<string>;
  readonly unlockedFeatures: ReadonlySet<string>;
  readonly completedEvents: ReadonlyArray<string>;
  readonly dailyStreak: number;
}

// Computed state selectors
export interface GameStateSelectors {
  getSanityLevel(): 'healthy' | 'concerned' | 'critical' | 'danger';
  getLocationDangerLevel(): 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  getProgressPercentage(): number;
  getAvailableActions(): string[];
  canTravel(): boolean;
  canInteract(): boolean;
}

// Enhanced interfaces
export interface GameSettings {
  readonly musicVolume: number;
  readonly soundVolume: number;
  readonly colorScheme: 'terminal' | 'amber' | 'cyan' | 'synthwave' | 'alert' | 'matrix';
  readonly fullScreen: boolean;
  readonly accessibility: AccessibilitySettings;
  readonly performance: PerformanceSettings;
}

export interface AccessibilitySettings {
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly screenReader: boolean;
  readonly fontSize: 'small' | 'medium' | 'large';
}

export interface PerformanceSettings {
  readonly quality: 'low' | 'medium' | 'high' | 'auto';
  readonly frameRate: 30 | 60 | 120 | 'auto';
  readonly enableAnimations: boolean;
}

export interface Location {
  readonly id: LocationId;
  readonly name: string;
  readonly description: string;
  readonly imagePath: string;
  readonly musicPath: string;
  readonly index: number;
  readonly dangerLevel: number;
  readonly specialItems: ReadonlyArray<SpecialItem>;
}

export interface NPC {
  readonly id: NPCId;
  readonly name: string;
  readonly locationId: LocationId;
  readonly imagePath: string;
  readonly questionId: string;
  readonly personality: NPCPersonality;
  readonly difficulty: number;
}

export interface NPCPersonality {
  readonly archetype: 'wise' | 'mysterious' | 'friendly' | 'hostile' | 'neutral';
  readonly traits: ReadonlyArray<string>;
  readonly backstory: string;
}

export interface Question {
  readonly id: string;
  readonly npcId: string;
  readonly question: string;
  readonly optionA: string;
  readonly optionB: string;
  readonly correctAnswer: 'A' | 'B';
  readonly philosophy: string;
  readonly difficulty: number;
  readonly category: 'ethics' | 'metaphysics' | 'epistemology' | 'aesthetics';
}

export interface SpecialItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: 'common' | 'rare' | 'epic' | 'legendary';
  readonly sanityBonus: number;
  readonly effect: ItemEffect;
}

export interface ItemEffect {
  readonly type: 'sanity_boost' | 'protection' | 'insight' | 'luck';
  readonly magnitude: number;
  readonly duration: number;
}

export interface HighScore {
  readonly daysSurvived: number;
  readonly date: string;
  readonly finalSanity: SanityLevel;
  readonly score: number;
  readonly achievements: ReadonlyArray<Achievement>;
}

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unlockedAt: string;
  readonly rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementProgress {
  readonly achievementId: string;
  readonly currentProgress: number;
  readonly maxProgress: number;
  readonly lastUpdated: string;
}

export interface InventoryItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'consumable' | 'tool' | 'artifact' | 'reward';
  readonly rarity: 'common' | 'rare' | 'epic' | 'legendary';
  readonly quantity: number;
  readonly effects: ReadonlyArray<ItemEffect>;
  readonly acquiredAt: string;
  readonly source: string;
}

/**
 * Advanced Utility Types
 */

/** Recursively makes all properties readonly */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Makes specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Makes specific properties required */  
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extracts all possible string literal types from a type */
export type StringLiteral<T> = T extends string ? string extends T ? never : T : never;

/** Creates a type with all properties mutable */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/** Creates a type that requires at least one of the specified properties */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys] & Omit<T, Keys>;

/** Test utility types */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      new (...args: Y): T;
      (...args: Y): T;
    }
  }
}

/** Utility type for mocking functions */
export type MockFunction<T extends (...args: any[]) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

/** Recursive partial type */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

// Event sourcing types
export interface EventStore {
  append(event: GameEvent): Promise<void>;
  getEvents(fromTimestamp?: number): Promise<GameEvent[]>;
  replay(toTimestamp: number): Promise<GameState>;
}
