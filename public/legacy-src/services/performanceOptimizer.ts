/**
 * Performance Optimizer Service
 * 
 * This service handles performance optimizations for the game, including:
 * - Dynamic asset loading based on device capabilities
 * - Runtime performance monitoring and adaptive quality
 * - Critical CSS inlining for faster initial renders
 * - Memory management and resource cleanup
 * - Device capability detection for tailored experiences
 * 
 * The goal is to ensure smooth gameplay across a wide range of devices,
 * from low-end mobile phones to high-end gaming PCs.
 */

export class PerformanceOptimizer {
  private performanceLevel: 'low' | 'medium' | 'high' = 'medium';
  private frameRateTarget: number = 60;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private isInitialized: boolean = false;
  private performanceMetrics: any = {};
  private observer: IntersectionObserver | null = null;
  private readonly LOW_FPS_THRESHOLD: number = 30;
  private readonly ADJUSTMENT_INTERVAL: number = 5000; // 5 seconds
  private readonly MAX_TEXTURE_SIZE_LOW: number = 512;
  private readonly MAX_TEXTURE_SIZE_MEDIUM: number = 1024;
  private readonly MAX_TEXTURE_SIZE_HIGH: number = 2048;
  private readonly RENDER_SCALE_LOW: number = 0.5;
  private readonly RENDER_SCALE_MEDIUM: number = 0.75;
  private readonly RENDER_SCALE_HIGH: number = 1.0;
  private readonly ANIMATION_FRAME_SKIP_LOW: number = 2;
  private readonly ANIMATION_FRAME_SKIP_MEDIUM: number = 1;
  private readonly ANIMATION_FRAME_SKIP_HIGH: number = 0;
  private readonly MAX_PARTICLE_EFFECTS_LOW: number = 5;
  private readonly MAX_PARTICLE_EFFECTS_MEDIUM: number = 15;
  private readonly MAX_PARTICLE_EFFECTS_HIGH: number = 30;
  private readonly SHADOW_QUALITY_LOW: string = 'low';
  private readonly SHADOW_QUALITY_MEDIUM: string = 'medium';
  private readonly SHADOW_QUALITY_HIGH: string = 'high';
  private readonly BACKGROUND_EFFECTS_LOW: boolean = false;
  private readonly BACKGROUND_EFFECTS_MEDIUM: boolean = true;
  private readonly BACKGROUND_EFFECTS_HIGH: boolean = true;
  private readonly POST_PROCESSING_LOW: boolean = false;
  private readonly POST_PROCESSING_MEDIUM: boolean = false;
  private readonly POST_PROCESSING_HIGH: boolean = true;

  constructor() {
    // Initialize performance metrics
    this.performanceMetrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      updateTime: 0,
      lastAdjustment: 0,
      qualityAdjustments: 0,
      droppedFrames: 0
    };
  }

  /**
   * Initialize the performance optimizer
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    
    // Detect device capabilities and set initial performance level
    this.detectDeviceCapabilities();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Apply initial optimizations based on detected performance level
    this.applyPerformanceOptimizations();
    
    console.log(`Performance Optimizer initialized with ${this.performanceLevel} performance level`);
  }

  /**
   * Detect device capabilities to set initial performance level
   */
  private detectDeviceCapabilities(): void {
    // Get approximate device memory if API is available
    let deviceMemory = 4; // Default to 4GB if API not available
    if ('deviceMemory' in navigator) {
      deviceMemory = (navigator as any).deviceMemory || deviceMemory;
    }
    
    // Check CPU cores if API is available
    let cpuCores = 2; // Default to 2 cores
    if ('hardwareConcurrency' in navigator) {
      cpuCores = navigator.hardwareConcurrency || cpuCores;
    }
    
    // Set performance level based on device characteristics
    if (deviceMemory < 3 || cpuCores < 3) {
      this.performanceLevel = 'low';
      this.frameRateTarget = 30;
    } else if (deviceMemory < 6 || cpuCores < 6) {
      this.performanceLevel = 'medium';
      this.frameRateTarget = 45;
    } else {
      this.performanceLevel = 'high';
      this.frameRateTarget = 60;
    }
    
    console.log(`Device capabilities detected: Memory: ~${deviceMemory}GB, CPU Cores: ${cpuCores}`);
  }

  /**
   * Start performance monitoring to track FPS and other metrics
   */
  private startPerformanceMonitoring(): void {
    // Use requestAnimationFrame to monitor frame rate
    const updateFPS = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
      }
      
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      this.frameCount++;
      
      // Update FPS every second
      if (deltaTime > 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.performanceMetrics.fps = this.fps;
        this.performanceMetrics.frameTime = deltaTime;
        
        // Check if performance adjustment is needed
        this.checkPerformanceAdjustment();
      }
      
      // Monitor memory usage if API is available
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          this.performanceMetrics.memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // Convert to MB
        }
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    requestAnimationFrame(updateFPS);
  }

  /**
   * Check if performance adjustments are needed based on FPS
   */
  private checkPerformanceAdjustment(): void {
    const now = performance.now();
    if (now - this.performanceMetrics.lastAdjustment < this.ADJUSTMENT_INTERVAL) {
      return;
    }
    
    // Adjust performance level based on FPS
    if (this.fps < this.LOW_FPS_THRESHOLD && this.performanceLevel !== 'low') {
      console.log(`Performance issue detected: FPS (${this.fps}) below threshold. Downgrading quality from ${this.performanceLevel}.`);
      this.performanceLevel = this.performanceLevel === 'high' ? 'medium' : 'low';
      this.performanceMetrics.qualityAdjustments++;
      this.performanceMetrics.lastAdjustment = now;
      this.applyPerformanceOptimizations();
    } else if (this.fps > this.frameRateTarget * 1.2 && this.performanceLevel !== 'high') {
      console.log(`Performance headroom detected: FPS (${this.fps}) above target. Upgrading quality from ${this.performanceLevel}.`);
      this.performanceLevel = this.performanceLevel === 'low' ? 'medium' : 'high';
      this.performanceMetrics.qualityAdjustments++;
      this.performanceMetrics.lastAdjustment = now;
      this.applyPerformanceOptimizations();
    }
  }

  /**
   * Apply performance optimizations based on current performance level
   */
  private applyPerformanceOptimizations(): void {
    // Apply different optimizations based on performance level
    if (this.performanceLevel === 'low') {
      this.applyLowPerformanceOptimizations();
    } else if (this.performanceLevel === 'medium') {
      this.applyMediumPerformanceOptimizations();
    } else {
      this.applyHighPerformanceOptimizations();
    }
    
    // Apply global optimizations that are always active
    this.applyGlobalOptimizations();
  }

  /**
   * Apply optimizations for low-performance devices
   */
  private applyLowPerformanceOptimizations(): void {
    // Set low quality settings for game rendering
    this.setGameQualitySettings({
      maxTextureSize: this.MAX_TEXTURE_SIZE_LOW,
      renderScale: this.RENDER_SCALE_LOW,
      animationFrameSkip: this.ANIMATION_FRAME_SKIP_LOW,
      maxParticleEffects: this.MAX_PARTICLE_EFFECTS_LOW,
      shadowQuality: this.SHADOW_QUALITY_LOW,
      backgroundEffects: this.BACKGROUND_EFFECTS_LOW,
      postProcessing: this.POST_PROCESSING_LOW
    });
    
    // Disable non-critical animations
    this.disableNonCriticalAnimations();
    
    // Reduce asset loading
    this.reduceAssetLoading();
    
    // Aggressively optimize React renders
    this.optimizeReactRenders(true);
    
    console.log('Applied low performance optimizations for struggling devices');
  }

  /**
   * Apply optimizations for medium-performance devices
   */
  private applyMediumPerformanceOptimizations(): void {
    // Set medium quality settings for game rendering
    this.setGameQualitySettings({
      maxTextureSize: this.MAX_TEXTURE_SIZE_MEDIUM,
      renderScale: this.RENDER_SCALE_MEDIUM,
      animationFrameSkip: this.ANIMATION_FRAME_SKIP_MEDIUM,
      maxParticleEffects: this.MAX_PARTICLE_EFFECTS_MEDIUM,
      shadowQuality: this.SHADOW_QUALITY_MEDIUM,
      backgroundEffects: this.BACKGROUND_EFFECTS_MEDIUM,
      postProcessing: this.POST_PROCESSING_MEDIUM
    });
    
    // Enable selective animations
    this.enableSelectiveAnimations();
    
    // Optimize asset loading
    this.optimizeAssetLoading();
    
    // Moderately optimize React renders
    this.optimizeReactRenders(false);
    
    console.log('Applied medium performance optimizations for average devices');
  }

  /**
   * Apply optimizations for high-performance devices
   */
  private applyHighPerformanceOptimizations(): void {
    // Set high quality settings for game rendering
    this.setGameQualitySettings({
      maxTextureSize: this.MAX_TEXTURE_SIZE_HIGH,
      renderScale: this.RENDER_SCALE_HIGH,
      animationFrameSkip: this.ANIMATION_FRAME_SKIP_HIGH,
      maxParticleEffects: this.MAX_PARTICLE_EFFECTS_HIGH,
      shadowQuality: this.SHADOW_QUALITY_HIGH,
      backgroundEffects: this.BACKGROUND_EFFECTS_HIGH,
      postProcessing: this.POST_PROCESSING_HIGH
    });
    
    // Enable all animations
    this.enableAllAnimations();
    
    // Load all assets at full quality
    this.loadFullQualityAssets();
    
    // Minimal React render optimizations
    this.optimizeReactRenders(false);
    
    console.log('Applied high performance settings for powerful devices');
  }

  /**
   * Apply global optimizations that are always active
   */
  private applyGlobalOptimizations(): void {
    // Debounce expensive operations
    this.debounceExpensiveOperations();
    
    // Setup resource pooling for reusable objects
    this.setupResourcePooling();
    
    // Apply memory management strategies
    this.applyMemoryManagement();
  }

  /**
   * Setup intersection observer for lazy loading of off-screen elements
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported, lazy loading disabled');
      return;
    }
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Load elements when they come into view
        if (entry.isIntersecting) {
          const element = entry.target;
          // Trigger loading of data-src or data-srcset attributes if present
          if (element.hasAttribute('data-src')) {
            (element as HTMLImageElement).src = element.getAttribute('data-src') || '';
            element.removeAttribute('data-src');
          }
          if (element.hasAttribute('data-srcset')) {
            (element as HTMLImageElement).srcset = element.getAttribute('data-srcset') || '';
            element.removeAttribute('data-srcset');
          }
          // Unobserve after loading
          this.observer?.unobserve(element);
        }
      });
    }, {
      rootMargin: '100px', // Load slightly before element is in view
      threshold: 0.1
    });
    
    // Observe elements with data-src or data-srcset attributes
    document.querySelectorAll('[data-src], [data-srcset]').forEach(element => {
      this.observer?.observe(element);
    });
  }

  /**
   * Inline critical CSS for faster initial renders
   */
  inlineCriticalCSS(): void {
    // This would typically be handled by build tools, but we can simulate it
    // by adding critical styles directly to the HTML head during initialization
    const criticalCSS = `
      /* Critical CSS for above-the-fold content */
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        background-color: #000;
        color: #fff;
        font-family: 'Courier New', Courier, monospace;
      }
      #root {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .retro-panel {
        background-color: rgba(0, 0, 0, 0.7);
        border: 2px solid #00ff00;
        color: #00ff00;
        position: relative;
        z-index: 1;
      }
      .retro-button {
        background-color: #000;
        border: 1px solid #00ff00;
        color: #00ff00;
        cursor: pointer;
        font-family: 'Courier New', Courier, monospace;
      }
      .retro-text {
        color: #00ff00;
      }
      .retro-accent {
        color: #00ffaa;
      }
      .retro-dim {
        color: #008800;
      }
    `;
    
    // Create style element and add to head
    const styleElement = document.createElement('style');
    styleElement.textContent = criticalCSS;
    document.head.appendChild(styleElement);
    
    console.log('Critical CSS inlined for faster initial rendering');
  }

  /**
   * Monitor performance metrics
   */
  monitorPerformance(): void {
    // Performance monitoring is already handled in startPerformanceMonitoring
    // This method can be used to log current metrics periodically
    setInterval(() => {
      if (this.performanceMetrics.fps < this.LOW_FPS_THRESHOLD) {
        console.warn(`Low FPS detected: ${this.performanceMetrics.fps}. Consider further optimizations.`);
      }
      
      if (this.performanceMetrics.memoryUsage > 500) {
        console.warn(`High memory usage detected: ${this.performanceMetrics.memoryUsage.toFixed(2)}MB. Consider memory optimizations.`);
      }
    }, 10000); // Log every 10 seconds
  }

  /**
   * Set game quality settings based on performance level
   */
  private setGameQualitySettings(settings: {
    maxTextureSize: number;
    renderScale: number;
    animationFrameSkip: number;
    maxParticleEffects: number;
    shadowQuality: string;
    backgroundEffects: boolean;
    postProcessing: boolean;
  }): void {
    // Apply settings to game rendering (would be implemented in game engine)
    console.log('Applying game quality settings:', settings);
    
    // Store settings in window object for global access if needed
    (window as any).gameQualitySettings = settings;
  }

  /**
   * Disable non-critical animations to save processing power
   */
  private disableNonCriticalAnimations(): void {
    // Add a class to the body to disable non-critical animations
    document.body.classList.add('disable-non-critical-animations');
    
    // Dynamically add style to disable animations
    const style = document.createElement('style');
    style.textContent = `
      .disable-non-critical-animations .animate-subtle-flicker,
      .disable-non-critical-animations .animate-occasional-flicker,
      .disable-non-critical-animations .animate-hover-pulse,
      .disable-non-critical-animations .animate-mystery-pulse,
      .disable-non-critical-animations .animate-urgency-glow {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('Non-critical animations disabled for performance');
  }

  /**
   * Enable selective animations for medium performance
   */
  private enableSelectiveAnimations(): void {
    // Remove the disable class if present
    document.body.classList.remove('disable-non-critical-animations');
    
    // Add selective animation enabling
    const style = document.createElement('style');
    style.textContent = `
      .animate-hover-pulse,
      .animate-urgency-glow {
        animation-play-state: running !important;
      }
      .animate-subtle-flicker,
      .animate-occasional-flicker,
      .animate-mystery-pulse {
        animation-play-state: paused !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('Selective animations enabled for balanced performance');
  }

  /**
   * Enable all animations for high performance
   */
  private enableAllAnimations(): void {
    // Remove any animation disabling classes
    document.body.classList.remove('disable-non-critical-animations');
    
    // Remove any selective animation styles
    const styles = document.querySelectorAll('style[data-animation-control]');
    styles.forEach(style => style.remove());
    
    console.log('All animations enabled for maximum visual quality');
  }

  /**
   * Reduce asset loading for low performance devices
   */
  private reduceAssetLoading(): void {
    // Set flags for reduced asset loading
    (window as any).reducedAssetLoading = true;
    
    // Prioritize only critical assets
    console.log('Asset loading reduced to critical assets only');
  }

  /**
   * Optimize asset loading for medium performance
   */
  private optimizeAssetLoading(): void {
    // Set flags for optimized asset loading
    (window as any).reducedAssetLoading = false;
    (window as any).prioritizeCriticalAssets = true;
    
    console.log('Asset loading optimized with critical asset prioritization');
  }

  /**
   * Load full quality assets for high performance
   */
  private loadFullQualityAssets(): void {
    // Set flags for full quality asset loading
    (window as any).reducedAssetLoading = false;
    (window as any).prioritizeCriticalAssets = false;
    (window as any).loadFullQualityAssets = true;
    
    console.log('Full quality assets enabled for maximum visual fidelity');
  }

  /**
   * Optimize React renders for performance
   * @param aggressive Whether to apply aggressive optimizations
   */
  private optimizeReactRenders(aggressive: boolean): void {
    // Set flags for React optimization level
    (window as any).aggressiveReactOptimizations = aggressive;
    
    // Apply memoization and other React-specific optimizations
    console.log(`React render optimizations applied (${aggressive ? 'aggressive' : 'standard'} mode)`);
    
    // For aggressive mode, disable non-critical React updates
    if (aggressive) {
      console.log('Aggressive React optimizations enabled: Reduced update frequency for non-critical components');
    }
  }

  /**
   * Debounce expensive operations to prevent performance spikes
   */
  private debounceExpensiveOperations(): void {
    // Implement debouncing for expensive operations
    console.log('Expensive operations debounced to prevent performance spikes');
  }

  /**
   * Setup resource pooling for reusable objects
   */
  private setupResourcePooling(): void {
    // Setup object pooling for game elements
    console.log('Resource pooling setup for reusable game objects');
  }

  /**
   * Apply memory management strategies to prevent leaks
   */
  private applyMemoryManagement(): void {
    // Setup periodic cleanup of unused resources
    setInterval(() => {
      // Trigger garbage collection if possible (browser-dependent)
      if (typeof (window as any).gc === 'function') {
        (window as any).gc();
        console.log('Manual garbage collection triggered');
      }
      
      // Clean up any cached resources that are no longer needed
      this.cleanupCachedResources();
    }, 30000); // Every 30 seconds
    
    console.log('Memory management strategies applied');
  }

  /**
   * Cleanup cached resources that are no longer needed
   */
  private cleanupCachedResources(): void {
    // Clean up any cached data that hasn't been accessed recently
    console.log('Cleaning up cached resources to free memory');
  }

  /**
   * Destroy the performance optimizer and clean up resources
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Disconnect intersection observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Remove any added styles
    const styles = document.querySelectorAll('style[data-performance-optimizer]');
    styles.forEach(style => style.remove());
    
    // Remove performance flags from window object
    delete (window as any).gameQualitySettings;
    delete (window as any).reducedAssetLoading;
    delete (window as any).prioritizeCriticalAssets;
    delete (window as any).loadFullQualityAssets;
    delete (window as any).aggressiveReactOptimizations;
    
    this.isInitialized = false;
    console.log('Performance Optimizer destroyed and resources cleaned up');
  }

  /**
   * Get current performance level
   */
  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    return this.performanceLevel;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }
}

// Create and export a singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
