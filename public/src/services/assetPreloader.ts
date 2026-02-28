/**
 * Advanced Asset Preloader with Priority Queue and Lazy Loading
 * Intelligently preloads critical assets based on game state and device performance
 */

import { performanceService } from './performanceService';

interface AssetPriority {
  url: string;
  type: 'image' | 'video' | 'audio' | 'data';
  priority: 'critical' | 'high' | 'medium' | 'low';
  preload?: boolean;
  context?: string; // Context identifier for lazy loading
}

export class AssetPreloader {
  private static instance: AssetPreloader;
  private loadQueue: AssetPriority[] = [];
  private loadedAssets = new Set<string>();
  private loadingAssets = new Set<string>();
  private maxConcurrent = 3;
  private currentLoading = 0;
  private performanceService = performanceService;
  private lazyLoadEnabled = false;

  static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  constructor() {
    // performanceService is already an instance, no need for getInstance()
    // this.performanceService is set at the class level
    this.adjustConcurrencyBasedOnPerformance();
  }

  /**
   * Adjusts the number of concurrent loads based on device performance
   */
  private adjustConcurrencyBasedOnPerformance(): void {
    const metrics = this.performanceService.getPerformanceMetrics();
    if (metrics.isLowPerformance) {
      this.maxConcurrent = 1;
      this.lazyLoadEnabled = true;
    } else {
      this.maxConcurrent = 3;
      this.lazyLoadEnabled = false;
    }
  }

  // Add asset to preload queue
  addAsset(asset: AssetPriority): void {
    if (this.loadedAssets.has(asset.url) || this.loadingAssets.has(asset.url)) {
      return;
    }

    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.loadQueue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[asset.priority]
    );

    if (insertIndex === -1) {
      this.loadQueue.push(asset);
    } else {
      this.loadQueue.splice(insertIndex, 0, asset);
    }

    this.processQueue();
  }

  // Process the loading queue
  private async processQueue(): Promise<void> {
    if (this.currentLoading >= this.maxConcurrent || this.loadQueue.length === 0) {
      return;
    }

    const asset = this.loadQueue.shift();
    if (!asset) return;

    // Skip non-critical assets if lazy loading is enabled
    if (this.lazyLoadEnabled && asset.priority !== 'critical') {
      this.loadQueue.push(asset); // Re-queue for later
      return;
    }

    this.currentLoading++;
    this.loadingAssets.add(asset.url);

    try {
      await this.loadAsset(asset);
      this.loadedAssets.add(asset.url);
    } catch (error) {
      console.warn(`Failed to preload asset: ${asset.url}`, error);
    } finally {
      this.currentLoading--;
      this.loadingAssets.delete(asset.url);
      this.processQueue(); // Continue with next asset
    }
  }

  // Load individual asset
  private loadAsset(asset: AssetPriority): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (asset.type) {
        case 'image':
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = asset.url;
          break;

        case 'video':
          const video = document.createElement('video');
          video.onloadeddata = () => resolve();
          video.onerror = reject;
          video.preload = 'metadata';
          video.src = asset.url;
          break;

        case 'audio':
          const audio = new Audio();
          audio.onloadeddata = () => resolve();
          audio.onerror = reject;
          audio.preload = 'metadata';
          audio.src = asset.url;
          break;

        case 'data':
          fetch(asset.url)
            .then(response => response.ok ? resolve() : reject())
            .catch(reject);
          break;

        default:
          reject(new Error(`Unknown asset type: ${asset.type}`));
      }
    });
  }

  // Preload critical game assets
  preloadCriticalAssets(): void {
    // Critical UI images
    this.addAsset({
      url: '/images/ui/cabin-icon.png',
      type: 'image',
      priority: 'critical'
    });

    // High priority location images
    const criticalLocations = ['cabin', 'forest', 'lake'];
    criticalLocations.forEach(location => {
      this.addAsset({
        url: `/images/locations/${location}/location.jpg`,
        type: 'image',
        priority: 'high'
      });
    });

    // Critical audio files
    this.addAsset({
      url: '/audio/ui/button-click.mp3',
      type: 'audio',
      priority: 'high'
    });
  }

  // Preload assets based on current game state
  preloadContextualAssets(gameState: any): void {
    // Preload current location video
    if (gameState.currentLocation) {
      this.addAsset({
        url: `/videos/locations/${gameState.currentLocation}/ambient.mp4`,
        type: 'video',
        priority: 'high',
        context: gameState.currentLocation
      });
    }

    // Preload available location assets with medium priority for lazy loading
    gameState.availableLocations?.forEach((locationId: string) => {
      this.addAsset({
        url: `/images/locations/${locationId}/location.jpg`,
        type: 'image',
        priority: 'medium',
        context: locationId
      });
    });

    // Preload NPC assets with medium priority for lazy loading
    gameState.currentNPCs?.forEach((npc: any) => {
      this.addAsset({
        url: npc.imagePath,
        type: 'image',
        priority: 'medium',
        context: npc.id
      });
    });
  }

  /**
   * Triggers loading of non-critical assets for a specific context
   * Useful when a player navigates to a new location or interacts with an NPC
   */
  loadContextualAssets(context: string): void {
    const relevantAssets = this.loadQueue.filter(asset => asset.context === context);
    relevantAssets.forEach(asset => {
      const index = this.loadQueue.indexOf(asset);
      if (index !== -1) {
        this.loadQueue.splice(index, 1);
        this.addAsset({ ...asset, priority: 'high' }); // Upgrade priority and re-add
      }
    });
  }

  // Get loading statistics
  getStats(): { loaded: number; loading: number; queued: number } {
    return {
      loaded: this.loadedAssets.size,
      loading: this.currentLoading,
      queued: this.loadQueue.length
    };
  }

  // Clear cache (for memory management)
  clearCache(): void {
    this.loadedAssets.clear();
    this.loadQueue = [];
  }
}

export const assetPreloader = AssetPreloader.getInstance();
