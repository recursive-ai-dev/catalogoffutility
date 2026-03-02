import React, { useState, useEffect } from 'react';
import { Heart, AlertTriangle, Calendar, Zap, Clock, Award, Lightbulb, Users, MessageSquare, Search, X } from 'lucide-react';
import { NPC } from '../types/game';
import { useTranslation } from '../hooks/useTranslation';
import { BoosterBadge } from './BoosterBadge';
import { VideoPlayer } from './VideoPlayer';
import { contentLoader } from '../services/contentLoader';

interface CenterPanelProps {
  selectedNPC: NPC | null;
  onAnswer: (npcId: string, answer: string) => void;
  answeredNPCs: Set<string>;
  isInCabin: boolean;
  gameState: any;
  onUseBooster: (boosterId: string) => void;
  onBuyBooster: (boosterId: string, cost: number) => void;
  availableBoosters: Array<{ id: string, name: string, description: string, cost: number, count: number, canUse: boolean }>;
  sanity: number;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  selectedNPC,
  onAnswer,
  answeredNPCs,
  isInCabin,
  gameState,
  onUseBooster,
  onBuyBooster,
  availableBoosters,
  sanity
}) => {
  const { entities, cabin, mental } = useTranslation();
  const [showBoosterStore, setShowBoosterStore] = useState(false);
  const currentLocation = gameState?.currentLocation
    ? contentLoader.getLocationById(gameState.currentLocation)
    : null;
  
  // Determine visual effects based on sanity level
  const getSanityVisualEffects = () => {
    if (sanity <= 10) return 'terror-glitch sanity-critical';
    if (sanity <= 20) return 'terror-flicker sanity-critical';
    if (sanity <= 40) return 'sanity-warning';
    if (sanity <= 60) return 'unsettling-drift';
    return '';
  };
  
  const getPanelAtmosphere = () => {
    let classes = 'retro-panel h-full';
    if (sanity <= 30) classes += ' horror-atmosphere';
    return classes;
  };

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timeWarning, setTimeWarning] = useState<boolean>(false);
  
  useEffect(() => {
    if (!isInCabin) {
      // Initialize timer to 3 minutes (180 seconds)
      let totalSeconds = 180;
      setTimeWarning(false);
      
      const updateTimer = () => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // Warn when less than 30 seconds remain
        if (totalSeconds < 30 && totalSeconds > 0) {
          setTimeWarning(true);
        }
        
        if (totalSeconds <= 0) {
          setTimeRemaining("0:00");
          setTimeWarning(false);
          clearInterval(timer);
        }
        
        totalSeconds--;
      };
      
      // Update timer every second
      const timer = setInterval(updateTimer, 1000);
      updateTimer(); // Initial update
      
      return () => clearInterval(timer);
    }
  }, [isInCabin]);

  if (!isInCabin && !selectedNPC) {
    return (
      <div className={`${getPanelAtmosphere()} flex flex-col p-2 sm:p-3 relative overflow-hidden ${getSanityVisualEffects()}`}>
        <div className={`absolute inset-0 bg-black bg-opacity-20 z-0 ${sanity <= 40 ? 'animate-subtle-flicker' : ''}`}></div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className={`retro-border flex items-center justify-center relative overflow-hidden bg-black mx-auto ${sanity <= 50 ? 'animate-mystery-pulse' : ''}`}>
            <VideoPlayer
              videoPath={currentLocation?.videoPath || '/videos/locations/underpass_video.mp4'}
              sanity={sanity}
              loop={true}
              muted={true}
              className="w-40 h-28 sm:w-56 sm:h-36 md:w-72 md:h-44"
              overlayText={currentLocation?.name || 'UNKNOWN LOCATION'}
            />
          </div>
          <div className="retro-border p-4 sm:p-6 text-center animate-mystery-pulse">
            <div className="text-base sm:text-xl retro-dim mb-2 sm:mb-3">
              {currentLocation?.description || String(entities.noEntities)}
            </div>
            <div className="text-sm sm:text-lg retro-accent">{String(entities.selectEntity)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isInCabin && selectedNPC) {
    const isAnswered = answeredNPCs.has(selectedNPC.id);
    const hasQuestion = selectedNPC.questionId ? true : false;
    
    return (
      <div className={`${getPanelAtmosphere()} flex flex-col p-2 sm:p-3 relative overflow-hidden ${getSanityVisualEffects()}`}>
        <div className={`absolute inset-0 bg-black bg-opacity-20 z-0 ${sanity <= 40 ? 'animate-subtle-flicker' : ''}`}></div>
        <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-shrink-0">
          <Users size={20} className="retro-accent flex-shrink-0" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold retro-text truncate">
            {selectedNPC.name.toUpperCase()}
          </h3>
        </div>
        
        <div className={`retro-border mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden bg-black mx-auto ${sanity <= 50 ? 'animate-mystery-pulse' : ''} ${sanity <= 30 ? 'terror-flicker' : ''}`}>
          {/* Video player for NPC encounters */}
          <VideoPlayer
            videoPath={selectedNPC.videoPath || `/videos/npcs/${selectedNPC.id}_video.mp4`}
            sanity={sanity}
            loop={true}
            muted={true}
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
            overlayText={sanity <= 20 ? '⚠ SIGNAL UNSTABLE' : undefined}
          />
          
          {/* Terror overlay for low sanity */}
          {sanity <= 20 && (
            <div className="absolute inset-0 bg-red-900 bg-opacity-20 animate-pulse pointer-events-none"></div>
          )}
        </div>
        
        <div className="flex flex-col mb-2 sm:mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <MessageSquare size={14} className="retro-accent flex-shrink-0" />
            <div className="text-xs sm:text-sm retro-accent font-bold truncate">
              Encounter #{selectedNPC.id.split('_').slice(1).join('_').toUpperCase()}
            </div>
          </div>
          
          <div className="text-xs sm:text-sm retro-dim">
            {"No description available."}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          {isAnswered ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="retro-border p-3 sm:p-4 text-center bg-black animate-urgency-glow">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">✓</div>
                <div className="text-sm sm:text-base retro-accent mb-2 sm:mb-3">Already Answered</div>
                <div className="text-xs sm:text-sm retro-dim">You have already responded to this entity.</div>
              </div>
            </div>
          ) : hasQuestion ? (
            <div className="flex-1 flex flex-col min-h-0 justify-center items-center">
              <div className="retro-border p-3 sm:p-4 text-center bg-black animate-urgency-glow">
                <div className="text-xs sm:text-sm retro-dim">Question prompt temporarily unavailable.</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="retro-border p-3 sm:p-4 text-center bg-black animate-urgency-glow">
                <div className="text-xs sm:text-sm retro-dim">No questions available for this entity.</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Timer Display */}
        <div className="mt-2 sm:mt-3 flex-shrink-0">
          <div className="retro-border p-2 bg-black flex items-center justify-center gap-2 animate-urgency-glow">
            <Clock size={14} className={`${timeWarning ? 'text-red-400 animate-blink' : 'retro-accent'}`} />
            <span className={`text-xs ${timeWarning ? 'text-red-400 animate-blink' : 'retro-accent'}`}>
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // In cabin view
  return (
    <div className={`${getPanelAtmosphere()} flex flex-col p-2 sm:p-3 relative overflow-hidden ${getSanityVisualEffects()}`}>
      <div className={`absolute inset-0 bg-black bg-opacity-20 z-0 ${sanity <= 40 ? 'animate-subtle-flicker' : ''}`}></div>
      <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-shrink-0">
        <Heart size={20} className="retro-accent flex-shrink-0" />
        <h3 className="text-base sm:text-lg md:text-xl font-bold retro-text truncate">
          {String(mental.mentalState)}
        </h3>
      </div>
      
      <div className="retro-border p-2 sm:p-3 bg-black mb-3 sm:mb-4 flex-shrink-0 animate-mystery-pulse">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <AlertTriangle size={14} className="retro-accent flex-shrink-0" />
          <div className="text-xs sm:text-sm retro-accent font-bold truncate">
            Sanity Status
          </div>
        </div>
        
        <div className={`bg-gray-800 h-2 sm:h-3 border border-gray-600 relative overflow-hidden ${sanity <= 30 ? 'animate-urgency-glow' : ''} ${sanity <= 10 ? 'terror-glitch' : ''}`}>
          <div 
            className={`h-full transition-all duration-500 ${
              sanity > 100 
                ? 'sanity-bar-over-100' 
                : sanity <= 10 
                  ? 'bg-red-600 animate-blink terror-flicker' 
                  : sanity <= 20 
                    ? 'bg-red-500 animate-pulse' 
                    : sanity <= 40 
                      ? 'bg-orange-500'
                      : 'bg-green-400'
            }`}
            style={{ width: `${Math.min(sanity, 100)}%` }}
          />
          
          {/* Critical sanity warning overlay */}
          {sanity <= 10 && (
            <div className="absolute inset-0 bg-red-700 bg-opacity-30 animate-pulse pointer-events-none"></div>
          )}
        </div>
        
        <div className={`mt-1 text-center text-xs ${
          sanity <= 10 
            ? 'text-red-400 animate-pulse terror-flicker' 
            : sanity <= 20 
              ? 'text-red-300 animate-pulse' 
              : sanity <= 40 
                ? 'text-yellow-300' 
                : 'retro-dim'
        }`}>
          {sanity <= 20 ? '⚠️ CRITICAL ⚠️' : String(mental.coreStability)}: {sanity}%
          {sanity <= 20 && (
            <span className="block text-xs text-red-500 animate-blink">EMERGENCY PROTOCOLS ACTIVE</span>
          )}
          {sanity > 100 && (
            <span className="sanity-over-100 block">⚡ PSYCHOLOGICAL OVERCHARGE ⚡</span>
          )}
          {sanity > 20 && sanity <= 100 && (
            <span className="opacity-60"> | {String(mental.criticalThreshold)}: 20%</span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <Calendar size={14} className="retro-accent flex-shrink-0" />
          <div className="text-xs sm:text-sm retro-accent font-bold truncate">
            Progress
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <div className="retro-border p-1 sm:p-2 text-center bg-black">
            <div className="text-xs retro-dim">Day</div>
            <div className="text-sm font-bold retro-text">{gameState?.daysSurvived ?? 0}</div>
          </div>
          
          <div className="retro-border p-1 sm:p-2 text-center bg-black">
            <div className="text-xs retro-dim">Encounters</div>
            <div className="text-sm font-bold retro-text">{gameState?.answeredNPCs?.size ?? 0}</div>
          </div>
          
          <div className="retro-border p-1 sm:p-2 text-center bg-black">
            <div className="text-xs retro-dim">Correct</div>
            <div className="text-sm font-bold retro-text">{gameState?.stats?.correctAnswers ?? 0}</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-shrink-0">
          <Lightbulb size={14} className="retro-accent flex-shrink-0" />
          <div className="text-xs sm:text-sm retro-accent font-bold truncate">
            Boosters
          </div>
          <button 
            onClick={() => setShowBoosterStore(true)}
            className="retro-button px-2 py-1 text-xs hover:animate-hover-pulse"
          >
            <div className="flex items-center gap-1">
              <Search size={12} />
              Browse
            </div>
          </button>
        </div>
        
        {availableBoosters.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="retro-border p-3 sm:p-4 text-center bg-black animate-mystery-pulse">
              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">∅</div>
              <div className="text-xs sm:text-sm retro-dim mb-2 sm:mb-3">No Boosters Available</div>
              <button 
                onClick={() => setShowBoosterStore(true)}
                className="retro-button px-3 sm:px-4 py-2 text-sm hover:animate-hover-pulse"
              >
                Shop Boosters
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 overflow-y-auto min-h-0">
            {availableBoosters.map((booster) => (
              <BoosterBadge key={booster.id} itemId={booster.id}>
                <div className="retro-border h-full flex flex-col bg-black animate-mystery-pulse">
                  <div className="p-2 flex-1 flex flex-col">
                    <div className="text-sm font-bold retro-text mb-1 truncate">{booster.name}</div>
                    <div className="text-xs retro-dim mb-2 flex-1">{booster.description}</div>
                    
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="retro-accent">x{booster.count}</span>
                      {booster.cost > 0 && (
                        <span className="retro-dim">Cost: {booster.cost}</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onUseBooster(booster.id)}
                      disabled={!booster.canUse}
                      className={`retro-button text-xs py-1 ${
                        !booster.canUse ? 'opacity-50 cursor-not-allowed' : 'hover:animate-hover-pulse'
                      }`}
                    >
                      Use
                    </button>
                  </div>
                </div>
              </BoosterBadge>
            ))}
          </div>
        )}
      </div>
      
      {/* Booster Store Modal */}
      {showBoosterStore && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="retro-panel max-w-2xl w-full max-h-96 flex flex-col modal-container">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-pixel-accent bg-pixel-gray flex-shrink-0">
              <h3 className="text-lg sm:text-2xl font-bold retro-accent flex items-center gap-2 sm:gap-3">
                <Award size={24} className="flex-shrink-0" />
                Booster Store
              </h3>
              <button
                onClick={() => setShowBoosterStore(false)}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="text-center retro-dim">
                <p>Booster Store functionality is temporarily unavailable.</p>
                <button 
                  onClick={() => setShowBoosterStore(false)}
                  className="retro-button px-3 sm:px-4 py-2 text-sm hover:animate-hover-pulse mt-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
