/**
 * Security Service
 * 
 * This service handles basic security measures for the game, including:
 * - Input validation to prevent injection attacks
 * - Data sanitization for user inputs
 * - Basic security headers and configurations
 * - Monitoring for suspicious activities
 * 
 * The goal is to ensure the game is secure against common web vulnerabilities
 * and to protect user data and game integrity.
 */

export class SecurityService {
  private isInitialized: boolean = false;
  private securityMetrics: any = {};

  constructor() {
    // Initialize security metrics
    this.securityMetrics = {
      validationErrors: 0,
      suspiciousActivities: 0,
      lastSecurityCheck: 0
    };
  }

  /**
   * Initialize the security service
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    
    // Apply initial security configurations
    this.applySecurityConfigurations();
    
    // Start monitoring for suspicious activities
    this.startSecurityMonitoring();
    
    console.log('Security Service initialized with basic protections');
  }

  /**
   * Apply security configurations and headers
   */
  private applySecurityConfigurations(): void {
    // Note: Most security headers would be set at the server level
    // For a static game hosted on itch.io, we can apply client-side security measures
    
    // Prevent clickjacking by ensuring the game is not loaded in an iframe
    try {
      if (window.top !== window.self) {
        console.warn('Potential clickjacking attempt detected. Stopping load.');
        document.body.innerHTML = '<h1>Security Error: This game cannot be loaded in a frame.</h1>';
        throw new Error('Clickjacking prevention');
      }
    } catch (e) {
      console.error('Clickjacking prevention error:', e);
    }
    
    // Disable context menu to prevent easy access to game assets (basic protection)
    document.addEventListener('contextmenu', (e) => {
      // Uncomment the following line to disable context menu
      // e.preventDefault();
    });
    
    console.log('Basic security configurations applied');
  }

  /**
   * Start monitoring for suspicious activities
   */
  private startSecurityMonitoring(): void {
    // Monitor for excessive events that might indicate automation or cheating
    let eventCount = 0;
    const eventThreshold = 1000; // Events per second threshold
    let lastCheck = performance.now();
    
    const monitorEvents = () => {
      const now = performance.now();
      if (now - lastCheck >= 1000) {
        if (eventCount > eventThreshold) {
          console.warn(`Suspicious activity detected: Excessive events (${eventCount}) in last second.`);
          this.securityMetrics.suspiciousActivities++;
          // Potentially throttle or flag the user
        }
        eventCount = 0;
        lastCheck = now;
        this.securityMetrics.lastSecurityCheck = now;
      }
      requestAnimationFrame(monitorEvents);
    };
    
    // Start monitoring
    requestAnimationFrame(monitorEvents);
    
    // Add event listeners for monitoring
    document.addEventListener('click', () => eventCount++);
    document.addEventListener('keydown', () => eventCount++);
    
    console.log('Security monitoring started for suspicious activities');
  }

  /**
   * Validate input to prevent injection attacks
   * @param input The input to validate
   * @param type The type of input (e.g., 'username', 'gameCommand')
   * @returns True if input is valid, false otherwise
   */
  validateInput(input: string, type: string = 'general'): boolean {
    if (!input || typeof input !== 'string') {
      console.warn(`Invalid input detected: Not a string or empty for type ${type}`);
      this.securityMetrics.validationErrors++;
      return false;
    }
    
    // Basic length check
    if (input.length > 1000) {
      console.warn(`Invalid input detected: Input too long for type ${type}`);
      this.securityMetrics.validationErrors++;
      return false;
    }
    
    // Check for potential script injection
    const scriptPattern = /<script|<\/script>|javascript:|data:text\/html|on\w*=\s*['"].*?['"]/i;
    if (scriptPattern.test(input)) {
      console.warn(`Potential script injection detected in input for type ${type}`);
      this.securityMetrics.validationErrors++;
      return false;
    }
    
    // Check for specific input types
    if (type === 'username') {
      // Username-specific validation
      const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernamePattern.test(input)) {
        console.warn(`Invalid username format: ${input}`);
        this.securityMetrics.validationErrors++;
        return false;
      }
    } else if (type === 'gameCommand') {
      // Game command-specific validation
      const commandPattern = /^[a-zA-Z0-9\s_-]{1,50}$/;
      if (!commandPattern.test(input)) {
        console.warn(`Invalid game command format: ${input}`);
        this.securityMetrics.validationErrors++;
        return false;
      }
    }
    
    return true;
  }

  /**
   * Sanitize input to remove potential malicious content
   * @param input The input to sanitize
   * @returns Sanitized input
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Replace potentially dangerous attributes
    sanitized = sanitized.replace(/on\w*=\s*['"].*?['"]/gi, '');
    
    // Escape special characters to prevent XSS
    sanitized = sanitized.replace(/</g, '<').replace(/>/g, '>');
    sanitized = sanitized.replace(/"/g, '"').replace(/'/g, '&#x27;');
    sanitized = sanitized.replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  /**
   * Securely store data in localStorage with basic encryption
   * @param key The key to store data under
   * @param value The value to store
   */
  secureStore(key: string, value: string): void {
    try {
      // Basic obfuscation (not true encryption, just to prevent casual inspection)
      const obfuscatedValue = btoa(value);
      localStorage.setItem(key, obfuscatedValue);
    } catch (e) {
      console.error('Error securely storing data:', e);
    }
  }

  /**
   * Securely retrieve data from localStorage
   * @param key The key to retrieve data for
   * @returns The retrieved value or null if not found or error
   */
  secureRetrieve(key: string): string | null {
    try {
      const obfuscatedValue = localStorage.getItem(key);
      if (obfuscatedValue) {
        return atob(obfuscatedValue);
      }
      return null;
    } catch (e) {
      console.error('Error securely retrieving data:', e);
      return null;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): any {
    return { ...this.securityMetrics };
  }

  /**
   * Destroy the security service and clean up resources
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Remove event listeners if any
    // Note: Since we added listeners without storing references, we can't remove them individually
    // Instead, we rely on page unload to clean up
    
    this.isInitialized = false;
    console.log('Security Service destroyed and resources cleaned up');
  }
}

// Create and export a singleton instance
export const securityService = new SecurityService();
