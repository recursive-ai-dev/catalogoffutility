/**
 * Advanced Analytics Service for Player Behavior Tracking
 * Provides insights into gameplay patterns and performance metrics
 */

import { GameState, PlayStyle } from '../types/game';
import { CacheService } from './cacheService';

interface AnalyticsEvent {
  type: string;
  timestamp: number;
  sessionId: string;
  data: any;
  location?: string;
  sanity?: number;
  daysSurvived?: number;
}

interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: AnalyticsEvent[];
  gameState: Partial<GameState>;
}

interface PlayerMetrics {
  totalPlayTime: number;
  averageSessionLength: number;
  totalSessions: number;
  locationsDiscovered: number;
  questionsAnswered: number;
  correctAnswerRate: number;
  averageSanity: number;
  longestSurvival: number;
  preferredPlayStyle: PlayStyle;
  mostVisitedLocation: string;
  favoriteTimeOfDay: string;
  difficultyProgression: number[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cacheService: CacheService;
  private currentSession: SessionData | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.startFlushTimer();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  startSession(gameState: GameState): void {
    this.endSession();
    
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      events: [],
      gameState: {
        sanity: gameState.sanity,
        daysSurvived: gameState.daysSurvived,
        currentLocation: gameState.currentLocation
      }
    };

    this.trackEvent('session_start', {
      gameVersion: '2.0',
      platform: this.getPlatform(),
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent.substring(0, 100)
    });
  }

  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    this.trackEvent('session_end', {
      duration: this.currentSession.duration,
      eventsCount: this.currentSession.events.length
    });

    this.saveSession(this.currentSession);
    this.currentSession = null;
  }

  trackEvent(type: string, data: any = {}, gameState?: GameState): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'no-session',
      data,
      location: gameState?.currentLocation,
      sanity: gameState?.sanity,
      daysSurvived: gameState?.daysSurvived
    };

    this.eventQueue.push(event);
    
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }

    // Immediate flush for critical events
    if (['game_over', 'achievement_unlocked', 'error'].includes(type)) {
      this.flushEvents();
    }
  }

  // Specific tracking methods for common events
  trackLocationVisit(locationId: string, gameState: GameState): void {
    this.trackEvent('location_visit', {
      locationId,
      isFirstVisit: !gameState.visitedLocations.has(locationId),
      visitCount: this.getLocationVisitCount(locationId)
    }, gameState);
  }

  trackNPCInteraction(npcId: string, action: 'select' | 'answer', gameState: GameState): void {
    this.trackEvent('npc_interaction', {
      npcId,
      action,
      relationship: this.getNPCRelationship(npcId, gameState)
    }, gameState);
  }

  trackQuestionAnswer(npcId: string, answer: 'A' | 'B', correct: boolean, gameState: GameState): void {
    this.trackEvent('question_answer', {
      npcId,
      answer,
      correct,
      sanityBefore: gameState.sanity,
      timeTaken: this.getQuestionTime(npcId)
    }, gameState);
  }

  trackSanityChange(oldSanity: number, newSanity: number, reason: string, gameState: GameState): void {
    this.trackEvent('sanity_change', {
      oldSanity,
      newSanity,
      change: newSanity - oldSanity,
      reason,
      percentage: (newSanity / 100) * 100
    }, gameState);
  }

  trackAchievementUnlocked(achievementId: string, gameState: GameState): void {
    this.trackEvent('achievement_unlocked', {
      achievementId,
      totalAchievements: gameState.achievements?.length || 0,
      playTime: gameState.stats?.totalPlayTime || 0
    }, gameState);
  }

  trackGameOver(reason: string, gameState: GameState): void {
    this.trackEvent('game_over', {
      reason,
      finalSanity: gameState.sanity,
      daysSurvived: gameState.daysSurvived,
      locationsVisited: gameState.visitedLocations.size,
      npcsAnswered: gameState.answeredNPCs.size,
      playStyle: this.calculatePlayStyle(gameState)
    }, gameState);
  }

  trackPerformanceMetric(metric: string, value: number, context?: any): void {
    this.trackEvent('performance_metric', {
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }

  async getPlayerMetrics(): Promise<PlayerMetrics> {
    const sessions = await this.getAllSessions();
    const events = sessions.flatMap(s => s.events);

    return {
      totalPlayTime: this.calculateTotalPlayTime(sessions),
      averageSessionLength: this.calculateAverageSessionLength(sessions),
      totalSessions: sessions.length,
      locationsDiscovered: this.getUniqueLocations(events).length,
      questionsAnswered: events.filter(e => e.type === 'question_answer').length,
      correctAnswerRate: this.calculateCorrectAnswerRate(events),
      averageSanity: this.calculateAverageSanity(events),
      longestSurvival: this.getLongestSurvival(events),
      preferredPlayStyle: this.getPreferredPlayStyle(events),
      mostVisitedLocation: this.getMostVisitedLocation(events),
      favoriteTimeOfDay: this.getFavoriteTimeOfDay(events),
      difficultyProgression: this.getDifficultyProgression(events)
    };
  }

  async getHeatmapData(): Promise<{ location: string; visits: number; avgSanity: number }[]> {
    const sessions = await this.getAllSessions();
    const events = sessions.flatMap(s => s.events);
    const locationEvents = events.filter(e => e.type === 'location_visit');

    const locationData = new Map<string, { visits: number; totalSanity: number }>();

    locationEvents.forEach(event => {
      const location = event.data.locationId;
      const sanity = event.sanity || 0;
      
      if (!locationData.has(location)) {
        locationData.set(location, { visits: 0, totalSanity: 0 });
      }
      
      const data = locationData.get(location)!;
      data.visits++;
      data.totalSanity += sanity;
    });

    return Array.from(locationData.entries()).map(([location, data]) => ({
      location,
      visits: data.visits,
      avgSanity: data.visits > 0 ? data.totalSanity / data.visits : 0
    }));
  }

  async getPlaytimeAnalysis(): Promise<{
    dailyPlaytime: { date: string; minutes: number }[];
    peakHours: number[];
    sessionLengthDistribution: { range: string; count: number }[];
  }> {
    const sessions = await this.getAllSessions();
    
    return {
      dailyPlaytime: this.getDailyPlaytime(sessions),
      peakHours: this.getPeakHours(sessions),
      sessionLengthDistribution: this.getSessionLengthDistribution(sessions)
    };
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];
      
      await this.cacheService.set(`analytics_events_${Date.now()}`, events, {
        compress: true,
        ttl: 90 * 24 * 60 * 60 * 1000 // 90 days
      });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  private async saveSession(session: SessionData): Promise<void> {
    try {
      await this.cacheService.set(`session_${session.id}`, session, {
        compress: true,
        ttl: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private async getAllSessions(): Promise<SessionData[]> {
    // This would need to be implemented based on your cache service capabilities
    // For now, return empty array
    return [];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet')) return 'tablet';
    return 'desktop';
  }

  private getLocationVisitCount(locationId: string): number {
    // Implementation would track visit counts
    return 1;
  }

  private getNPCRelationship(npcId: string, gameState: GameState): number {
    // Implementation would track NPC relationships
    return 0;
  }

  private getQuestionTime(npcId: string): number {
    // Implementation would track time spent on questions
    return 0;
  }

  private calculatePlayStyle(gameState: GameState): PlayStyle {
    // Implementation would calculate play style based on actions
    return {
      explorer: 20,
      philosopher: 20,
      survivor: 20,
      socializer: 20,
      risktaker: 20
    };
  }

  private calculateTotalPlayTime(sessions: SessionData[]): number {
    return sessions.reduce((total, session) => total + (session.duration || 0), 0);
  }

  private calculateAverageSessionLength(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;
    return this.calculateTotalPlayTime(sessions) / sessions.length;
  }

  private getUniqueLocations(events: AnalyticsEvent[]): string[] {
    const locations = new Set<string>();
    events.filter(e => e.type === 'location_visit').forEach(e => {
      locations.add(e.data.locationId);
    });
    return Array.from(locations);
  }

  private calculateCorrectAnswerRate(events: AnalyticsEvent[]): number {
    const answerEvents = events.filter(e => e.type === 'question_answer');
    if (answerEvents.length === 0) return 0;
    
    const correctAnswers = answerEvents.filter(e => e.data.correct).length;
    return (correctAnswers / answerEvents.length) * 100;
  }

  private calculateAverageSanity(events: AnalyticsEvent[]): number {
    const sanityEvents = events.filter(e => e.sanity !== undefined);
    if (sanityEvents.length === 0) return 0;
    
    const totalSanity = sanityEvents.reduce((sum, e) => sum + (e.sanity || 0), 0);
    return totalSanity / sanityEvents.length;
  }

  private getLongestSurvival(events: AnalyticsEvent[]): number {
    const gameOverEvents = events.filter(e => e.type === 'game_over');
    if (gameOverEvents.length === 0) return 0;
    
    return Math.max(...gameOverEvents.map(e => e.data.daysSurvived || 0));
  }

  private getPreferredPlayStyle(events: AnalyticsEvent[]): PlayStyle {
    // Analyze events to determine preferred play style
    return {
      explorer: 20,
      philosopher: 20,
      survivor: 20,
      socializer: 20,
      risktaker: 20
    };
  }

  private getMostVisitedLocation(events: AnalyticsEvent[]): string {
    const locationCounts = new Map<string, number>();
    
    events.filter(e => e.type === 'location_visit').forEach(e => {
      const location = e.data.locationId;
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });
    
    let mostVisited = '';
    let maxCount = 0;
    
    for (const [location, count] of locationCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostVisited = location;
      }
    }
    
    return mostVisited;
  }

  private getFavoriteTimeOfDay(events: AnalyticsEvent[]): string {
    const hourCounts = new Map<number, number>();
    
    events.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    let favoriteHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of hourCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteHour = hour;
      }
    }
    
    if (favoriteHour >= 6 && favoriteHour < 12) return 'morning';
    if (favoriteHour >= 12 && favoriteHour < 18) return 'afternoon';
    if (favoriteHour >= 18 && favoriteHour < 22) return 'evening';
    return 'night';
  }

  private getDifficultyProgression(events: AnalyticsEvent[]): number[] {
    // Analyze how player difficulty/performance changes over time
    return [1, 1.2, 1.5, 1.8, 2.0];
  }

  private getDailyPlaytime(sessions: SessionData[]): { date: string; minutes: number }[] {
    const dailyData = new Map<string, number>();
    
    sessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const minutes = (session.duration || 0) / (1000 * 60);
      dailyData.set(date, (dailyData.get(date) || 0) + minutes);
    });
    
    return Array.from(dailyData.entries()).map(([date, minutes]) => ({ date, minutes }));
  }

  private getPeakHours(sessions: SessionData[]): number[] {
    const hourCounts = new Map<number, number>();
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    return Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);
  }

  private getSessionLengthDistribution(sessions: SessionData[]): { range: string; count: number }[] {
    const ranges = [
      { range: '0-5 min', min: 0, max: 5 * 60 * 1000 },
      { range: '5-15 min', min: 5 * 60 * 1000, max: 15 * 60 * 1000 },
      { range: '15-30 min', min: 15 * 60 * 1000, max: 30 * 60 * 1000 },
      { range: '30-60 min', min: 30 * 60 * 1000, max: 60 * 60 * 1000 },
      { range: '60+ min', min: 60 * 60 * 1000, max: Infinity }
    ];
    
    return ranges.map(range => ({
      range: range.range,
      count: sessions.filter(s => {
        const duration = s.duration || 0;
        return duration >= range.min && duration < range.max;
      }).length
    }));
  }
}

export const analyticsService = AnalyticsService.getInstance();
