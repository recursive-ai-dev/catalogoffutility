/**
 * Centralized Event Bus for Game and UI Events
 * Implements a publish/subscribe pattern for decoupled communication
 */

import { GameEvent } from '../types/core';

type EventHandler<T extends GameEvent> = (event: T) => void;
type EventMap = { [eventType: string]: EventHandler<GameEvent>[] };

export class EventBus {
  private static instance: EventBus;
  private events: EventMap = {};
  private eventHistory: GameEvent[] = [];
  private maxHistorySize: number = 100;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type with a handler
   * @param eventType The type of event to listen for
   * @param handler Callback function to handle the event
   * @returns Function to unsubscribe the handler
   */
  subscribe<T extends GameEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.events[eventType]) {
      this.events[eventType] = [];
    }
    this.events[eventType].push(handler as EventHandler<GameEvent>);
    
    return () => {
      this.events[eventType] = this.events[eventType].filter(h => h !== handler);
      if (this.events[eventType].length === 0) {
        delete this.events[eventType];
      }
    };
  }

  /**
   * Publish an event to all subscribed handlers
   * @param event The event to publish
   */
  publish<T extends GameEvent>(event: T): void {
    const eventType = event.type;
    if (this.events[eventType]) {
      // Create a copy of handlers to prevent issues if handlers are added/removed during iteration
      const handlers = [...this.events[eventType]];
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in handler for event ${eventType}:`, error);
        }
      });
    }
    
    // Store event in history for debugging and analytics
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get the history of published events
   * @returns Array of past events
   */
  getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear all event subscriptions
   */
  clearSubscriptions(): void {
    this.events = {};
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all event types currently subscribed to
   * @returns Array of event type strings
   */
  getSubscribedEventTypes(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Check if there are any subscribers for a specific event type
   * @param eventType The event type to check
   * @returns True if there are subscribers for the event type
   */
  hasSubscribers(eventType: string): boolean {
    return !!this.events[eventType] && this.events[eventType].length > 0;
  }
}

// Export a singleton instance for use throughout the application
export const eventBus = EventBus.getInstance();
