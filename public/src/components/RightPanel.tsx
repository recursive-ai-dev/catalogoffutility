import React from 'react';
import { MapPin, Backpack, Book, DoorOpen } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface RightPanelProps {
  location: string;
  inventory: any[];
  onSelectLocation: (locationId: string) => void;
  onViewMap: () => void;
  onViewInventory: () => void;
  onViewJournal: () => void;
  sanity: number;
  gameState: any;
  isInCabin: boolean;
  availableLocations: string[];
  locationNames: Record<string, string>;
  onTravel: (locationId: string) => void;
  onOpenDoor: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  location,
  inventory,
  onSelectLocation,
  onViewMap,
  onViewInventory,
  onViewJournal,
  sanity,
  gameState,
  isInCabin,
  availableLocations,
  locationNames,
  onTravel,
  onOpenDoor
}) => {
  const { t } = useTranslation();
  
  // Sanity-based visual effects for the right panel
  const getSanityPanelEffects = () => {
    if (sanity <= 10) return 'terror-glitch sanity-critical';
    if (sanity <= 20) return 'terror-flicker sanity-critical';
    if (sanity <= 40) return 'sanity-warning';
    if (sanity <= 60) return 'unsettling-drift';
    return '';
  };
  
  const getPanelAtmosphere = () => {
    let classes = 'retro-panel h-full flex flex-col p-2 sm:p-3 relative overflow-hidden';
    if (sanity <= 30) classes += ' horror-atmosphere';
    return classes;
  };
  
  // Dynamic location name display based on sanity
  const getLocationDisplayName = (loc: string) => {
    const baseName = locationNames[loc] || loc;
    if (sanity <= 10) {
      // Very low sanity - corrupted text
      return baseName.split('').map(char => 
        Math.random() < 0.3 ? ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)] : char
      ).join('');
    } else if (sanity <= 20) {
      // Low sanity - add ominous prefixes
      const ominousPrefixes = ['CURSED ', 'HAUNTED ', 'FORBIDDEN ', 'LOST '];
      const prefix = ominousPrefixes[Math.floor(Math.random() * ominousPrefixes.length)];
      return prefix + baseName;
    } else if (sanity <= 40) {
      // Medium-low sanity - add uncertainty
      return baseName + '?';
    }
    return baseName;
  };

  return (
    <div className={`${getPanelAtmosphere()} ${getSanityPanelEffects()}`}>
      <div className={`absolute inset-0 bg-black bg-opacity-30 z-0 ${sanity <= 40 ? 'animate-subtle-flicker' : ''}`}></div>
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <MapPin size={20} className={`retro-accent flex-shrink-0 ${sanity <= 20 ? 'animate-pulse terror-flicker' : ''}`} />
        <h3 className={`text-base sm:text-lg md:text-xl font-bold retro-text truncate ${
          sanity <= 10 ? 'terror-glitch' : sanity <= 30 ? 'unsettling-drift' : ''
        }`}>
          {sanity <= 20 ? '⚠️ ESCAPE ROUTES' : String(t('locations.title', 'Locations'))}
        </h3>
      </div>
      
      <div className="flex-1 space-y-2 sm:space-y-3 min-h-0 overflow-y-auto">
        {isInCabin ? (
          <div className={`retro-border p-2 sm:p-3 bg-black ${
            sanity <= 30 ? 'animate-mystery-pulse' : ''
          } ${
            sanity <= 10 ? 'border-red-500' : ''
          }`}>
            <div className={`retro-accent text-xs sm:text-sm font-bold mb-2 sm:mb-3 ${
              sanity <= 20 ? 'text-red-400 animate-pulse' : ''
            }`}>
              {sanity <= 20 ? '🏠 SANCTUARY STATUS' : String(t('cabin.status', 'Cabin Status'))}
            </div>
            <div className={`text-xs sm:text-sm mb-3 sm:mb-4 ${
              sanity <= 20 ? 'text-red-300' : 'retro-dim'
            }`}>
              <div className={`mb-1 ${
                sanity <= 20 ? 'animate-pulse' : ''
              }`}>
                {sanity <= 10 ? '💀 SANITY CRITICAL' : String(t('cabin.sanity', 'Sanity'))}: 
                <span className={sanity <= 20 ? 'text-red-400 font-bold' : ''}>{sanity}%</span>
              </div>
              <div className="mb-1">
                {String(t('cabin.day', 'Day'))}: {gameState.daysSurvived}
                {sanity <= 20 && <span className="text-red-400 ml-1">⏰ TIME RUNNING OUT</span>}
              </div>
              <div>
                {String(t('cabin.location', 'Location'))}: 
                <span className={sanity <= 30 ? 'text-yellow-300' : ''}>
                  {sanity <= 10 ? '🏠 LAST REFUGE' : locationNames[location] || location}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenDoor}
              className={`retro-button w-full py-1 sm:py-1.5 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                sanity <= 20 ? 'border-red-500 text-red-400 animate-pulse terror-flicker' : 
                sanity <= 30 ? 'animate-occasional-flicker' : ''
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <DoorOpen size={12} className="flex-shrink-0" />
                {sanity <= 10 ? '⚠️ ENTER THE VOID' : 
                 sanity <= 20 ? '🚪 FACE THE DARKNESS' : 
                 String(t('cabin.leave', 'Leave Cabin'))}
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className={`retro-border p-2 sm:p-3 bg-black ${
              sanity <= 30 ? 'animate-mystery-pulse' : ''
            } ${
              sanity <= 10 ? 'border-red-500 terror-glitch' : ''
            }`}>
              <div className={`retro-accent text-xs sm:text-sm font-bold mb-2 sm:mb-3 ${
                sanity <= 20 ? 'text-red-400 animate-pulse' : ''
              }`}>
                {sanity <= 10 ? '💀 TRAPPED IN' : 
                 sanity <= 20 ? '⚠️ CURRENT NIGHTMARE' : 
                 String(t('locations.current', 'Current Location'))}
              </div>
              <div className={`text-sm sm:text-base font-bold mb-3 sm:mb-4 retro-text ${
                sanity <= 10 ? 'terror-glitch text-red-400' : 
                sanity <= 20 ? 'terror-flicker text-red-300' : 
                sanity <= 40 ? 'unsettling-drift' : ''
              }`}>
                {getLocationDisplayName(location)}
                {sanity <= 20 && <div className="text-xs text-red-500 animate-blink">NO ESCAPE VISIBLE</div>}
              </div>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <button
                  onClick={onViewMap}
                  className={`retro-button py-1 sm:py-1.5 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    sanity <= 20 ? 'border-red-500 text-red-400 terror-flicker' : 
                    sanity <= 30 ? 'animate-occasional-flicker' : ''
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <MapPin size={12} className="flex-shrink-0" />
                    {sanity <= 10 ? '🗺️ ???' : String(t('locations.map', 'Map'))}
                  </span>
                </button>
                <button
                  onClick={onViewInventory}
                  className={`retro-button py-1 sm:py-1.5 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    sanity <= 20 ? 'border-red-500 text-red-400 terror-flicker' : 
                    sanity <= 30 ? 'animate-occasional-flicker' : ''
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Backpack size={12} className="flex-shrink-0" />
                    {sanity <= 10 ? '🎒 BURDEN' : String(t('locations.inventory', 'Inventory'))} ({inventory.length})
                  </span>
                </button>
                <button
                  onClick={onViewJournal}
                  className={`retro-button py-1 sm:py-1.5 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    sanity <= 20 ? 'border-red-500 text-red-400 terror-flicker' : 
                    sanity <= 30 ? 'animate-occasional-flicker' : ''
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Book size={12} className="flex-shrink-0" />
                    {sanity <= 10 ? '📖 MADNESS' : String(t('locations.journal', 'Journal'))}
                  </span>
                </button>
                <button
                  onClick={onOpenDoor}
                  className={`retro-button py-1 sm:py-1.5 text-xs hover:animate-hover-pulse hover:bg-pixel-gray ${
                    sanity <= 10 ? 'border-green-500 text-green-400 animate-pulse' : 
                    sanity <= 20 ? 'border-yellow-500 text-yellow-400 terror-flicker' : 
                    sanity <= 30 ? 'animate-occasional-flicker' : ''
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <DoorOpen size={12} className="flex-shrink-0" />
                    {sanity <= 10 ? '🏠 SANCTUARY!' : 
                     sanity <= 20 ? '🚪 RETREAT' : 
                     String(t('common.back', 'Back'))}
                  </span>
                </button>
              </div>
            </div>
            <div className={`retro-border p-2 sm:p-3 bg-black ${
              sanity <= 30 ? 'animate-urgency-glow' : ''
            } ${
              sanity <= 10 ? 'border-red-600 terror-glitch' : ''
            }`}>
              <div className={`retro-accent text-xs sm:text-sm font-bold mb-2 sm:mb-3 ${
                sanity <= 20 ? 'text-red-400 animate-pulse' : ''
              }`}>
                {sanity <= 10 ? '💀 PATHS TO DOOM' : 
                 sanity <= 20 ? '⚠️ DANGEROUS ROUTES' : 
                 String(t('locations.available', 'Available Locations'))}
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                {availableLocations.length === 0 ? (
                  <div className={`text-xs sm:text-sm ${
                    sanity <= 20 ? 'text-red-400 animate-pulse' : 'retro-dim'
                  }`}>
                    {sanity <= 10 ? '💀 ALL PATHS BLOCKED' : 
                     sanity <= 20 ? '⚠️ NO SAFE PASSAGE' : 
                     String(t('locations.none', 'None available'))}
                  </div>
                ) : (
                  availableLocations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        onSelectLocation(loc);
                        onTravel(loc);
                      }}
                      className={`retro-button w-full py-1 text-xs text-left truncate hover:animate-hover-pulse hover:bg-pixel-gray ${
                        sanity <= 10 ? 'border-red-600 text-red-400 terror-glitch' : 
                        sanity <= 20 ? 'border-red-500 text-red-300 terror-flicker' : 
                        sanity <= 40 ? 'border-yellow-500 text-yellow-300' : ''
                      }`}
                    >
                      {sanity <= 10 && '💀 '}
                      {sanity <= 20 && sanity > 10 && '⚠️ '}
                      {getLocationDisplayName(loc)}
                      {sanity <= 10 && <span className="text-xs text-red-600 ml-1">[CURSED]</span>}
                      {sanity <= 20 && sanity > 10 && <span className="text-xs text-red-500 ml-1">[RISKY]</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
