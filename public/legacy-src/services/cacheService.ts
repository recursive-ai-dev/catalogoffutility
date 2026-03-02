/**
 * Enhanced Cache Service with Compression and Encryption
 * Implements advanced caching strategies with TypeScript
 */

import { GameState, GameSettings, HighScore } from '../types/core';
import * as pako from 'pako';

interface CacheOptions {
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  compressed?: boolean;
  encrypted?: boolean;
}

export class CacheService {
  private static instance: CacheService;
  private readonly STORAGE_KEYS = {
    HIGH_SCORES: 'ibt2-high-scores-v2',
    SETTINGS: 'ibt2-settings-v2',
    GAME_STATE: 'ibt2-game-state-v2',
    ACHIEVEMENTS: 'ibt2-achievements-v2',
    ANALYTICS: 'ibt2-analytics-v2'
  } as const;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Generic cache methods with advanced features
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl,
        compressed: options.compress,
        encrypted: options.encrypt
      };

      let serializedData = JSON.stringify(entry);

      // Compression (simple implementation)
      if (options.compress) {
        serializedData = this.compress(serializedData);
      }

      // Encryption (simple implementation)
      if (options.encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      let data = localStorage.getItem(key);
      if (!data) return null;

      // Try to determine if data is encrypted/compressed
      if (this.isEncrypted(data)) {
        data = this.decrypt(data);
      }

      if (this.isCompressed(data)) {
        data = this.decompress(data);
      }

      const entry: CacheEntry<T> = JSON.parse(data);

      // Check TTL
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Game-specific methods with enhanced features
  async saveGameState(gameState: GameState): Promise<boolean> {
    const serializedState = {
      ...gameState,
      visitedLocations: Array.from(gameState.visitedLocations),
      answeredNPCs: Array.from(gameState.answeredNPCs),
      achievements: Array.from(gameState.achievements),
      achievementProgress: Array.from(gameState.achievementProgress.entries()),
      appliedCosmetics: Array.from(gameState.appliedCosmetics),
      unlockedFeatures: Array.from(gameState.unlockedFeatures),
      version: '3.0',
      savedAt: new Date().toISOString()
    };

    return this.set(this.STORAGE_KEYS.GAME_STATE, serializedState, {
      compress: true,
      ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  async loadGameState(): Promise<GameState | null> {
    const state = await this.get<any>(this.STORAGE_KEYS.GAME_STATE);
    if (!state) return null;

    // Migration logic for older versions
    if (!state.version || state.version < '3.0') {
      return this.migrateGameState(state);
    }

    return {
      ...state,
      visitedLocations: new Set(state.visitedLocations),
      answeredNPCs: new Set(state.answeredNPCs),
      achievements: new Set(state.achievements || []),
      achievementProgress: new Map(state.achievementProgress || []),
      appliedCosmetics: new Set(state.appliedCosmetics || []),
      unlockedFeatures: new Set(state.unlockedFeatures || [])
    };
  }

  async saveSettings(settings: GameSettings): Promise<boolean> {
    return this.set(this.STORAGE_KEYS.SETTINGS, settings, {
      ttl: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
  }

  async loadSettings(): Promise<GameSettings | null> {
    return this.get<GameSettings>(this.STORAGE_KEYS.SETTINGS);
  }

  async addHighScore(daysSurvived: number, finalSanity: number, score: number): Promise<HighScore[]> {
    const scores = await this.getHighScores();
    const newScore: HighScore = {
      daysSurvived,
      finalSanity: finalSanity as any,
      score,
      date: new Date().toISOString(),
      achievements: [] // Would be populated with actual achievements
    };

    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score);

    // Keep only top 50 scores
    const topScores = scores.slice(0, 50);
    
    await this.set(this.STORAGE_KEYS.HIGH_SCORES, topScores, {
      compress: true
    });

    return topScores;
  }

  async getHighScores(): Promise<HighScore[]> {
    const scores = await this.get<HighScore[]>(this.STORAGE_KEYS.HIGH_SCORES);
    return scores || [];
  }

  // Analytics and metrics
  async trackEvent(eventName: string, data: any): Promise<void> {
    const analytics = await this.get<any[]>(this.STORAGE_KEYS.ANALYTICS) || [];
    
    analytics.push({
      event: eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    });

    // Keep only last 1000 events
    if (analytics.length > 1000) {
      analytics.splice(0, analytics.length - 1000);
    }

    await this.set(this.STORAGE_KEYS.ANALYTICS, analytics, {
      compress: true
    });
  }

  async getAnalytics(): Promise<any[]> {
    return await this.get(this.STORAGE_KEYS.ANALYTICS) ?? [];
  }

  // Cache management
  async clearExpired(): Promise<void> {
    const keys = Object.values(this.STORAGE_KEYS);
    
    for (const key of keys) {
      await this.get(key);
      // get() method already handles TTL expiration
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    percentage: number;
  }> {
    try {
      // Estimate storage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }

      // Most browsers allow ~5-10MB for localStorage
      const available = 10 * 1024 * 1024; // 10MB estimate
      
      return {
        used,
        available,
        percentage: (used / available) * 100
      };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Private helper methods
  private compress(data: string): string {
    // Use pako library for compression if available, otherwise fallback to base64
    try {
      if (typeof pako !== 'undefined') {
        const binaryData = new TextEncoder().encode(data);
        const compressed = pako.deflate(binaryData);
        return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      } else {
        console.warn('Pako library not available, using base64 encoding');
        return btoa(data);
      }
    } catch (error) {
      console.error('Compression error:', error);
      return btoa(data);
    }
  }

  private decompress(data: string): string {
    try {
      const binaryString = atob(data);
      if (typeof pako !== 'undefined') {
        const binaryData = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
        const decompressed = pako.inflate(binaryData);
        return new TextDecoder().decode(decompressed);
      } else {
        console.warn('Pako library not available, assuming base64 encoding');
        return binaryString;
      }
    } catch (error) {
      console.error('Decompression error:', error);
      return data; // Return original if decompression fails
    }
  }

  private encrypt(data: string): string {
    // Implement a basic XOR cipher for encryption
    try {
      const key = 'ibt2-game-key';
      let encrypted = 'encrypted:';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      return btoa(data);
    }
  }

  private decrypt(data: string): string {
    try {
      const decoded = atob(data);
      if (!decoded.startsWith('encrypted:')) {
        return decoded;
      }
      const key = 'ibt2-game-key';
      let decrypted = '';
      for (let i = 10; i < decoded.length; i++) { // Skip 'encrypted:' prefix
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt((i - 10) % key.length));
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return data; // Return original if decryption fails
    }
  }

  private isCompressed(data: string): boolean {
    // Simple heuristic to detect compression
    try {
      atob(data);
      return true;
    } catch {
      return false;
    }
  }

  private isEncrypted(data: string): boolean {
    // Simple heuristic to detect encryption
    return data.startsWith('encrypted:');
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('game-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('game-session-id', sessionId);
    }
    return sessionId;
  }

  private migrateGameState(oldState: any): GameState {
    // Migration logic for older game state versions
    const migratedState = {
      ...oldState,
      visitedLocations: new Set(oldState.visitedLocations || ['cabin']),
      answeredNPCs: new Set(oldState.answeredNPCs || []),
      achievements: new Set(oldState.achievements || []),
      achievementProgress: new Map(oldState.achievementProgress || []),
      inventory: oldState.inventory || [],
      appliedCosmetics: new Set(oldState.appliedCosmetics || []),
      unlockedFeatures: new Set(oldState.unlockedFeatures || []),
      settings: {
        ...oldState.settings,
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          screenReader: false,
          fontSize: 'medium'
        },
        performance: {
          quality: 'auto',
          frameRate: 'auto',
          enableAnimations: true
        }
      }
    };
    
    console.log(`Migrated game state from version ${oldState.version || '1.0'} to 3.0`);
    return migratedState;
  }
}
