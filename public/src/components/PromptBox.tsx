import React from 'react';
import { MessageCircle, HelpCircle, Zap, Package, ExternalLink, Star } from 'lucide-react';
import { Question, NPC } from '../types/game';
import { useTranslation } from '../hooks/useTranslation';
import { useBoosterPacks } from '../hooks/useBoosterPacks';

interface PromptBoxProps {
  selectedNPC: NPC | null;
  question: Question | null;
  onAnswer: (npcId: string, answer: 'A' | 'B') => void;
  answeredNPCs: Set<string>;
  isInCabin: boolean; // Add this prop
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  selectedNPC,
  question,
  onAnswer,
  answeredNPCs,
  isInCabin
}) => {
  const { communication, common } = useTranslation();
  const { hasAllBoosters, getUnownedCount, openBoosterStore } = useBoosterPacks();
  
  // We'll access sanity through the selectedNPC or other means if available
  // For now, we'll use a default approach - normally this would be passed as a prop
  const estimatedSanity = selectedNPC ? 50 : 100; // Placeholder - ideally passed as prop
  
  // Sanity-based visual effects
  const getSanityPromptEffects = () => {
    if (estimatedSanity <= 10) return 'terror-glitch sanity-critical';
    if (estimatedSanity <= 20) return 'terror-flicker sanity-critical';
    if (estimatedSanity <= 40) return 'sanity-warning';
    if (estimatedSanity <= 60) return 'unsettling-drift';
    return '';
  };
  
  const getPanelAtmosphere = () => {
    let classes = 'retro-panel h-full';
    if (estimatedSanity <= 30) classes += ' horror-atmosphere';
    return classes;
  };

  // Show BOOSTERS prompt when in cabin (instead of entity selection)
  if (isInCabin && !hasAllBoosters()) {
    return (
      <div className={`${getPanelAtmosphere()} flex items-center justify-center p-3`}>
        <button
          onClick={openBoosterStore}
          className="w-full retro-button p-4 relative overflow-hidden group hover:scale-105 transition-transform duration-200"
          style={{
            background: 'linear-gradient(45deg, var(--theme-panel), var(--theme-accent))',
            borderColor: 'var(--theme-accent)',
            borderWidth: '3px'
          }}
        >
          {/* Enhanced animated background with sanity effects */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ${
            estimatedSanity <= 30 ? 'animate-pulse' : ''
          }`} />
          
          <div className="relative z-10 flex items-center justify-center gap-3">
            <Package size={24} className={`animate-bounce ${estimatedSanity <= 20 ? 'terror-flicker' : ''}`} />
            <div className="text-center">
              <div className={`font-bold text-lg retro-accent ${
                estimatedSanity <= 20 ? 'terror-flicker' : ''
              }`}>
                {estimatedSanity <= 20 ? '⚠️ EMERGENCY SUPPLIES' : 'BOOSTERS AVAILABLE'}
              </div>
              <div className="text-sm opacity-80 retro-text">
                {getUnownedCount()} new content pack{getUnownedCount() !== 1 ? 's' : ''} available
                {estimatedSanity <= 20 && <div className="text-xs text-red-400 animate-pulse">REQUIRED FOR SURVIVAL</div>}
              </div>
              <div className="text-xs retro-dim mt-1 flex items-center justify-center gap-1">
                <ExternalLink size={12} />
                <span>{estimatedSanity <= 10 ? 'ACQUIRE NOW!' : 'Click to visit store'}</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced sparkle effects based on sanity */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(estimatedSanity <= 20 ? 12 : 8)].map((_, i) => (
              <Star
                key={i}
                size={estimatedSanity <= 20 ? 12 : 10}
                className={`absolute animate-ping ${estimatedSanity <= 20 ? 'text-red-400' : 'text-yellow-400'} opacity-60`}
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${25 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: estimatedSanity <= 20 ? '1s' : '2s'
                }}
              />
            ))}
          </div>
        </button>
      </div>
    );
  }

  // Show cabin operational message when in cabin and all boosters owned
  if (isInCabin) {
    return (
      <div className="retro-panel h-full flex items-center justify-center">
        <div className="retro-text text-center">
          <div className="text-3xl mb-2">🏠</div>
          <p className="text-sm">CABIN SYSTEMS OPERATIONAL</p>
          <div className="text-xs retro-dim mt-1 animate-blink">ALL BOOSTERS OWNED</div>
        </div>
      </div>
    );
  }

  // Original NPC interaction logic for when outside cabin
  if (!selectedNPC) {
    return (
      <div className="retro-panel h-full flex items-center justify-center">
        <div className="retro-dim text-center">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">{communication.selectEntityPrompt}</p>
          <div className="text-xs mt-1 animate-blink">{communication.awaitingSelection}</div>
        </div>
      </div>
    );
  }

  if (answeredNPCs.has(selectedNPC.id)) {
    return (
      <div className="retro-panel h-full flex items-center justify-center">
        <div className="retro-accent text-center">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-sm">{communication.contactEstablished} {selectedNPC.name.toUpperCase()}</p>
          <div className="text-xs retro-dim mt-1">{communication.entityArchived}</div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="retro-panel h-full flex items-center justify-center">
        <div className="retro-dim text-center">
          <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">{communication.noProtocol}</p>
          <div className="text-xs mt-1">{communication.entity}: {selectedNPC.name.toUpperCase()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getPanelAtmosphere()} p-3 flex flex-col ${getSanityPromptEffects()}`}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <MessageCircle size={16} className={`retro-accent animate-pulse ${
          estimatedSanity <= 20 ? 'terror-flicker' : ''
        }`} />
        <h3 className={`text-sm font-bold retro-text ${
          estimatedSanity <= 10 ? 'terror-glitch' : estimatedSanity <= 30 ? 'unsettling-drift' : ''
        }`}>
          {estimatedSanity <= 10 ? '💀 CORRUPTED SIGNAL' : 
           estimatedSanity <= 20 ? '⚠️ HOSTILE TRANSMISSION' : 
           communication.transmission} {selectedNPC.name.toUpperCase()}
        </h3>
      </div>
      
      <div className={`mb-3 p-2 retro-border bg-black flex-shrink-0 ${
        estimatedSanity <= 20 ? 'border-red-500' : ''
      }`}>
        <div className={`retro-accent text-xs mb-1 ${
          estimatedSanity <= 20 ? 'text-red-400 animate-pulse' : ''
        }`}>
          {estimatedSanity <= 10 ? '💀 FINAL MESSAGE:' : 
           estimatedSanity <= 20 ? '⚠️ THREAT COMMUNICATION:' : 
           communication.entityQuery}:
        </div>
        <p className={`retro-text text-xs leading-tight ${
          estimatedSanity <= 10 ? 'terror-glitch' : estimatedSanity <= 20 ? 'terror-flicker' : ''
        }`}>
          "{question.question}"
          {estimatedSanity <= 20 && (
            <span className="block text-red-500 text-xs mt-1 animate-pulse">
              {estimatedSanity <= 10 ? '[CHOOSE WISELY - NO SECOND CHANCES]' : '[DANGER: HOSTILE INTENT DETECTED]'}
            </span>
          )}
        </p>
      </div>
      
      <div className="space-y-2 flex-1 min-h-0">
        <button
          onClick={() => onAnswer(selectedNPC.id, 'A')}
          className={`retro-button w-full text-left py-2 px-3 ${
            estimatedSanity <= 10 ? 'border-red-600 text-red-400 terror-glitch' : 
            estimatedSanity <= 20 ? 'border-red-500 text-red-300 terror-flicker' : ''
          }`}
        >
          <div className="flex items-start gap-2">
            <span className={`font-bold retro-accent text-sm ${
              estimatedSanity <= 20 ? 'text-red-400' : ''
            }`}>
              A)
            </span>
            <span className="text-xs">
              {estimatedSanity <= 10 && '💀 '}
              {estimatedSanity <= 20 && estimatedSanity > 10 && '⚠️ '}
              {question.optionA}
              {estimatedSanity <= 10 && <span className="text-red-600 ml-1">[FATAL?]</span>}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => onAnswer(selectedNPC.id, 'B')}
          className={`retro-button w-full text-left py-2 px-3 ${
            estimatedSanity <= 10 ? 'border-red-600 text-red-400 terror-glitch' : 
            estimatedSanity <= 20 ? 'border-red-500 text-red-300 terror-flicker' : ''
          }`}
        >
          <div className="flex items-start gap-2">
            <span className={`font-bold retro-accent text-sm ${
              estimatedSanity <= 20 ? 'text-red-400' : ''
            }`}>
              B)
            </span>
            <span className="text-xs">
              {estimatedSanity <= 10 && '💀 '}
              {estimatedSanity <= 20 && estimatedSanity > 10 && '⚠️ '}
              {question.optionB}
              {estimatedSanity <= 10 && <span className="text-red-600 ml-1">[FATAL?]</span>}
            </span>
          </div>
        </button>
      </div>
      
      <div className={`mt-2 p-2 retro-border retro-dim text-xs flex-shrink-0 ${
        estimatedSanity <= 20 ? 'border-red-500 bg-red-900 bg-opacity-20' : ''
      }`}>
        <div className="flex items-center gap-1">
          <Zap size={12} className={`text-yellow-400 ${
            estimatedSanity <= 20 ? 'animate-pulse text-red-400' : ''
          }`} />
          <span className={estimatedSanity <= 20 ? 'text-red-400 font-bold' : ''}>
            {estimatedSanity <= 10 ? '💀 CRITICAL: WRONG CHOICE = PERMANENT DAMAGE' : 
             estimatedSanity <= 20 ? '⚠️ WARNING: HIGH RISK OF PSYCHOLOGICAL TRAUMA' : 
             communication.warning}
          </span>
        </div>
        
        {estimatedSanity <= 10 && (
          <div className="text-red-500 text-xs mt-1 animate-blink">
            💀 SANITY CRITICALLY LOW - REALITY BREAKDOWN IMMINENT
          </div>
        )}
      </div>
    </div>
  );
};