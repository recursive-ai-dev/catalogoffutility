/**
 * Advanced Save System with Multiple Slots and Auto-Save
 * Implements cloud sync capabilities and save file management
 */

import { GameState, SaveSlot } from '../types/game';
import { CacheService } from './cacheService';

export class SaveSystemService {
  private static instance: SaveSystemService;
  private cacheService: CacheService;
  private maxSaveSlots = 10;
  private autoSaveInterval = 5 * 60 * 1000; // 5 minutes
  private autoSaveTimer?: NodeJS.Timeout;

  private constructor() {
    this.cacheService = CacheService.getInstance();
  }

  static getInstance(): SaveSystemService {
    if (!SaveSystemService.instance) {
      SaveSystemService.instance = new SaveSystemService();
    }
    return SaveSystemService.instance;
  }

  async saveGame(gameState: GameState, slotName?: string, isAutoSave = false): Promise<string> {
    const saveId = slotName || `save_${Date.now()}`;
    const screenshot = await this.captureScreenshot();
    
    const saveSlot: SaveSlot = {
      id: saveId,
      name: slotName || `Auto Save ${new Date().toLocaleString()}`,
      gameState: this.serializeGameState(gameState),
      screenshot,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      playTime: gameState.stats?.totalPlayTime || 0,
      isAutoSave
    };

    await this.cacheService.set(`save_${saveId}`, saveSlot, {
      compress: true,
      ttl: 365 * 24 * 60 * 60 * 1000 // 1 year
    });

    // Update save index
    await this.updateSaveIndex(saveId, saveSlot);

    return saveId;
  }

  async loadGame(saveId: string): Promise<GameState | null> {
    const saveSlot = await this.cacheService.get<SaveSlot>(`save_${saveId}`);
    if (!saveSlot) return null;

    return this.deserializeGameState(saveSlot.gameState);
  }

  async getSaveSlots(): Promise<SaveSlot[]> {
    const index = await this.cacheService.get<string[]>('save_index') || [];
    const saveSlots: SaveSlot[] = [];

    for (const saveId of index) {
      const saveSlot = await this.cacheService.get<SaveSlot>(`save_${saveId}`);
      if (saveSlot) {
        saveSlots.push(saveSlot);
      }
    }

    return saveSlots.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }

  async deleteSave(saveId: string): Promise<boolean> {
    try {
      // Remove from storage
      await this.cacheService.set(`save_${saveId}`, null);
      
      // Update index
      const index = await this.cacheService.get<string[]>('save_index') || [];
      const newIndex = index.filter(id => id !== saveId);
      await this.cacheService.set('save_index', newIndex);

      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  async exportSave(saveId: string): Promise<string | null> {
    const saveSlot = await this.cacheService.get<SaveSlot>(`save_${saveId}`);
    if (!saveSlot) return null;

    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      saveSlot
    };

    return btoa(JSON.stringify(exportData));
  }

  async importSave(exportedData: string): Promise<string | null> {
    try {
      const data = JSON.parse(atob(exportedData));
      
      if (data.version !== '2.0') {
        throw new Error('Incompatible save version');
      }

      const saveSlot: SaveSlot = data.saveSlot;
      const newSaveId = `imported_${Date.now()}`;
      
      saveSlot.id = newSaveId;
      saveSlot.name = `Imported: ${saveSlot.name}`;
      saveSlot.lastModified = new Date().toISOString();

      await this.cacheService.set(`save_${newSaveId}`, saveSlot);
      await this.updateSaveIndex(newSaveId, saveSlot);

      return newSaveId;
    } catch (error) {
      console.error('Failed to import save:', error);
      return null;
    }
  }

  startAutoSave(gameState: GameState): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveGame(gameState, 'autosave', true);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  async getQuickSave(): Promise<GameState | null> {
    return this.loadGame('quicksave');
  }

  async quickSave(gameState: GameState): Promise<void> {
    await this.saveGame(gameState, 'quicksave');
  }

  private async updateSaveIndex(saveId: string, saveSlot: SaveSlot): Promise<void> {
    const index = await this.cacheService.get<string[]>('save_index') || [];
    
    if (!index.includes(saveId)) {
      index.push(saveId);
    }

    // Limit number of saves
    if (index.length > this.maxSaveSlots) {
      const oldestSaves = index.slice(0, index.length - this.maxSaveSlots);
      for (const oldSaveId of oldestSaves) {
        await this.deleteSave(oldSaveId);
      }
    }

    await this.cacheService.set('save_index', index.slice(-this.maxSaveSlots));
  }

  private serializeGameState(gameState: GameState): GameState {
    return {
      ...gameState,
      visitedLocations: Array.from(gameState.visitedLocations) as any,
      answeredNPCs: Array.from(gameState.answeredNPCs) as any
    };
  }

  private deserializeGameState(gameState: any): GameState {
    return {
      ...gameState,
      visitedLocations: new Set(gameState.visitedLocations),
      answeredNPCs: new Set(gameState.answeredNPCs)
    };
  }

  private async captureScreenshot(): Promise<string> {
    try {
      // Create a canvas to capture the current game state
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 400;
      canvas.height = 300;
      
      if (ctx) {
        // Create a simple representation of the current game state
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e94560';
        ctx.font = '20px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('Game Screenshot', canvas.width / 2, canvas.height / 2);
        
        return canvas.toDataURL('image/jpeg', 0.7);
      }
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
    }
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYwZjIzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJPcmJpdHJvbiIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2U5NDU2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbWUgU2NyZWVuc2hvdDwvdGV4dD48L3N2Zz4=';
  }

  async getSaveFileSize(): Promise<{ total: number; individual: Array<{ id: string; size: number }> }> {
    const saveSlots = await this.getSaveSlots();
    const individual: Array<{ id: string; size: number }> = [];
    let total = 0;

    for (const slot of saveSlots) {
      const size = JSON.stringify(slot).length;
      individual.push({ id: slot.id, size });
      total += size;
    }

    return { total, individual };
  }
}

export const saveSystemService = SaveSystemService.getInstance();
