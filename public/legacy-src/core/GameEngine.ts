/**
 * Core Game Engine - The heart of our application
 * Implements the Command Pattern with Event Sourcing for perfect state management
 */

import { 
  GameState,
  GameEvent,
  GameEventType,
  GameCommand,
  CommandResult,
  CommandExecutedEvent,
  StateChangedEvent,
  EngineEvent,
  MetricsEvent,
  ErrorEvent,
  RecoveryAttemptedEvent,
  isGameEvent,
  isGameCommand
} from '../types/core';
import { StateManager } from './StateManager';
import { CommandProcessor } from './CommandProcessor';
import { EventStore } from './EventStore';

export class GameEngine {
  private static instance: GameEngine;
  private stateManager: StateManager;
  private commandProcessor: CommandProcessor;
  private eventStore: EventStore;
  private isRunning: boolean = false;
  private eventListeners: Map<string, Array<(event: GameEventType) => void>> = new Map();
  private wrappedListeners: WeakMap<(event: any) => void, (event: GameEventType) => void> = new WeakMap();

  private constructor() {
    this.stateManager = new StateManager();
    this.commandProcessor = new CommandProcessor(this);
    this.eventStore = new EventStore();
    this.setupEventHandlers();
  }

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  // Custom event emitter implementation for browser compatibility
  on<T extends GameEventType>(event: T['type'], listener: (event: T) => void): void {
    const wrappedListener = (e: GameEventType) => {
      if (e.type === event) {
        listener(e as T);
      }
    };
    this.wrappedListeners.set(listener, wrappedListener);
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(wrappedListener);
  }

  off<T extends GameEventType>(event: T['type'], listener: (event: T) => void): void {
    const wrappedListener = this.wrappedListeners.get(listener as (event: any) => void);
    if (!wrappedListener) return;
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(wrappedListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    this.wrappedListeners.delete(listener);
  }

  emit<T extends GameEventType>(event: T): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private setupEventHandlers(): void {
    this.on<StateChangedEvent>('StateChanged', this.handleStateChange.bind(this));
    this.on<CommandExecutedEvent>('CommandExecuted', this.handleCommandExecuted.bind(this));
    this.on<ErrorEvent>('Error', this.handleError.bind(this));
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await this.stateManager.initialize();
    await this.eventStore.initialize();
    const engineEvent: EngineEvent = {
      type: 'EngineEvent',
      timestamp: Date.now(),
      data: { type: 'started' }
    };
    this.emit(engineEvent);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    await this.stateManager.persist();
    const engineEvent: EngineEvent = {
      type: 'EngineEvent',
      timestamp: Date.now(),
      data: { type: 'stopped' }
    };
    this.emit(engineEvent);
  }

  async executeCommand<T extends GameCommand>(command: T): Promise<CommandResult> {
    if (!this.isRunning) {
      throw new Error('Game engine is not running');
    }

    if (!isGameCommand(command)) {
      throw new Error('Invalid command format');
    }

    try {
      const result = await this.commandProcessor.execute(command);
      const event: CommandExecutedEvent = {
        type: 'CommandExecuted',
        timestamp: Date.now(),
        data: {
          command,
          result,
          executionTime: Date.now() - command.timestamp
        }
      };
      this.emit(event);
      return result;
    } catch (error) {
      const errorEvent: ErrorEvent = {
        type: 'Error',
        timestamp: Date.now(),
        data: {
          command,
          error: error instanceof Error ? error : new Error(String(error))
        }
      };
      this.emit(errorEvent);
      throw error;
    }
  }

  getState(): Readonly<GameState> {
    return this.stateManager.getCurrentState();
  }

  subscribe<T extends GameEventType>(
    eventType: T['type'],
    handler: (event: T) => void
  ): () => void {
    const wrappedHandler = (e: GameEvent) => {
      if (e.type === eventType) {
        handler(e as T);
      }
    };
    this.on(eventType, wrappedHandler);
    return () => this.off(eventType, wrappedHandler);
  }

  private handleStateChange(event: StateChangedEvent): void {
    this.eventStore.append(event);
  }

  private handleCommandExecuted(event: CommandExecutedEvent): void {
    const { command, result } = event.data;
    console.log(`Command executed: ${command.type}`, { command, result });
    
    // Record metrics for command execution
    const metricsEvent: MetricsEvent = {
      type: 'Metrics',
      timestamp: Date.now(),
      data: {
        metricType: 'commandExecution',
        commandType: command.type,
        executionTime: event.data.executionTime,
        success: result.success
      }
    };
    this.emit(metricsEvent);
  }

  private handleError(event: ErrorEvent): void {
    const { error } = event.data;
    console.error('Game Engine Error:', error);
    
    // Record error metrics
    const metricsEvent: MetricsEvent = {
      type: 'Metrics',
      timestamp: Date.now(),
      data: {
        metricType: 'error',
        errorMessage: error.message,
        stack: error.stack,
        timestamp: event.timestamp
      }
    };
    this.emit(metricsEvent);

    // Attempt recovery if possible
    if ('recoverable' in error && error.recoverable) {
      console.log('Attempting recovery from error...');
      const recoveredState = this.stateManager.undo();
      const recoveryEvent: RecoveryAttemptedEvent = {
        type: 'RecoveryAttempted',
        timestamp: Date.now(),
        data: {
          error,
          success: !!recoveredState,
          reason: recoveredState ? undefined : 'No previous state available'
        }
      };
      this.emit(recoveryEvent);
    }
  }
}
