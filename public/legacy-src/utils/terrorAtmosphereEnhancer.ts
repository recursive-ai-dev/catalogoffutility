/**
 * Terror Atmosphere Enhancer
 * Provides dynamic atmospheric effects based on game state
 */

export class TerrorAtmosphereEnhancer {
  private static instance: TerrorAtmosphereEnhancer;
  private atmosphericEffects: Map<string, HTMLElement> = new Map();
  private activeIntervals: NodeJS.Timeout[] = [];

  private constructor() {}

  static getInstance(): TerrorAtmosphereEnhancer {
    if (!TerrorAtmosphereEnhancer.instance) {
      TerrorAtmosphereEnhancer.instance = new TerrorAtmosphereEnhancer();
    }
    return TerrorAtmosphereEnhancer.instance;
  }

  /**
   * Initialize terror atmosphere based on sanity level
   */
  initializeAtmosphere(sanity: number, location: string): void {
    this.clearActiveEffects();
    
    if (sanity <= 10) {
      this.createCriticalTerrorEffects();
    } else if (sanity <= 20) {
      this.createHighTerrorEffects();
    } else if (sanity <= 40) {
      this.createModerateTerrorEffects();
    } else if (sanity <= 60) {
      this.createSubtleTerrorEffects();
    }

    this.addLocationSpecificEffects(location, sanity);
  }

  private createCriticalTerrorEffects(): void {
    // Screen distortion overlay
    this.createEffect('critical-distortion', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 0, 0, 0.1) 100%)',
      pointerEvents: 'none',
      zIndex: '1000',
      animation: 'terror-pulse 0.5s ease-in-out infinite alternate'
    });

    // Random screen flashes
    this.startRandomFlashes(200, 800);

    // Subtle cursor trail effect
    this.addCursorTrailEffect();
  }

  private createHighTerrorEffects(): void {
    // Red vignette
    this.createEffect('high-terror-vignette', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.15) 100%)',
      pointerEvents: 'none',
      zIndex: '999',
      animation: 'terror-breathe 3s ease-in-out infinite'
    });

    // Periodic screen flickers
    this.startRandomFlashes(1000, 3000);
  }

  private createModerateTerrorEffects(): void {
    // Subtle darkness overlay
    this.createEffect('moderate-terror-overlay', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'linear-gradient(45deg, transparent 70%, rgba(0, 0, 0, 0.1) 100%)',
      pointerEvents: 'none',
      zIndex: '998',
      animation: 'terror-drift 8s ease-in-out infinite'
    });
  }

  private createSubtleTerrorEffects(): void {
    // Very subtle atmospheric enhancement
    this.createEffect('subtle-terror-atmosphere', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'linear-gradient(180deg, transparent 80%, rgba(0, 0, 0, 0.05) 100%)',
      pointerEvents: 'none',
      zIndex: '997',
      animation: 'terror-subtle 15s ease-in-out infinite'
    });
  }

  private addLocationSpecificEffects(location: string, sanity: number): void {
    // Add location-specific atmospheric effects
    const locationEffects: Record<string, () => void> = {
      'ashlands': () => this.addFireEmberEffect(sanity),
      'cabin': () => this.addComfortingGlow(sanity),
      'underpass': () => this.addEchoEffect(sanity),
      'tall_grass': () => this.addWindEffect(sanity),
      'cliff_edge': () => this.addVerticalDistortion(sanity)
    };

    const effect = locationEffects[location];
    if (effect) {
      effect();
    }
  }

  private addFireEmberEffect(sanity: number): void {
    if (sanity > 50) return;

    this.createEffect('fire-embers', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: `
        radial-gradient(2px 2px at 20% 30%, rgba(255, 100, 0, 0.8), transparent),
        radial-gradient(2px 2px at 40% 70%, rgba(255, 150, 0, 0.6), transparent),
        radial-gradient(1px 1px at 90% 40%, rgba(255, 200, 0, 0.5), transparent)
      `,
      pointerEvents: 'none',
      zIndex: '996',
      animation: 'ember-float 4s ease-in-out infinite'
    });
  }

  private addComfortingGlow(sanity: number): void {
    if (sanity <= 30) return;

    this.createEffect('cabin-glow', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'radial-gradient(ellipse at center, rgba(255, 220, 150, 0.1) 0%, transparent 70%)',
      pointerEvents: 'none',
      zIndex: '995',
      animation: 'comfort-pulse 6s ease-in-out infinite'
    });
  }

  private addEchoEffect(sanity: number): void {
    // Add visual echo representation through delayed shadows
    const elements = document.querySelectorAll('.retro-button, .retro-panel');
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.filter += ` drop-shadow(2px 2px 4px rgba(0, 0, 0, ${0.3 + (100 - sanity) / 200}))`;
      }
    });
  }

  private addWindEffect(sanity: number): void {
    this.createEffect('wind-effect', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: `
        linear-gradient(45deg, transparent 0%, rgba(100, 150, 100, 0.05) 50%, transparent 100%)
      `,
      pointerEvents: 'none',
      zIndex: '994',
      animation: 'wind-sway 5s ease-in-out infinite'
    });
  }

  private addVerticalDistortion(sanity: number): void {
    if (sanity > 40) return;

    this.createEffect('cliff-vertigo', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.2) 100%)',
      pointerEvents: 'none',
      zIndex: '993',
      animation: 'vertigo-sway 3s ease-in-out infinite alternate'
    });
  }

  private addCursorTrailEffect(): void {
    let trail: HTMLElement[] = [];
    const maxTrail = 5;

    const createTrailDot = (x: number, y: number): HTMLElement => {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(255, 0, 0, 0.8) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        left: ${x - 2}px;
        top: ${y - 2}px;
        transition: opacity 0.3s ease-out;
      `;
      document.body.appendChild(dot);
      return dot;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      const dot = createTrailDot(e.clientX, e.clientY);
      trail.push(dot);

      if (trail.length > maxTrail) {
        const oldDot = trail.shift();
        if (oldDot) {
          oldDot.style.opacity = '0';
          setTimeout(() => {
            if (oldDot.parentNode) {
              oldDot.parentNode.removeChild(oldDot);
            }
          }, 300);
        }
      }

      // Fade out dots
      trail.forEach((trailDot, index) => {
        trailDot.style.opacity = (index / trail.length).toString();
      });
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    
    // Clean up after 30 seconds
    setTimeout(() => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      trail.forEach(dot => {
        if (dot.parentNode) {
          dot.parentNode.removeChild(dot);
        }
      });
    }, 30000);
  }

  private startRandomFlashes(minInterval: number, maxInterval: number): void {
    const flash = () => {
      this.createFlash();
      const nextFlash = minInterval + Math.random() * (maxInterval - minInterval);
      const timeout = setTimeout(flash, nextFlash);
      this.activeIntervals.push(timeout);
    };

    const initialDelay = Math.random() * maxInterval;
    const timeout = setTimeout(flash, initialDelay);
    this.activeIntervals.push(timeout);
  }

  private createFlash(): void {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 10001;
      animation: flash-effect 0.1s ease-out;
    `;

    document.body.appendChild(flash);

    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 100);
  }

  private createEffect(id: string, styles: Partial<CSSStyleDeclaration>): void {
    const element = document.createElement('div');
    element.id = `terror-effect-${id}`;
    
    Object.assign(element.style, styles);
    
    document.body.appendChild(element);
    this.atmosphericEffects.set(id, element);
  }

  private clearActiveEffects(): void {
    // Clear intervals
    this.activeIntervals.forEach(interval => clearTimeout(interval));
    this.activeIntervals = [];

    // Remove effect elements
    this.atmosphericEffects.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.atmosphericEffects.clear();

    // Remove any flash effects
    const flashes = document.querySelectorAll('[id^="terror-effect-"]');
    flashes.forEach(flash => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    });
  }

  /**
   * Update atmosphere when sanity changes
   */
  updateAtmosphere(sanity: number, location: string): void {
    this.initializeAtmosphere(sanity, location);
  }

  /**
   * Clean up all effects
   */
  destroy(): void {
    this.clearActiveEffects();
  }

  /**
   * Trigger a one-time dramatic effect
   */
  triggerDramaticEffect(type: 'sanity_loss' | 'sanity_gain' | 'location_change'): void {
    switch (type) {
      case 'sanity_loss':
        this.triggerSanityLossEffect();
        break;
      case 'sanity_gain':
        this.triggerSanityGainEffect();
        break;
      case 'location_change':
        this.triggerLocationChangeEffect();
        break;
    }
  }

  private triggerSanityLossEffect(): void {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, rgba(255, 0, 0, 0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: 10002;
      animation: sanity-loss-pulse 1s ease-out;
    `;

    document.body.appendChild(effect);

    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 1000);
  }

  private triggerSanityGainEffect(): void {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, rgba(0, 255, 100, 0.2) 0%, transparent 70%);
      pointer-events: none;
      z-index: 10002;
      animation: sanity-gain-pulse 1.5s ease-out;
    `;

    document.body.appendChild(effect);

    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 1500);
  }

  private triggerLocationChangeEffect(): void {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(0, 0, 0, 0.8) 0%, transparent 50%, rgba(0, 0, 0, 0.8) 100%);
      pointer-events: none;
      z-index: 10002;
      animation: location-transition 2s ease-in-out;
    `;

    document.body.appendChild(effect);

    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 2000);
  }
}

// Add new CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes flash-effect {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes terror-pulse {
    0% { opacity: 0.1; }
    100% { opacity: 0.3; }
  }

  @keyframes terror-breathe {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(1.02); }
  }

  @keyframes terror-drift {
    0%, 100% { transform: translateX(0) translateY(0); }
    25% { transform: translateX(2px) translateY(-1px); }
    50% { transform: translateX(0) translateY(2px); }
    75% { transform: translateX(-1px) translateY(0); }
  }

  @keyframes terror-subtle {
    0%, 100% { opacity: 0.05; }
    50% { opacity: 0.1; }
  }

  @keyframes ember-float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
    25% { transform: translateY(-10px) rotate(90deg); opacity: 0.6; }
    50% { transform: translateY(0) rotate(180deg); opacity: 0.8; }
    75% { transform: translateY(-5px) rotate(270deg); opacity: 0.4; }
  }

  @keyframes comfort-pulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.2; }
  }

  @keyframes wind-sway {
    0%, 100% { transform: translateX(0) skewX(0deg); }
    25% { transform: translateX(5px) skewX(1deg); }
    50% { transform: translateX(0) skewX(0deg); }
    75% { transform: translateX(-3px) skewX(-0.5deg); }
  }

  @keyframes vertigo-sway {
    0% { transform: scaleY(1) translateY(0); }
    100% { transform: scaleY(1.02) translateY(2px); }
  }

  @keyframes sanity-loss-pulse {
    0% { opacity: 0; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0; transform: scale(1.2); }
  }

  @keyframes sanity-gain-pulse {
    0% { opacity: 0; transform: scale(1.2); }
    30% { opacity: 0.8; transform: scale(0.9); }
    100% { opacity: 0; transform: scale(1); }
  }

  @keyframes location-transition {
    0% { opacity: 0; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
    100% { opacity: 0; transform: scale(1); }
  }
`;

document.head.appendChild(styleSheet);

export default TerrorAtmosphereEnhancer;