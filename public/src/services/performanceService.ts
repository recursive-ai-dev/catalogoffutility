class PerformanceService {
  private static instance: PerformanceService;
  private frameRate: number = 60;
  private isLowPerformanceMode: boolean = false;
  
  private constructor() {
    this.detectPerformance();
    this.setupPerformanceMonitoring();
  }
  
  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Detect device performance capabilities
  private detectPerformance(): void {
    // Check for low-end device indicators
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
    const hasSlowConnection = (navigator as any).connection && (navigator as any).connection.effectiveType === 'slow-2g';
    
    this.isLowPerformanceMode = isMobile || hasLowMemory || hasSlowConnection;
  }

  // Monitor frame rate and adjust accordingly
  private setupPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFrameRate = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        this.frameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Adjust performance mode based on frame rate
        if (this.frameRate < 30) {
          this.enableLowPerformanceMode();
        } else if (this.frameRate > 50 && this.isLowPerformanceMode) {
          this.disableLowPerformanceMode();
        }
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  // Enable low performance optimizations
  private enableLowPerformanceMode(): void {
    if (this.isLowPerformanceMode) return;
    
    this.isLowPerformanceMode = true;
    document.documentElement.classList.add('low-performance');
    
    // Disable expensive animations
    const style = document.createElement('style');
    style.textContent = `
      .low-performance * {
        animation-duration: 0.01ms !important;
        animation-delay: 0.01ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0.01ms !important;
      }
      .low-performance .animate-blink,
      .low-performance .animate-flicker,
      .low-performance .animate-pulse {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Disable low performance mode
  private disableLowPerformanceMode(): void {
    this.isLowPerformanceMode = false;
    document.documentElement.classList.remove('low-performance');
  }

  // Optimize images for current performance level
  getOptimizedImageSize(): 'small' | 'medium' | 'large' {
    if (this.isLowPerformanceMode) return 'small';
    if (this.frameRate < 45) return 'medium';
    return 'large';
  }

  // Get recommended animation settings
  getAnimationSettings(): { enabled: boolean; duration: number; complexity: 'low' | 'medium' | 'high' } {
    if (this.isLowPerformanceMode) {
      return { enabled: false, duration: 0, complexity: 'low' };
    } else if (this.frameRate < 45) {
      return { enabled: true, duration: 150, complexity: 'medium' };
    } else {
      return { enabled: true, duration: 300, complexity: 'high' };
    }
  }

  // Memory management
  cleanupUnusedResources(): void {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Clear unused image caches
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.offsetParent) {
        img.src = '';
      }
    });
  }

  // Get performance metrics
  getPerformanceMetrics(): { frameRate: number; isLowPerformance: boolean; memoryUsage?: number } {
    const metrics: any = {
      frameRate: this.frameRate,
      isLowPerformance: this.isLowPerformanceMode
    };
    
    // Add memory usage if available
    if ((performance as any).memory) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
    
    return metrics;
  }
}

export const performanceService = PerformanceService.getInstance();