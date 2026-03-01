import React, { useState, useEffect, useRef } from 'react';
import { useGame, useGameActions } from './enhanced/GameProvider';
import { useTranslation } from '../hooks/useTranslation';
// @ts-ignore - Temporarily bypass missing declaration file for audioService
import { audioService } from '../services/audioService';
import { assetPreloader } from '../services/assetPreloader';
import { performanceOptimizer } from '../services/performanceOptimizer';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { PromptBox } from './PromptBox';
import { HighScoreTracker } from './HighScoreTracker';
import { LanguageSelector } from './LanguageSelector';
import { contentLoader } from '../services/contentLoader';
import { 
  LazyPhotoAlbum, 
  LazyHowToBook, 
  LazyFuseBox
} from './LazyComponents';
import { AchievementNotification } from './enhanced/AchievementNotification';
import { DevTools } from './DevTools';
import { storyService } from '../services/storyService';
import { securityService } from '../services/securityService';

export function GameInterface() {
  const { state, error, isLoading } = useGame();
  const actions = useGameActions();
  const { game, isRTL } = useTranslation();
  
  const [radioEnabled, setRadioEnabled] = useState(false);
  const [showPhotoAlbum, setShowPhotoAlbum] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [showFuseBox, setShowFuseBox] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [sanityNotification, setSanityNotification] = useState<{
    isDecrease: boolean;
    change: number;
    currentSanity: number;
  } | null>(null);
  const previousSanityRef = useRef(state.sanity);
  const notificationTimeoutRef = useRef<number | null>(null);

  // Cast state to handle type discrepancies between core and game types
  const gameState = state as unknown as {
    sanity: number;
    daysSurvived: number;
    currentLocation: string;
    visitedLocations: Set<string>;
    answeredNPCs: Set<string>;
    isInCabin: boolean;
    availableLocations: string[];
    currentNPCs: any[];
    selectedNPC: any | null;
    settings: any;
    appliedCosmetics: Set<string>;
    unlockedFeatures: Set<string>;
    inventory: any[];
    achievements: Set<string>;
  };

  const allLocations = contentLoader.getAllLocations();
  
  // Memoize derived state to prevent unnecessary recalculations
  const currentLocation = React.useMemo(() => contentLoader.getLocationById(state.currentLocation), [state.currentLocation]);
  const currentQuestion = React.useMemo(() => {
    if (!state.selectedNPC) return null;
    return contentLoader.getQuestionByNpcId(state.selectedNPC.questionId || state.selectedNPC.id) || null;
  }, [state.selectedNPC]);
  const locationNamesMemo = React.useMemo(() => {
    return allLocations.reduce((acc, loc) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allLocations]);
  const activeStoryArcs = React.useMemo(() => storyService.getActiveStoryArcs(), [state.daysSurvived, state.visitedLocations, state.answeredNPCs, state.currentLocation]);

  const allNPCs = React.useMemo(() => {
    const npcMap = new Map<string, { id: string; name: string; imagePath: string }>();

    allLocations.forEach((location) => {
      location.characters?.forEach((npc) => {
        if (!npcMap.has(npc.id)) {
          npcMap.set(npc.id, {
            id: npc.id,
            name: npc.name,
            imagePath: npc.imagePath || '/images/default_npc.png'
          });
        }
      });
    });

    return Array.from(npcMap.values());
  }, [allLocations]);

  // Initialize performance and security services
  useEffect(() => {
    performanceOptimizer.initialize();
    performanceOptimizer.inlineCriticalCSS();
    performanceOptimizer.monitorPerformance();
    
    // Initialize security service
    securityService.initialize();
    
    // Preload critical assets
    assetPreloader.preloadCriticalAssets();
    
    // Content loading is now handled by useGameEngine - no need to call it here
    
    return () => {
      performanceOptimizer.destroy();
      securityService.destroy();
    };
  }, []);

  // Preload contextual assets based on game state
  useEffect(() => {
    assetPreloader.preloadContextualAssets(state);
  }, [state.currentLocation, state.availableLocations, state.currentNPCs]);

  // Apply RTL direction for right-to-left languages
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  // Show sanity change notification without violating hook rules.
  useEffect(() => {
    const previousSanity = previousSanityRef.current;
    if (previousSanity === gameState.sanity) {
      return;
    }

    const isDecrease = gameState.sanity < previousSanity;
    const change = Math.abs(gameState.sanity - previousSanity);

    audioService.playSanitySound(!isDecrease);
    setSanityNotification({
      isDecrease,
      change,
      currentSanity: gameState.sanity
    });

    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = window.setTimeout(() => {
      setSanityNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);

    previousSanityRef.current = gameState.sanity as number;
  }, [gameState.sanity]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Update audio service when settings change
  useEffect(() => {
    audioService.setVolume(gameState.settings.musicVolume, gameState.settings.soundVolume);
  }, [gameState.settings.musicVolume, gameState.settings.soundVolume]);

  // Update audio based on sanity level for dynamic terror effects
  useEffect(() => {
    audioService.setSanityLevel(gameState.sanity);
  }, [gameState.sanity]);

  // Play location music when location changes with enhanced transitions
  useEffect(() => {
    if (currentLocation && !radioEnabled) {
      audioService.playLocationMusic(currentLocation.musicPath, true);
    }
  }, [currentLocation, radioEnabled]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const theme = gameState.settings.colorScheme;
    
    // Remove all theme classes
    root.classList.remove('theme-terminal', 'theme-amber', 'theme-cyan', 'theme-synthwave', 'theme-alert', 'theme-matrix', 'theme-violet', 'theme-emerald', 'theme-sunset', 'theme-ice', 'theme-gold', 'theme-crimson', 'theme-forest', 'theme-ocean', 'theme-shadow');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    // Log available themes for debugging
    console.log('Available themes:', ['terminal', 'amber', 'cyan', 'synthwave', 'alert', 'matrix', 'violet', 'emerald', 'sunset', 'ice', 'gold', 'crimson', 'forest', 'ocean', 'shadow']);
  }, [gameState.settings.colorScheme]);

  // Enable dev tools with key combination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + D to toggle dev tools
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDevTools(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Visual effects based on applied cosmetics
  const getCosmicStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (gameState.appliedCosmetics?.has('golden_aura')) {
      styles.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
    }
    
    if (gameState.appliedCosmetics?.has('dark_theme')) {
      styles.filter = 'brightness(0.8) contrast(1.2)';
    }
    
    return styles;
  };

  // Check for unlocked features
  const hasUnlockedFeatures = gameState.unlockedFeatures?.size > 0;
  const hasCosmetics = gameState.appliedCosmetics?.size > 0;

  // Use memoized location names
  const locationNames = locationNamesMemo;

  const handleToggleRadio = async () => {
    const newRadioState = await audioService.toggleRadio();
    setRadioEnabled(newRadioState);
  };

  const handleUpdateSettings = async (newSettings: Partial<any>) => {
    // Use type assertion to bypass mismatch between core and game settings types
    await actions.updateSettings(newSettings as any);
  };

  // Handle loading a saved game
  const handleLoadGame = async (loadedGameState: any) => {
    try {
      // Reset the current game and load the saved state
      await actions.resetGame();
      
      // Apply the loaded settings as a partial state restoration
      if (loadedGameState.settings) {
        await actions.updateSettings(loadedGameState.settings);
      }
      
      console.log('Game loaded successfully with partial state restoration:', loadedGameState);
      console.log('Note: Full state restoration pending dedicated action implementation.');
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  const handleSelectLocation = async (locationId: string) => {
    console.log(`Selecting location: ${locationId}`);
    // Placeholder until selectLocation action is implemented
  };

  const handleViewMap = () => {
    console.log('Viewing map');
    // Placeholder until viewMap action is implemented
  };

  const handleViewInventory = () => {
    console.log('Viewing inventory');
    // Placeholder until viewInventory action is implemented
  };

  const handleViewJournal = () => {
    console.log('Viewing journal');
    // Placeholder until viewJournal action is implemented
  };

  const handleTravel = async (locationId: string) => {
    try {
      await actions.travelToLocation(locationId);
    } catch (err) {
      console.error('Error traveling to location:', err);
    }
  };

  const handleOpenDoor = async () => {
    // Implementation for opening door
    console.log('Opening door');
    await actions.openDoor();
  };

  const handleAnswerQuestion = async (npcId: string, answer: string) => {
    // Implementation for answering question with type casting to match expected type
    console.log(`Answering question for NPC: ${npcId} with answer: ${answer}`);
    await actions.answerQuestion(npcId, answer as "A" | "B");
  };

  const getHighScore = () => {
    return Math.max(state.daysSurvived, 0);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-pixel-dark text-white font-pixel flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚡</div>
          <div className="text-xl">{game.loading as string}</div>
          <div className="text-sm retro-dim mt-2 animate-fade-in">{(game as any).loadingEnhanced || 'Loading...'}</div>
          <div className="text-xs text-gray-400 mt-4 animate-pulse">Prepare to uncover the mysteries...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-red-900 text-white font-pixel flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-4xl mb-4 animate-bounce">💥</div>
          <div className="text-xl mb-4 glowing-text text-red-400">{game.systemError as string}</div>
          <div className="text-sm mb-4 text-gray-300">{error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="retro-button px-6 py-3 animate-pulse"
          >
            {game.restartSystem as string}
          </button>
        </div>
      </div>
    );
  }

  // Determine visual effects based on sanity level
  const getSanityEffectClasses = () => {
    if (gameState.sanity <= 20) return 'sanity-critical';
    if (gameState.sanity <= 40) return 'sanity-warning';
    return '';
  };

  const getHorrorAtmosphereClasses = () => {
    let classes = 'horror-atmosphere';
    if (gameState.sanity <= 30) classes += ' terror-flicker';
    if (gameState.sanity <= 10) classes += ' terror-glitch';
    return classes;
  };

  return (
    <div className={`h-screen w-screen bg-pixel-dark text-white font-pixel overflow-hidden flex flex-col ${getSanityEffectClasses()}`}>
      {/* Header - Three column layout with language selector in center */}
      <div className={`bg-pixel-gray border-b-2 border-pixel-accent p-2 flex-shrink-0 ${gameState.sanity <= 50 ? 'unsettling-drift' : ''}`}>
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left side - Game title with flickering effect */}
          <div className="flex items-center gap-4 justify-start">
            <h1 className="text-lg md:text-xl font-bold glowing-text animate-flicker">
              {game.title as string}
            </h1>
            <span className="text-xs retro-dim hidden sm:block animate-fade-in-out">
              {game.subtitle as string}
            </span>
          </div>
          
          {/* Center - Language Selector and Story Progress */}
          <div className="flex justify-center items-center gap-2">
            <LanguageSelector />
            {activeStoryArcs.length > 0 && (
              <div className="hidden md:block text-xs text-center max-w-[200px]">
                <div className="font-bold text-pixel-accent">{activeStoryArcs[0].title}</div>
                <div className="w-24 h-1 bg-gray-700 rounded-full mx-auto mt-1">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${activeStoryArcs[0].progress}%` }}
                  ></div>
                </div>
                {activeStoryArcs[0].teaser && (
                  <div className="text-[10px] text-gray-300 mt-1 italic animate-fade-in">
                    {activeStoryArcs[0].teaser}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right side - High Score Tracker and Daily Bonus/Streak Indicator */}
          <div className="flex justify-end items-center gap-2">
            <HighScoreTracker 
              currentDays={gameState.daysSurvived}
              currentSanity={gameState.sanity}
            />
            <div className="hidden sm:block text-xs text-yellow-300 font-bold animate-pulse cursor-pointer relative" onClick={() => console.log('Navigate to rewards page')}>
              <span className="absolute -top-1 -right-1 text-[10px] text-red-500 animate-bounce">!</span>
              {state.dailyStreak ? `Streak: ${state.dailyStreak} 🔥` : 'Daily Bonus Available!'}
            </div>
            {/* Feature Indicators */}
            {hasUnlockedFeatures && (
              <div className="text-xs text-green-400 font-bold animate-pulse" title="Unlocked Features Active">
                🔓 {gameState.unlockedFeatures.size}
              </div>
            )}
            {hasCosmetics && (
              <div className="text-xs text-purple-400 font-bold animate-pulse" title="Cosmetics Applied">
                ✨ {gameState.appliedCosmetics.size}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Area - Enhanced with horror atmosphere */}
      <div className={`flex-1 flex flex-col sm:flex-row gap-2 p-responsive-sm min-h-0 overflow-hidden relative ${getHorrorAtmosphereClasses()}`} style={getCosmicStyles()}>
        {/* Enhanced animated background overlay for deeper atmosphere */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 opacity-30"></div>
          <div className="absolute inset-0 animate-subtle-fog opacity-15"></div>
          <div className="absolute inset-0 animate-slow-rain opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-slow-pan opacity-5"></div>
        </div>
        {/* Left Panel - Responsive width */}
        <div className="w-full sm:w-48 md:w-60 flex flex-col min-h-0">
          <LeftPanel
            npcs={gameState.currentNPCs}
            selectedNPC={gameState.selectedNPC}
            onSelectNPC={(npc) => actions.selectNPC(npc.id)}
            answeredNPCs={gameState.answeredNPCs}
            isInCabin={gameState.isInCabin}
            onOpenDoor={actions.openDoor}
            onToggleRadio={handleToggleRadio}
            onViewPhotoAlbum={() => {
              setShowPhotoAlbum(true);
            }}
            onViewBook={() => {
              setShowBook(true);
            }}
            onUseShotgun={actions.resetGame}
            onOpenFuseBox={() => {
              setShowFuseBox(true);
            }}
            radioEnabled={radioEnabled}
            gameState={gameState}
          />
        </div>

        {/* Center Panel - Flexible width */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <CenterPanel
              selectedNPC={gameState.selectedNPC}
              onAnswer={handleAnswerQuestion}
              answeredNPCs={gameState.answeredNPCs}
              isInCabin={gameState.isInCabin}
              gameState={gameState}
              onUseBooster={(boosterId) => console.log(`Using booster: ${boosterId}`)}
              onBuyBooster={(boosterId, cost) => console.log(`Buying booster: ${boosterId}, Cost: ${cost}`)}
              availableBoosters={[]}
              sanity={gameState.sanity}
            />
          </div>
          
          {/* Prompt Box - Responsive height */}
          <div className="flex-shrink-0 h-32 sm:h-40">
            <PromptBox
              selectedNPC={gameState.selectedNPC}
              question={currentQuestion as any}
              onAnswer={handleAnswerQuestion}
              answeredNPCs={gameState.answeredNPCs}
              isInCabin={gameState.isInCabin}
            />
          </div>
        </div>

        {/* Right Panel - Responsive width */}
        <div className="w-full sm:w-48 md:w-60 flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <RightPanel
              location={state.currentLocation}
              inventory={[]}
              onSelectLocation={handleSelectLocation}
              onViewMap={handleViewMap}
              onViewInventory={handleViewInventory}
              onViewJournal={handleViewJournal}
              sanity={gameState.sanity}
              gameState={gameState}
              isInCabin={gameState.isInCabin}
              availableLocations={gameState.availableLocations}
              locationNames={locationNames}
              onTravel={handleTravel}
              onOpenDoor={handleOpenDoor}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Game Over Screen with Terror Effects */}
      {gameState.sanity === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-98 flex items-center justify-center z-40 terror-glitch loading-terror">
          <div className="retro-panel text-center max-w-md mx-4 border-4 border-red-700 modal-enter sanity-critical">
            <div className="mb-6">
              <div className="text-6xl mb-4 animate-pulse text-red-500">☠️</div>
              <h2 className="text-2xl md:text-3xl font-bold text-red-400 mb-4 glowing-text terror-flicker">
                SYSTEM FAILURE
              </h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-lg text-red-300 font-bold">
                SANITY CORE: 0% - CRITICAL FAILURE
              </p>
              <p className="text-md text-gray-200">
                SURVIVAL DURATION: {gameState.daysSurvived} {gameState.daysSurvived === 1 ? 'DAY' : 'DAYS'}
              </p>
              <div className="border-t border-red-700 pt-4">
                <p className="text-sm text-gray-400 italic leading-relaxed">
                  "The abyss gazed back... and you blinked first."
                </p>
                <p className="text-xs text-red-500 mt-2 font-mono">
                  [PSYCHOLOGICAL CONTAINMENT BREACH DETECTED]
                </p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                await audioService.playSound('/sounds/ui/system_reset.mp3');
                // Brief pause for dramatic effect
                setTimeout(() => {
                  actions.resetGame();
                }, 300);
              }}
              className="retro-button px-8 py-4 text-lg bg-red-800 border-red-500 hover:bg-red-600 terror-flicker transition-all duration-300"
            >
              EMERGENCY RESET PROTOCOL
            </button>
            
            <div className="mt-4 text-xs text-gray-500">
              "Every ending is a new beginning..."
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sanity Change Notification System */}
      {sanityNotification && (
        <div className={`absolute top-4 right-4 px-6 py-3 rounded-lg z-50 notification-enter ${
          sanityNotification.isDecrease
            ? 'sanity-notification border-2 border-red-400'
            : 'bg-green-800 bg-opacity-90 border-2 border-green-400 backdrop-blur-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${
              sanityNotification.isDecrease ? 'animate-pulse' : 'animate-bounce'
            }`}>
              {sanityNotification.isDecrease ? '⚠️' : '✨'}
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg ${
                sanityNotification.isDecrease ? 'text-red-200' : 'text-green-200'
              }`}>
                SANITY {sanityNotification.isDecrease ? 'DECREASED' : 'RESTORED'}
              </div>
              <div className={`text-sm ${
                sanityNotification.isDecrease ? 'text-red-300' : 'text-green-300'
              }`}>
                {sanityNotification.isDecrease ? '-' : '+'}{sanityNotification.change} points
              </div>
              <div className="text-xs opacity-75 mt-1">
                Current: {sanityNotification.currentSanity}%
              </div>
            </div>
          </div>
          
          {/* Critical warning for low sanity */}
          {sanityNotification.currentSanity <= 20 && (
            <div className="mt-2 text-xs text-red-200 border-t border-red-400 pt-2 text-center animate-pulse">
              ⚠️ CRITICAL LEVELS DETECTED ⚠️
            </div>
          )}
          
          {/* Overcharge indicator for high sanity */}
          {sanityNotification.currentSanity > 100 && (
            <div className="mt-2 text-xs text-yellow-200 border-t border-yellow-400 pt-2 text-center animate-pulse">
              ⚡ SANITY OVERCHARGED ⚡
            </div>
          )}
        </div>
      )}

      {/* Lazy-loaded Modals */}
      <LazyPhotoAlbum
        isOpen={showPhotoAlbum}
        onClose={() => setShowPhotoAlbum(false)}
        answeredNPCs={gameState.answeredNPCs}
        allNPCs={allNPCs}
      />

      <LazyHowToBook
        isOpen={showBook}
        onClose={() => setShowBook(false)}
      />

      <LazyFuseBox
        isOpen={showFuseBox}
        onClose={() => setShowFuseBox(false)}
        settings={gameState.settings}
        onUpdateSettings={handleUpdateSettings}
        gameState={gameState}
        onLoadGame={handleLoadGame}
      />
      
      {/* Achievement Notification */}
      <AchievementNotification />
      
      {/* Developer Tools */}
      <DevTools 
        isOpen={showDevTools}
        onClose={() => setShowDevTools(false)}
      />
      
      {/* Dev Tools Hint */}
      {process.env.NODE_ENV === 'development' && !showDevTools && (
        <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-black bg-opacity-50 px-2 py-1 rounded">
          Press Ctrl+Shift+D for Dev Tools
        </div>
      )}
    </div>
  );
}
