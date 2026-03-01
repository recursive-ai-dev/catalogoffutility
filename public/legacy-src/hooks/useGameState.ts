import { useState, useCallback, useEffect } from 'react';
import { GameState, Location, NPC, Question, PlayStyle } from '../types/game';
import { gameLogicService } from '../services/gameLogicService';
import { CacheService } from '../services/cacheService';
import { SanityLevel, createLocationId, NPCId } from '../types/core';
import { mobileService } from '../services/mobileService';
import { performanceService } from '../services/performanceService';
import { contentLoader } from '../services/contentLoader';

const initialGameState: GameState = {
  sanity: 100 as SanityLevel,
  daysSurvived: 0,
  currentLocation: createLocationId('cabin'),
  visitedLocations: new Set([createLocationId('cabin')]),
  answeredNPCs: new Set(),
  isInCabin: true,
  availableLocations: [],
  currentNPCs: [],
  selectedNPC: null,
  settings: {
    musicVolume: 75,
    soundVolume: 75,
    colorScheme: 'terminal',
    fullScreen: false,
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      colorBlindSupport: false,
      subtitles: false
    },
    performance: {
      quality: 'auto',
      frameRate: 'auto',
      enableAnimations: true,
      enableParticles: true,
      videoQuality: 'medium',
      preloadAssets: true
    },
    notifications: {
      achievements: true,
      warnings: true,
      tips: true,
      soundEffects: true
    }
  },
  achievements: [],
  inventory: [],
  stats: {
    totalPlayTime: 0,
    locationsVisited: 0,
    npcsEncountered: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    achievementsUnlocked: 0,
    itemsFound: 0,
    deathCount: 0,
    averageSanity: 100,
    longestSurvival: 0,
    favoriteLocation: 'cabin',
    playStyle: {
      explorer: 0,
      philosopher: 0,
      survivor: 0,
      socializer: 0,
      risktaker: 0
    } as PlayStyle
  },
  preferences: {
    autoSave: true,
    confirmActions: true,
    showHints: true,
    skipIntros: false,
    fastText: false
  },
  relationships: {},
  storyState: {},
  storyImpact: null
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Initialize services and load saved data
  useEffect(() => {
    const initializeGame = async () => {
      // Initialize content loader
      await contentLoader.loadAllContent();
      
      // Setup mobile optimizations
      mobileService.setupTouchGestures();
      mobileService.optimizeForMobile();
      
      // Load saved settings
      const savedSettings = await CacheService.getInstance().loadSettings();
      if (savedSettings) {
        setGameState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...savedSettings }
        } as any));
      }

      // Load saved game state if available
      const savedGameState = await CacheService.getInstance().loadGameState();
      if (savedGameState) {
        // Convert core.ts GameState to game.ts GameState
        const adaptedGameState = {
          ...savedGameState,
          stats: initialGameState.stats,
          preferences: initialGameState.preferences,
          relationships: initialGameState.relationships,
          storyState: initialGameState.storyState,
          storyImpact: initialGameState.storyImpact
        };
        setGameState(prev => ({
          ...adaptedGameState,
          settings: { ...prev.settings, ...adaptedGameState.settings }
        } as any));
      }
    };

    initializeGame();
  }, []);

  // Auto-save game state periodically
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (gameState.daysSurvived > 0) {
        // Convert GameState to match core.ts definition if needed
        const coreGameState = {
          ...gameState,
          solvedPuzzles: 0,
          completedEvents: [],
          dailyStreak: 0
        } as any;
        await CacheService.getInstance().saveGameState(coreGameState);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [gameState]);

  // Performance monitoring
  useEffect(() => {
    const performanceInterval = setInterval(() => {
      performanceService.cleanupUnusedResources();
    }, 60000); // Cleanup every minute

    return () => clearInterval(performanceInterval);
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(async (settings: Partial<GameState['settings']>) => {
    const newSettings = { ...gameState.settings, ...settings };
    await CacheService.getInstance().saveSettings(newSettings as any);
    setGameState(prev => ({
      ...prev,
      settings: newSettings
    } as any));
  }, [gameState.settings]);

  // Enhanced NPC generation using game logic service
  const generateNPCs = useCallback((locationId: string): NPC[] => {
    const location = contentLoader.getLocationById(locationId);
    if (!location) return [];
    
    const npcs = gameLogicService.generateNPCs(locationId, location.index);
    // Adapt NPC to match expected type if needed
    return npcs.map(npc => ({
      ...npc,
      locationId: createLocationId(locationId)
    })) as any;
  }, []);

  // Enhanced travel options generation
  const generateTravelOptions = useCallback((): string[] => {
    return gameLogicService.generateTravelOptions(gameState.visitedLocations, gameState.daysSurvived);
  }, [gameState.visitedLocations, gameState.daysSurvived]);

  // Enhanced travel logic with special items and better sanity management
  const travelToLocation = useCallback((locationId: string) => {
    setGameState(prev => {
      const newVisitedLocations = new Set(prev.visitedLocations);
      let sanityChange = 0;
      let specialItemFound = false;
      let itemName = '';
      
      if (locationId === 'cabin') {
        // Returning to cabin - save progress and increment days
        CacheService.getInstance().saveGameState({
          ...prev,
          solvedPuzzles: 0,
          completedEvents: [],
          dailyStreak: 0,
          daysSurvived: prev.daysSurvived + 1
        } as any);
        
        return {
          ...prev,
          currentLocation: createLocationId(locationId),
          isInCabin: true,
          daysSurvived: prev.daysSurvived + 1,
          currentNPCs: [],
          selectedNPC: null,
          availableLocations: []
        } as any;
      } else {
        // Leaving cabin - apply enhanced logic
        const locationIdTyped = createLocationId(locationId);
        if (!newVisitedLocations.has(locationIdTyped)) {
          newVisitedLocations.add(locationIdTyped);
          sanityChange = -5; // Base penalty for new location
          
          // Check for special items
          const itemResult = gameLogicService.checkForSpecialItem(locationIdTyped, newVisitedLocations);
          if (itemResult.found) {
            sanityChange += itemResult.sanityBonus;
            specialItemFound = true;
            itemName = itemResult.itemName;
          }
        }
        
        const newNPCs = generateNPCs(locationId);
        
        // Show special item notification if found
        if (specialItemFound) {
          // You could trigger a notification system here
          console.log(`Found special item: ${itemName}! Sanity restored.`);
        }
        
        return {
          ...prev,
          currentLocation: locationIdTyped,
          isInCabin: false,
          sanity: Math.min(120, Math.max(0, prev.sanity + sanityChange)) as SanityLevel, // Cap at 120%
          visitedLocations: newVisitedLocations,
          currentNPCs: newNPCs,
          selectedNPC: null,
          availableLocations: []
        } as any;
      }
    });
  }, [generateNPCs]);

  // Open door with enhanced logic
  const openDoor = useCallback(() => {
    const options = generateTravelOptions().map(opt => createLocationId(opt));
    setGameState(prev => ({
      ...prev,
      availableLocations: options
    } as any));
  }, [generateTravelOptions]);

  // Enhanced answer logic with better penalty calculation
  const answerQuestion = useCallback((npcId: string, answer: 'A' | 'B') => {
    const question = contentLoader.getQuestionByNpcId(npcId);
    const location = contentLoader.getLocationById(gameState.currentLocation);
    
    if (!question || !location) return;
    
    const isCorrect = answer === question.correctAnswer;
    const sanityPenalty = gameLogicService.calculateSanityPenalty(location.index, isCorrect);
    
    setGameState(prev => {
      const newAnsweredNPCs = new Set(prev.answeredNPCs);
      if (isCorrect) {
        newAnsweredNPCs.add(npcId as NPCId);
      }
      
      const newSanity = Math.max(0, prev.sanity - sanityPenalty) as SanityLevel;
      
      // Calculate and save high score if game ends
      if (newSanity === 0) {
        const finalScore = gameLogicService.calculateSurvivalScore(
          prev.daysSurvived, 
          prev.sanity, 
          newAnsweredNPCs.size
        );
        CacheService.getInstance().addHighScore(prev.daysSurvived, prev.sanity, finalScore);
      }
      
      return {
        ...prev,
        sanity: newSanity,
        answeredNPCs: newAnsweredNPCs,
        selectedNPC: null
      } as any;
    });
  }, [gameState.currentLocation]);

  // Enhanced reset with cleanup
  const resetGame = useCallback(async () => {
    await CacheService.getInstance().clearAll();
    performanceService.cleanupUnusedResources();
    
    setGameState(prev => ({
      ...initialGameState,
      settings: prev.settings // Preserve settings
    } as any));
  }, []);

  // Select NPC with mobile optimization
  const selectNPC = useCallback((npc: NPC) => {
    setGameState(prev => ({
      ...prev,
      selectedNPC: npc
    } as any));
    
    // Haptic feedback on mobile if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // Get current location data
  const getCurrentLocation = useCallback(() => {
    return contentLoader.getLocationById(gameState.currentLocation);
  }, [gameState.currentLocation]);

  // Get question for selected NPC with difficulty scaling
  const getCurrentQuestion = useCallback(() => {
    if (!gameState.selectedNPC) return null;
    const question = contentLoader.getQuestionByNpcId(gameState.selectedNPC.questionId || gameState.selectedNPC.id);
    
    if (question) {
      const location = getCurrentLocation();
      if (location) {
        const difficulty = gameLogicService.getQuestionDifficulty(location.index, gameState.daysSurvived);
        // You could modify question presentation based on difficulty
      }
    }
    
    return question;
  }, [gameState.selectedNPC, gameState.daysSurvived, getCurrentLocation]);

  return {
    gameState,
    travelToLocation,
    openDoor,
    answerQuestion,
    resetGame,
    selectNPC,
    saveSettings,
    getCurrentLocation,
    getCurrentQuestion,
    locations: contentLoader.getAllLocations(),
    questions: contentLoader.getQuestions()
  };
};
