import { useEffect, useState } from 'react';

export const useSanity = (currentSanity: number) => {
  const [sanityLevel, setSanityLevel] = useState<'healthy' | 'concerned' | 'critical' | 'danger'>('healthy');

  useEffect(() => {
    if (currentSanity >= 80) {
      setSanityLevel('healthy');
    } else if (currentSanity >= 50) {
      setSanityLevel('concerned');
    } else if (currentSanity >= 20) {
      setSanityLevel('critical');
    } else {
      setSanityLevel('danger');
    }
  }, [currentSanity]);

  const getSanityColor = () => {
    switch (sanityLevel) {
      case 'healthy': return 'text-green-400';
      case 'concerned': return 'text-yellow-400';
      case 'critical': return 'text-orange-400';
      case 'danger': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getSanityMessage = () => {
    switch (sanityLevel) {
      case 'healthy': return 'Mind is clear and focused';
      case 'concerned': return 'Feeling slightly unsettled';
      case 'critical': return 'Struggling to maintain composure';
      case 'danger': return 'On the edge of madness';
      default: return '';
    }
  };

  return {
    sanityLevel,
    getSanityColor,
    getSanityMessage
  };
};