import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  DoorOpen, 
  Radio, 
  BookOpen, 
  Image, 
  Zap, 
  Skull,
  Volume2,
  VolumeX,
  Settings,
  Trophy,
  Gift,
  X,
  Clock,
  Star
} from 'lucide-react';
import { NPC, Achievement } from '../types/game';
import { AchievementService } from '../services/achievementService';
import { rewardsService, Reward } from '../services/rewardsService';
import { useTranslation } from '../hooks/useTranslation';
import { BoosterBadge } from './BoosterBadge';
import { GameEngine } from '../core/GameEngine';

interface LeftPanelProps {
  npcs: NPC[];
  selectedNPC: NPC | null;
  onSelectNPC: (npc: NPC) => void;
  answeredNPCs: Set<string>;
  isInCabin: boolean;
  onOpenDoor: () => void;
  onToggleRadio: () => void;
  onViewPhotoAlbum: () => void;
  onViewBook: () => void;
  onUseShotgun: () => void;
  onOpenFuseBox: () => void;
  radioEnabled: boolean;
  gameState: any; // Full game state for achievements and rewards
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  npcs,
  selectedNPC,
  onSelectNPC,
  answeredNPCs,
  isInCabin,
  onOpenDoor,
  onToggleRadio,
  onViewPhotoAlbum,
  onViewBook,
  onUseShotgun,
  onOpenFuseBox,
  radioEnabled,
  gameState
}) => {
  const { entities, cabin, common } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [dailyBonus, setDailyBonus] = useState<{ available: boolean; timeUntilNext?: number }>({ available: false });
  const [isUpdatingRewards, setIsUpdatingRewards] = useState(false);

  // Memoize achievement service instance
  const achievementService = useMemo(() => {
    const engine = GameEngine.getInstance();
    return AchievementService.getInstance(engine);
  }, []);

  // Helper function to get achievement icons (defined before useMemo that uses it)
  function getAchievementIcon(category: string): string {
    switch (category) {
      case 'survival': return '🏆';
      case 'exploration': return '🗺️';
      case 'interaction': return '💬';
      case 'puzzle': return '🧩';
      case 'collection': return '📦';
      case 'event': return '⭐';
      default: return '🎯';
    }
  }

  // Get achievements with progress from the enhanced service
  const transformedAchievements = useMemo(() => {
    const achievementsWithProgress = achievementService.getAllAchievementsWithProgress();
    const unlockedAchievements = achievementService.getUnlockedAchievements();
    
    return achievementsWithProgress.map(def => {
      const isUnlocked = unlockedAchievements.has(def.id);
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: getAchievementIcon(def.category),
        rarity: def.rarity,
        category: def.category,
        unlockedAt: isUnlocked ? new Date().toISOString() : '',
        progress: def.progress,
        maxProgress: def.maxProgress,
        hidden: false,
        rewards: []
      } as Achievement;
    });
  }, [achievementService, gameState]);

  // Load rewards and daily bonus data
  useEffect(() => {
    const loadRewards = async () => {
      try {
        await rewardsService.updateRewardAvailability(gameState);
        const rewardData = rewardsService.getAllRewards();
        setRewards(rewardData);

        const dailyBonusInfo = rewardsService.getNextDailyBonus();
        setDailyBonus(dailyBonusInfo);
      } catch (error) {
        console.error('Error loading rewards:', error);
      }
    };

    loadRewards();
  }, [gameState]);

  // Update achievements when game state changes
  useEffect(() => {
    setAchievements(transformedAchievements);
  }, [transformedAchievements]);

  const handleShotgunClick = () => {
    setShowWarning(true);
  };

  const confirmReset = () => {
    onUseShotgun();
    setShowWarning(false);
  };

  const cancelReset = () => {
    setShowWarning(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      case 'mythic': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const claimReward = async (rewardId: string) => {
    if (isUpdatingRewards) return;
    
    setIsUpdatingRewards(true);
    try {
      const result = await rewardsService.claimReward(rewardId, gameState);
      if (result.success) {
        // Apply state changes to the game engine if any
        // Note: State updates are now handled automatically through the command system
        // The reward service will execute the appropriate commands to update game state
        
        // Show success message with enhanced notification
        if (result.message) {
          showNotification(result.message, 'success');
        }
        
        // Refresh rewards
        await rewardsService.updateRewardAvailability(gameState);
        const updatedRewards = rewardsService.getAllRewards();
        setRewards(updatedRewards);
        
        const updatedDailyBonus = rewardsService.getNextDailyBonus();
        setDailyBonus(updatedDailyBonus);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showNotification('Failed to claim reward. Please try again.', 'error');
    } finally {
      setIsUpdatingRewards(false);
    }
  };
  
  // Enhanced notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md z-50 animate-bounce-in shadow-lg border border-white border-opacity-20`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add a fade-out animation
    setTimeout(() => {
      notification.style.transition = 'opacity 0.5s ease-out';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  };

  const formatTimeUntilNext = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getAvailableRewardsCount = () => {
    return rewards.filter(r => r.available).length;
  };

  // Sanity-based visual effects for the left panel
  const getSanityPanelEffects = () => {
    if (gameState.sanity <= 10) return 'terror-glitch sanity-critical';
    if (gameState.sanity <= 20) return 'terror-flicker sanity-critical';
    if (gameState.sanity <= 40) return 'sanity-warning';
    if (gameState.sanity <= 60) return 'unsettling-drift';
    return '';
  };
  
  const getPanelAtmosphere = () => {
    let classes = 'retro-panel h-full flex flex-col p-2 sm:p-3 md:p-4 relative overflow-hidden';
    if (gameState.sanity <= 30) classes += ' horror-atmosphere';
    return classes;
  };

  return (
    <div className={`${getPanelAtmosphere()} ${getSanityPanelEffects()}`}>
      <div className={`absolute inset-0 bg-black bg-opacity-30 z-0 ${gameState.sanity <= 40 ? 'animate-subtle-flicker' : ''}`}></div>
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Users size={20} className="retro-accent flex-shrink-0" />
        <h3 className="text-base sm:text-lg md:text-xl font-bold retro-text truncate">
          {String(entities.title)}
        </h3>
      </div>
      
      <div className="flex-1 space-y-2 sm:space-y-3 min-h-0 overflow-y-auto">
        {/* Show cabin systems when in cabin */}
        {isInCabin ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="retro-border p-2 sm:p-3 bg-black">
              <div className="retro-accent text-xs sm:text-sm font-bold mb-2 sm:mb-3">
                {String(cabin.systems)}
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <button
                  onClick={onOpenDoor}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <DoorOpen size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.door)}</span>
                </button>
                
                <button
                  onClick={onToggleRadio}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  } ${
                    radioEnabled ? 'retro-accent border-4' : ''
                  }`}
                >
                  {radioEnabled ? <Volume2 size={12} className="flex-shrink-0" /> : <VolumeX size={12} className="flex-shrink-0" />}
                  <span className="text-xs leading-tight">{String(cabin.radio)}</span>
                </button>
                
                <button
                  onClick={onViewPhotoAlbum}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <Image size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.album)}</span>
                </button>
                
                <button
                  onClick={onViewBook}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <BookOpen size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.manual)}</span>
                </button>
                
                <button
                  onClick={() => setShowAchievements(true)}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs relative hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <Trophy size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.goals)}</span>
                  {achievements.filter(a => a.unlockedAt).length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs text-black font-bold">
                        {achievements.filter(a => a.unlockedAt).length}
                      </span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => setShowRewards(true)}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs relative hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <Gift size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.reward)}</span>
                  {getAvailableRewardsCount() > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs text-black font-bold">
                        {getAvailableRewardsCount()}
                      </span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleShotgunClick}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs border-red-500 text-red-400 hover:bg-red-500 hover:text-black hover:animate-hover-pulse ${
                    gameState.sanity <= 20 ? 'animate-pulse terror-flicker' : gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  }`}
                >
                  <Skull size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">{String(cabin.reset)}</span>
                </button>
                
                <button
                  onClick={onOpenFuseBox}
                  className={`retro-button py-1 sm:py-1.5 flex flex-col items-center gap-1 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    gameState.sanity <= 30 ? 'animate-occasional-flicker' : ''
                  } ${
                    gameState.sanity <= 10 ? 'terror-flicker' : ''
                  }`}
                >
                  <Settings size={12} className="flex-shrink-0" />
                  <span className="text-xs leading-tight">Fuse Box</span>
                </button>
              </div>
            </div>

            {/* Daily Bonus Indicator */}
            {dailyBonus.available && (
              <div className="retro-border p-2 bg-green-900 bg-opacity-50 border-green-400">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={14} className="text-green-400" />
                  <span className="text-xs text-green-400 font-bold">DAILY BONUS READY!</span>
                </div>
                <div className="text-xs retro-dim">
                  Check rewards to claim your daily sanity boost
                </div>
              </div>
            )}

            {/* Next Daily Bonus Timer */}
            {!dailyBonus.available && dailyBonus.timeUntilNext && (
              <div className="retro-border p-2 bg-black">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="retro-dim" />
                  <span className="text-xs retro-dim">Next Daily Bonus:</span>
                </div>
                <div className="text-xs retro-accent">
                  {formatTimeUntilNext(dailyBonus.timeUntilNext)}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Show NPCs when not in cabin */
          npcs.length === 0 ? (
            <div className="retro-dim text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">∅</div>
              <div className="text-sm sm:text-lg">{String(entities.noEntities)}</div>
              <div className="text-xs sm:text-sm mt-1 sm:mt-2">{String(entities.scanning)}</div>
            </div>
          ) : (
            npcs.map((npc) => (
              <BoosterBadge key={npc.id} itemId={npc.id}>
                <button
                  onClick={() => onSelectNPC(npc)}
                  className={`retro-button w-full p-2 sm:p-3 md:p-4 text-left transition-all duration-200 hover:animate-hover-pulse ${
                    selectedNPC?.id === npc.id
                      ? 'retro-accent border-4'
                      : 'hover:bg-pixel-gray'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base md:text-lg font-bold retro-text truncate">
                        {npc.name.toUpperCase()}
                      </div>
                      <div className="text-xs sm:text-sm retro-dim truncate">
                        ID: {npc.id.split('_').slice(1).join('_').toUpperCase()}
                      </div>
                    </div>
                    {answeredNPCs.has(npc.id) && (
                      <div className="retro-accent text-sm sm:text-lg flex-shrink-0 ml-2">✓</div>
                    )}
                  </div>
                </button>
              </BoosterBadge>
            ))
          )
        )}
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="retro-panel max-w-2xl w-full max-h-96 flex flex-col modal-container">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-pixel-accent bg-pixel-gray flex-shrink-0">
              <h3 className="text-lg sm:text-2xl font-bold retro-accent flex items-center gap-2 sm:gap-3">
                <Trophy size={24} className="flex-shrink-0" />
                ACHIEVEMENTS ({achievements.filter(a => a.unlockedAt).length}/{achievements.length})
              </h3>
              <button
                onClick={() => setShowAchievements(false)}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`retro-border p-3 sm:p-4 bg-black ${
                      achievement.unlockedAt ? 'retro-accent border-4' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-2xl sm:text-3xl flex-shrink-0">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <h4 className="text-sm sm:text-lg font-bold retro-text truncate">{achievement.name}</h4>
                          <span className={`text-xs ${getRarityColor(achievement.rarity)} uppercase`}>
                            {achievement.rarity}
                          </span>
                          {achievement.unlockedAt && (
                            <span className="text-xs retro-accent">✓ UNLOCKED</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm retro-dim mb-2">{achievement.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="bg-gray-800 h-2 border border-gray-600 relative overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                achievement.unlockedAt ? 'bg-green-400' : 'bg-blue-400'
                              }`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs retro-dim mt-1">
                            {achievement.progress} / {achievement.maxProgress}
                          </div>
                        </div>
                        
                        {achievement.unlockedAt && (
                          <div className="text-xs retro-accent">
                            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal with Smooth Scrolling */}
      {showRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="retro-panel max-w-xl w-full max-h-96 flex flex-col modal-container">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-pixel-accent bg-pixel-gray flex-shrink-0">
              <h3 className="text-lg sm:text-2xl font-bold retro-accent flex items-center gap-2 sm:gap-3">
                <Gift size={24} className="flex-shrink-0" />
                REWARDS ({getAvailableRewardsCount()} Available)
              </h3>
              <button
                onClick={() => setShowRewards(false)}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Smooth Scrolling Container */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              style={{
                scrollBehavior: 'smooth'
              }}
            >
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id}
                    className={`retro-border bg-black relative transition-all duration-200 hover:border-opacity-80 ${
                      !reward.available ? 'opacity-50' : ''
                    }`}
                    style={{
                      minHeight: '100px'
                    }}
                  >
                    {/* Reward Content - Protected from button overlay */}
                    <div className="p-3 sm:p-4 pr-20">
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm sm:text-lg font-bold retro-text">{reward.name}</h4>
                          {reward.type === 'daily_bonus' && (
                            <span className="text-xs retro-accent">[DAILY]</span>
                          )}
                        </div>
                        
                        {/* Updated daily bonus description */}
                        <p className="text-xs sm:text-sm retro-dim mb-3 leading-relaxed">
                          {reward.id === 'daily_sanity_boost' 
                            ? 'Login for 3 days and gain a free Winter Forest Booster Pack!'
                            : reward.description
                          }
                        </p>
                        
                        {reward.requirements && (
                          <div className="text-xs retro-dim mb-2">
                            Requirements: {Object.entries(reward.requirements).map(([key, value]) => 
                              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                            ).join(', ')}
                          </div>
                        )}
                        
                        {reward.lastClaimed && reward.cooldown && (
                          <div className="text-xs retro-dim">
                            Last claimed: {new Date(reward.lastClaimed).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button - Positioned absolutely to not affect text layout */}
                    <button
                      disabled={!reward.available || isUpdatingRewards}
                      onClick={() => claimReward(reward.id)}
                      className={`absolute top-3 right-3 retro-button px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all duration-200 ${
                        !reward.available || isUpdatingRewards ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                      style={{
                        minWidth: '70px',
                        height: 'fit-content'
                      }}
                    >
                      {isUpdatingRewards ? 'CLAIMING...' : reward.available ? 'CLAIM' : 'LOCKED'}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 retro-border p-3 sm:p-4 bg-black retro-dim text-center">
                <div className="text-xs sm:text-sm">
                  Complete achievements and survive longer to unlock more rewards
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shotgun Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="retro-panel max-w-md w-full p-4 sm:p-6 modal-container">
            <div className="text-center">
              <Skull size={48} className="retro-accent mx-auto mb-4 sm:mb-6 animate-flicker" />
              <h3 className="text-lg sm:text-2xl font-bold retro-accent mb-4 sm:mb-6">
                CRITICAL WARNING
              </h3>
              <div className="retro-text text-sm sm:text-lg mb-6 sm:mb-8 space-y-2">
                <p>EMERGENCY RESET PROTOCOL INITIATED</p>
                <p>THIS WILL RESTORE SANITY CORE TO 100%</p>
                <p>ALL PROGRESS WILL BE LOST</p>
                <p className="retro-accent">CONFIRM SYSTEM RESET?</p>
              </div>
              
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={cancelReset}
                  className="retro-button flex-1 py-2 sm:py-3 text-sm sm:text-base"
                >
                  {String(common.cancel)}
                </button>
                <button
                  onClick={confirmReset}
                  className="retro-button flex-1 py-2 sm:py-3 text-sm sm:text-base bg-red-600 border-red-400 hover:bg-red-500"
                >
                  {String(common.confirm)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
