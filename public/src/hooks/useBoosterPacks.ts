/**
 * Booster Pack Management Hook
 * Handles detection, loading, and management of booster packs
 */

import { useState, useEffect } from 'react';
import { BoosterPack } from '../types/game';

interface BoosterPackStatus {
  id: string;
  name: string;
  owned: boolean;
  available: boolean;
  description: string;
  rarity: string;
}

export const useBoosterPacks = () => {
  const [ownedBoosters, setOwnedBoosters] = useState<string[]>([]);
  const [availableBoosters, setAvailableBoosters] = useState<BoosterPackStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Known booster packs that can be purchased
  const knownBoosters: BoosterPackStatus[] = [
    {
      id: 'booster_winter_forest',
      name: 'Winter Forest Pack',
      owned: false,
      available: true,
      description: 'Mystical winter locations with ice-themed characters',
      rarity: 'rare'
    },
    {
      id: 'booster_shadow_realm',
      name: 'Shadow Realm Pack',
      owned: false,
      available: true,
      description: 'Dark dimensions with mysterious entities',
      rarity: 'epic'
    },
    {
      id: 'booster_crystal_caves',
      name: 'Crystal Caves Pack',
      owned: false,
      available: true,
      description: 'Underground crystal formations with ancient guardians',
      rarity: 'rare'
    },
    {
      id: 'booster_floating_islands',
      name: 'Floating Islands Pack',
      owned: false,
      available: true,
      description: 'Sky-bound locations with aerial creatures',
      rarity: 'legendary'
    }
  ];

  // Check for owned booster packs
  const checkOwnedBoosters = async () => {
    const owned: string[] = [];
    
    for (const booster of knownBoosters) {
      try {
        // Check if booster file exists in public/boosters/
        const response = await fetch(`/boosters/${booster.id}.json`, { method: 'HEAD' });
        if (response.ok) {
          owned.push(booster.id);
        }
      } catch (error) {
        // Booster not owned
      }
    }
    
    setOwnedBoosters(owned);
    
    // Update available boosters with ownership status
    const updatedBoosters = knownBoosters.map(booster => ({
      ...booster,
      owned: owned.includes(booster.id)
    }));
    
    setAvailableBoosters(updatedBoosters);
    setIsLoading(false);
  };

  // Check if an item is from a booster pack
  const isFromBoosterPack = (itemId: string): boolean => {
    // Check if the item ID contains any owned booster pack identifiers
    return ownedBoosters.some(boosterId => 
      itemId.includes(boosterId.replace('booster_', '')) ||
      itemId.startsWith(boosterId.replace('booster_', ''))
    );
  };

  // Get booster pack info for an item
  const getBoosterInfo = (itemId: string): BoosterPackStatus | null => {
    for (const booster of availableBoosters) {
      const boosterKey = booster.id.replace('booster_', '');
      if (itemId.includes(boosterKey) || itemId.startsWith(boosterKey)) {
        return booster;
      }
    }
    return null;
  };

  // Check if all boosters are owned
  const hasAllBoosters = (): boolean => {
    return ownedBoosters.length >= knownBoosters.length;
  };

  // Get unowned boosters count
  const getUnownedCount = (): number => {
    return knownBoosters.length - ownedBoosters.length;
  };

  // Open booster store
  const openBoosterStore = () => {
    window.open('https://birchstag-studios.itch.io/imagine-being-trapped-2/files', '_blank');
  };

  useEffect(() => {
    checkOwnedBoosters();
    
    // Check periodically for new boosters (in case user purchases during gameplay)
    const interval = setInterval(checkOwnedBoosters, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    ownedBoosters,
    availableBoosters,
    isLoading,
    isFromBoosterPack,
    getBoosterInfo,
    hasAllBoosters,
    getUnownedCount,
    openBoosterStore,
    refreshBoosters: checkOwnedBoosters
  };
};