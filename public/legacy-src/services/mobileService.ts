/**
 * Enhanced Mobile Service with Landscape Optimization
 * Optimized for mobile gaming experience
 */

class MobileService {
  private static instance: MobileService;
  private isLandscape: boolean = false;
  private isMobile: boolean = false;
  private hasNotch: boolean = false;
  
  private constructor() {
    this.detectDevice();
    this.setupOrientationHandling();
    this.setupViewportHandling();
    this.setupPerformanceOptimizations();
  }
  
  static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  // Enhanced device detection
  private detectDevice(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isLandscape = window.innerWidth > window.innerHeight;
    
    // Detect notch/safe areas
    this.hasNotch = CSS.supports('padding-top: env(safe-area-inset-top)');
    
    // Apply mobile-specific classes
    if (this.isMobile) {
      document.documentElement.classList.add('mobile-device');
      if (this.hasNotch) {
        document.documentElement.classList.add('has-notch');
      }
    }
  }

  // Enhanced orientation handling with forced landscape
  private setupOrientationHandling(): void {
    const handleOrientationChange = () => {
      setTimeout(() => {
        this.isLandscape = window.innerWidth > window.innerHeight;
        this.adjustLayoutForOrientation();
        this.updateViewportMeta();
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Initial setup
    this.adjustLayoutForOrientation();
  }

  // Enhanced viewport handling
  private setupViewportHandling(): void {
    if (this.isMobile) {
      // Prevent zoom on double tap
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);

      // Handle viewport height changes (mobile keyboard)
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Handle safe areas
        if (this.hasNotch) {
          document.documentElement.style.setProperty('--safe-top', 'env(safe-area-inset-top)');
          document.documentElement.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom)');
          document.documentElement.style.setProperty('--safe-left', 'env(safe-area-inset-left)');
          document.documentElement.style.setProperty('--safe-right', 'env(safe-area-inset-right)');
        }
      };

      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
      
      // Update viewport meta tag
      this.updateViewportMeta();
    }
  }

  // Performance optimizations for mobile
  private setupPerformanceOptimizations(): void {
    if (!this.isMobile) return;

    // Reduce animation complexity on mobile
    document.documentElement.classList.add('mobile-optimized');

    // Optimize scroll performance
    const optimizeScrolling = () => {
      const scrollElements = document.querySelectorAll('.overflow-y-auto');
      scrollElements.forEach(element => {
        (element as HTMLElement).style.webkitOverflowScrolling = 'touch';
        (element as HTMLElement).style.overscrollBehavior = 'contain';
      });
    };

    // Run optimization after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeScrolling);
    } else {
      optimizeScrolling();
    }

    // Passive event listeners for better performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  // Layout adjustments for mobile landscape
  private adjustLayoutForOrientation(): void {
    const root = document.getElementById('root');
    if (!root) return;

    if (this.isMobile) {
      if (this.isLandscape) {
        root.classList.add('mobile-landscape');
        root.classList.remove('mobile-portrait');
        
        // Hide address bar in landscape
        this.hideAddressBar();
      } else {
        root.classList.add('mobile-portrait');
        root.classList.remove('mobile-landscape');
        
        // Show orientation prompt for portrait
        this.showOrientationPrompt();
      }
    }
  }

  // Update viewport meta tag dynamically
  private updateViewportMeta(): void {
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    if (this.isMobile && this.isLandscape) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    } else {
      viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    }
  }

  // Hide address bar on mobile
  private hideAddressBar(): void {
    if (this.isMobile) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    }
  }

  // Show orientation prompt
  private showOrientationPrompt(): void {
    if (!this.isMobile || this.isLandscape) return;

    const existingPrompt = document.getElementById('orientation-prompt');
    if (existingPrompt) return;

    const prompt = document.createElement('div');
    prompt.id = 'orientation-prompt';
    prompt.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 text-white font-pixel';
    prompt.innerHTML = `
      <div class="text-center p-6">
        <div class="text-6xl mb-4">📱</div>
        <div class="text-xl mb-4">Please rotate your device</div>
        <div class="text-sm text-gray-400">This game is optimized for landscape mode</div>
      </div>
    `;

    document.body.appendChild(prompt);

    // Remove prompt when landscape is detected
    const checkOrientation = () => {
      if (this.isLandscape) {
        prompt.remove();
      } else {
        setTimeout(checkOrientation, 500);
      }
    };
    setTimeout(checkOrientation, 500);
  }

  // Touch gesture handling
  setupTouchGestures(): void {
    if (!this.isMobile) return;

    let startY = 0;
    let startX = 0;

    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      // Prevent pull-to-refresh
      if (e.touches[0].clientY > startY) {
        e.preventDefault();
      }
      
      // Prevent horizontal scrolling
      if (Math.abs(e.touches[0].clientX - startX) > Math.abs(e.touches[0].clientY - startY)) {
        e.preventDefault();
      }
    }, { passive: false });

    // Add haptic feedback for interactions
    document.addEventListener('click', () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    });
  }

  // Optimize for mobile gaming
  optimizeForMobile(): void {
    if (!this.isMobile) return;

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Disable context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Optimize touch targets
    const style = document.createElement('style');
    style.textContent = `
      .mobile-device button,
      .mobile-device .retro-button {
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
      }
      
      .mobile-landscape {
        padding-left: var(--safe-left, 0);
        padding-right: var(--safe-right, 0);
      }
      
      .has-notch.mobile-landscape {
        padding-top: var(--safe-top, 0);
        padding-bottom: var(--safe-bottom, 0);
      }
      
      @media screen and (max-width: 768px) and (orientation: landscape) {
        .retro-panel {
          font-size: 14px;
        }
        
        .retro-button {
          padding: 8px 12px;
          font-size: 12px;
        }
        
        .retro-title {
          font-size: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Get optimal panel sizes for current device
  getPanelSizes(): { left: string; right: string; center: string } {
    if (this.isMobile && this.isLandscape) {
      return {
        left: 'w-40',
        right: 'w-40', 
        center: 'flex-1'
      };
    } else if (this.isMobile) {
      return {
        left: 'w-full',
        right: 'w-full',
        center: 'w-full'
      };
    } else {
      return {
        left: 'w-60',
        right: 'w-60',
        center: 'flex-1'
      };
    }
  }

  // Check if device should force landscape
  shouldForceLandscape(): boolean {
    return this.isMobile && !this.isLandscape;
  }

  // Get current device info
  getDeviceInfo(): { isMobile: boolean; isLandscape: boolean; screenSize: string; hasNotch: boolean } {
    return {
      isMobile: this.isMobile,
      isLandscape: this.isLandscape,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      hasNotch: this.hasNotch
    };
  }

  // Enable fullscreen mode
  async enableFullscreen(): Promise<boolean> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error);
    }
    return false;
  }

  // Exit fullscreen mode
  async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
    return false;
  }
}

export const mobileService = MobileService.getInstance();