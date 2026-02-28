/**
 * Booster Store Prompt Component
 * Shows when player doesn't own all booster packs
 */

import React from 'react';
import { Star, ExternalLink, Package } from 'lucide-react';
import { useBoosterPacks } from '../hooks/useBoosterPacks';

export const BoosterStorePrompt: React.FC = () => {
  const { hasAllBoosters, getUnownedCount, openBoosterStore } = useBoosterPacks();
  
  if (hasAllBoosters()) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        onClick={openBoosterStore}
        className="w-full retro-button p-3 relative overflow-hidden group hover:scale-105 transition-transform duration-200 booster-glow-animation"
        style={{
          background: 'linear-gradient(45deg, var(--theme-panel), var(--theme-accent))',
          borderColor: 'var(--theme-accent)'
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="relative z-10 flex items-center justify-center gap-3">
          <Package size={20} className="animate-bounce" />
          <div className="text-center">
            <div className="font-bold text-sm">BOOSTERS AVAILABLE</div>
            <div className="text-xs opacity-80">
              {getUnownedCount()} new content pack{getUnownedCount() !== 1 ? 's' : ''} available
            </div>
          </div>
          <ExternalLink size={16} className="opacity-60" />
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={8}
              className="absolute animate-ping text-yellow-400 opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
};