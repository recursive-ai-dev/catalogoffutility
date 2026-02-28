/**
 * Booster Badge Component
 * Adds visual indicators for booster pack content
 */

import React from 'react';
import { Star, Sparkles } from 'lucide-react';
import { useBoosterPacks } from '../hooks/useBoosterPacks';

interface BoosterBadgeProps {
  children: React.ReactNode;
  itemId?: string;
  isBooster?: boolean;
  className?: string;
}

export const BoosterBadge: React.FC<BoosterBadgeProps> = ({
  children,
  itemId,
  isBooster = false,
  className = ''
}) => {
  const { isFromBoosterPack, getBoosterInfo } = useBoosterPacks();
  
  // Determine if this item is from a booster pack
  const isBoosterItem = isBooster || (itemId && isFromBoosterPack(itemId));
  const boosterInfo = itemId ? getBoosterInfo(itemId) : null;
  
  if (!isBoosterItem) {
    return <>{children}</>;
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'rare': return 'border-blue-400 shadow-blue-400/50';
      case 'epic': return 'border-purple-400 shadow-purple-400/50';
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/50';
      case 'mythic': return 'border-pink-400 shadow-pink-400/50';
      default: return 'border-green-400 shadow-green-400/50';
    }
  };

  const getRarityGlow = (rarity?: string) => {
    switch (rarity) {
      case 'rare': return 'shadow-blue-400/30';
      case 'epic': return 'shadow-purple-400/30';
      case 'legendary': return 'shadow-yellow-400/30';
      case 'mythic': return 'shadow-pink-400/30';
      default: return 'shadow-green-400/30';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Glowing border container */}
      <div className={`
        relative
        border-2
        ${getRarityColor(boosterInfo?.rarity)}
        ${getRarityGlow(boosterInfo?.rarity)}
        shadow-lg
        animate-pulse
        rounded-sm
        overflow-hidden
      `}>
        {/* Animated glow effect */}
        <div className={`
          absolute inset-0
          ${getRarityColor(boosterInfo?.rarity)}
          opacity-20
          animate-ping
        `} />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Booster indicator overlay */}
        <div className="absolute top-1 right-1 z-20">
          <div className={`
            flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs font-bold
            ${boosterInfo?.rarity === 'legendary' ? 'bg-yellow-400 text-black' :
              boosterInfo?.rarity === 'epic' ? 'bg-purple-400 text-white' :
              boosterInfo?.rarity === 'rare' ? 'bg-blue-400 text-white' :
              'bg-green-400 text-black'}
            shadow-lg
          `}>
            <Star size={8} className="animate-spin" />
            <span className="text-xs">BOOSTER</span>
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none z-15">
          {[...Array(3)].map((_, i) => (
            <Sparkles
              key={i}
              size={12}
              className={`
                absolute animate-ping text-white opacity-60
                ${i === 0 ? 'top-2 left-2' : i === 1 ? 'bottom-2 right-2' : 'top-1/2 left-1/2'}
              `}
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Tooltip on hover */}
      {boosterInfo && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
          <div className="bg-black border-2 border-gray-600 p-2 rounded text-xs whitespace-nowrap">
            <div className="text-white font-bold">{boosterInfo.name}</div>
            <div className="text-gray-400">{boosterInfo.description}</div>
            <div className={`text-xs font-bold ${
              boosterInfo.rarity === 'legendary' ? 'text-yellow-400' :
              boosterInfo.rarity === 'epic' ? 'text-purple-400' :
              boosterInfo.rarity === 'rare' ? 'text-blue-400' :
              'text-green-400'
            }`}>
              {boosterInfo.rarity.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};