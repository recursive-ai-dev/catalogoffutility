/**
 * Enhanced Event Store with proper initialization
 * Implements event sourcing patterns for game state management
 */

import { GameEvent } from '../types/core';

export class EventStore {
  private events: GameEvent[] = [];
  private maxEvents: number = 1000;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load persisted events from localStorage if available
      const savedEvents = localStorage.getItem('ibt2-event-store');
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
      
      this.isInitialized = true;
      console.log('EventStore initialized successfully');
    } catch (error) {
      console.warn('Failed to load persisted events, starting fresh:', error);
      this.events = [];
      this.isInitialized = true;
    }
  }

  append(event: GameEvent): void {
    if (!this.isInitialized) {
      console.warn('EventStore not initialized, initializing now...');
      this.initialize();
    }

    this.events.push(event);
    
    // Keep only the last maxEvents to prevent memory issues
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Persist events to localStorage
    this.persistEvents();
  }

  getEvents(): readonly GameEvent[] {
    return this.events;
  }

  getEventsSince(timestamp: number): readonly GameEvent[] {
    return this.events.filter(event => event.timestamp >= timestamp);
  }

  getEventsByType(type: string): readonly GameEvent[] {
    return this.events.filter(event => event.type === type);
  }

  clear(): void {
    this.events = [];
    this.persistEvents();
  }

  getLastEvent(): GameEvent | null {
    return this.events.length > 0 ? this.events[this.events.length - 1] : null;
  }

  getEventCount(): number {
    return this.events.length;
  }

  private persistEvents(): void {
    try {
      localStorage.setItem('ibt2-event-store', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to persist events:', error);
    }
  }
}