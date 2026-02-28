import React from 'react';
import { BookOpen, X, Brain, Users, MapPin, Home, Zap, Shield } from 'lucide-react';

interface HowToBookProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToBook: React.FC<HowToBookProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="retro-panel w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-pixel-accent bg-pixel-gray flex-shrink-0">
          <h3 className="text-xl sm:text-2xl font-bold retro-accent flex items-center gap-3">
            <BookOpen size={32} />
            SURVIVAL MANUAL
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6 sm:space-y-8 retro-text">
            <section>
              <h4 className="flex items-center gap-3 retro-accent font-bold mb-4 text-lg sm:text-xl">
                <Brain size={20} />
                SANITY CORE SYSTEM
              </h4>
              <div className="retro-border p-3 sm:p-4 bg-black space-y-2 text-sm">
                <div>• INITIAL SANITY: 100% (OPTIMAL FUNCTION)</div>
                <div>• LOCATION PENALTY: -5% PER NEW AREA VISITED</div>
                <div>• SPECIAL ITEMS: +15% SANITY (35% DISCOVERY CHANCE)</div>
                <div>• INCORRECT ENTITY RESPONSES: VARIABLE PENALTY BY LOCATION INDEX</div>
                <div>• CRITICAL FAILURE: SANITY REACHES 0% (SYSTEM RESET REQUIRED)</div>
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-3 retro-accent font-bold mb-4 text-lg sm:text-xl">
                <Users size={20} />
                ENTITY INTERACTION PROTOCOL
              </h4>
              <div className="retro-border p-3 sm:p-4 bg-black space-y-2 text-sm">
                <div>• EACH LOCATION: 1-2 ENTITIES WITH PHILOSOPHICAL QUERIES</div>
                <div>• CORRECT RESPONSES: ENTITY ARCHIVED IN DATABASE</div>
                <div>• INCORRECT RESPONSES: SANITY PENALTIES APPLIED</div>
                <div>• PENALTY SCALE: INDEX 1(-5%) → INDEX 2(-10%) → INDEX 3(-20%) → INDEX 4(-50%) → INDEX 5+(TOTAL WIPEOUT)</div>
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-3 retro-accent font-bold mb-4 text-lg sm:text-xl">
                <MapPin size={20} />
                NAVIGATION SYSTEM
              </h4>
              <div className="retro-border p-3 sm:p-4 bg-black space-y-2 text-sm">
                <div>• DOOR ACTIVATION: REVEALS 1-3 RANDOM DESTINATIONS</div>
                <div>• TRAVEL TO LOCATIONS: ENCOUNTER ENTITIES AND EXPLORE</div>
                <div>• RETURN TO BASE: COMPLETE DAY CYCLE AND INCREMENT SCORE</div>
                <div>• LOCATION POOL: DYNAMICALLY SCANNED FROM GAME FILES</div>
                <div>• POOL DEPLETION: ALL LOCATIONS VISITED = EXPLORATION COMPLETE</div>
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-3 retro-accent font-bold mb-4 text-lg sm:text-xl">
                <Home size={20} />
                CABIN SYSTEM CONTROLS
              </h4>
              <div className="retro-border p-3 sm:p-4 bg-black space-y-2 text-sm">
                <div>• DOOR: GENERATE TRAVEL OPTIONS</div>
                <div>• RADIO: TOGGLE BACKGROUND AUDIO SYSTEMS</div>
                <div>• ALBUM: VIEW ARCHIVED ENTITY DATABASE</div>
                <div>• MANUAL: ACCESS THIS SURVIVAL GUIDE</div>
                <div>• GOALS: VIEW ACHIEVEMENTS AND PROGRESS</div>
                <div>• REWARD: CLAIM DAILY BONUSES AND SPECIAL ITEMS</div>
                <div>• RESET: EMERGENCY PROTOCOL (DAY 0, 100% SANITY)</div>
                <div>• FUSE: ADJUST AUDIO AND VISUAL PARAMETERS</div>
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-3 retro-accent font-bold mb-4 text-lg sm:text-xl">
                <Zap size={20} />
                ADVANCED FEATURES
              </h4>
              <div className="retro-border p-3 sm:p-4 bg-black space-y-2 text-sm">
                <div>• LANGUAGE SUPPORT: 57+ LANGUAGES WITH AUTO-TRANSLATION</div>
                <div>• SAVE SYSTEM: MULTIPLE SAVE SLOTS WITH AUTO-SAVE</div>
                <div>• ACHIEVEMENTS: TRACK PROGRESS AND UNLOCK REWARDS</div>
                <div>• PERFORMANCE: AUTOMATIC OPTIMIZATION FOR ALL DEVICES</div>
                <div>• ACCESSIBILITY: HIGH CONTRAST AND REDUCED MOTION OPTIONS</div>
                <div>• DYNAMIC CONTENT: LOCATION POOL SCANNED EVERY GAME LOAD</div>
              </div>
            </section>

            <section className="retro-border border-red-500 p-3 sm:p-4 bg-red-900 bg-opacity-30">
              <h4 className="text-red-400 font-bold mb-3 text-lg sm:text-xl flex items-center gap-3">
                <Shield size={20} />
                CRITICAL SURVIVAL PROTOCOLS
              </h4>
              <div className="space-y-2 text-sm text-red-300">
                <div>• ANALYZE PHILOSOPHICAL QUERIES CAREFULLY BEFORE RESPONDING</div>
                <div>• HIGHER LOCATION INDICES POSE EXTREME SANITY RISKS</div>
                <div>• SPECIAL ITEMS CAN BOOST SANITY ABOVE 100% THRESHOLD</div>
                <div>• RETURN TO BASE FREQUENTLY TO PRESERVE PROGRESS</div>
                <div>• MONITOR SANITY CORE STATUS CONTINUOUSLY</div>
                <div>• USE LANGUAGE SELECTOR TO RETURN TO ENGLISH IF LOST</div>
                <div>• LOCATION COUNT UPDATES DYNAMICALLY - NO HARDCODED LIMITS</div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t-2 border-pixel-accent bg-pixel-gray flex-shrink-0">
          <div className="text-center retro-dim">
            <div className="text-sm">SURVIVAL MANUAL v2.0 - PRODUCTION EDITION</div>
            <div className="text-xs mt-1">REMEMBER: KNOWLEDGE IS SURVIVAL</div>
          </div>
        </div>
      </div>
    </div>
  );
};