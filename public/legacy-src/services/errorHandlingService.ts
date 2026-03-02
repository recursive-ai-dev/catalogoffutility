/**
 * PRODUCTION-READY Error Handling Service
 * Removes performance monitoring that was causing long task warnings
 */

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'runtime' | 'network' | 'storage' | 'game_logic' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: any;
  userAgent: string;
  url: string;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  private errorListeners: Array<(error: ErrorReport) => void> = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript runtime errors
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'runtime',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'runtime',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: { reason: event.reason }
      });
    });

    // Handle React error boundaries
    this.setupReactErrorHandler();
  }

  private setupReactErrorHandler(): void {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const message = args.join(' ');
      if (message.includes('React') || message.includes('component')) {
        this.reportError({
          type: 'ui',
          severity: 'medium',
          message: `React Error: ${message}`,
          context: { args }
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  reportError(errorData: Partial<ErrorReport>): void {
    const error: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: errorData.type || 'runtime',
      severity: errorData.severity || 'medium',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      context: errorData.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error);
    }

    // Store in localStorage for persistence
    try {
      const storedErrors = JSON.parse(localStorage.getItem('game_errors') || '[]');
      storedErrors.push(error);
      localStorage.setItem('game_errors', JSON.stringify(storedErrors.slice(-50)));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }

  onError(listener: (error: ErrorReport) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByType(type: ErrorReport['type']): ErrorReport[] {
    return this.errors.filter(error => error.type === type);
  }

  getErrorsBySeverity(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errors.filter(error => error.severity === severity);
  }

  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem('game_errors');
  }

  // Specific error handling methods
  handleGameStateError(error: Error, context?: any): void {
    this.reportError({
      type: 'game_logic',
      severity: 'high',
      message: `Game State Error: ${error.message}`,
      stack: error.stack,
      context
    });
  }

  handleNetworkError(error: Error, context?: any): void {
    this.reportError({
      type: 'network',
      severity: 'medium',
      message: `Network Error: ${error.message}`,
      stack: error.stack,
      context
    });
  }

  handleStorageError(error: Error, context?: any): void {
    this.reportError({
      type: 'storage',
      severity: 'medium',
      message: `Storage Error: ${error.message}`,
      stack: error.stack,
      context
    });
  }

  // REMOVED: Performance monitoring that was causing long task warnings
  // This was triggering the 61ms long task detection
  monitorPerformance(): void {
    // Performance monitoring disabled in production to prevent long task warnings
    console.log('Performance monitoring disabled for production');
  }

  // Generate error report for debugging
  generateErrorReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.errors,
      gameState: this.getGameStateSnapshot()
    };

    return JSON.stringify(report, null, 2);
  }

  private getGameStateSnapshot(): any {
    try {
      const gameState = localStorage.getItem('ibt2-game-state-v2');
      return gameState ? JSON.parse(gameState) : null;
    } catch (e) {
      return { error: 'Failed to get game state snapshot' };
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();