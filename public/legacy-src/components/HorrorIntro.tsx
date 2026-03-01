import React, { useState, useEffect, useCallback } from 'react';

/**
 * HorrorIntro - A horror movie-style intro that simulates a system error
 * Flickers, glitches, and transitions into a fake "critical error" screen
 * Clearly marked as part of the game experience
 */

interface HorrorIntroProps {
  onComplete: () => void;
}

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?~`§¶†‡•ªº–≠≈ç√∫µ≤≥÷';

const TERROR_MESSAGES = [
  'INITIALIZING...',
  'LOADING NEURAL INTERFACE...',
  'CALIBRATING SANITY SENSORS...',
  'CONNECTING TO THE OTHER SIDE...',
  'WARNING: ANOMALY DETECTED',
  'SYSTEM COMPROMISED',
  'REALITY ANCHOR: FAILING',
  'THEY ARE WATCHING',
];

export const HorrorIntro: React.FC<HorrorIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'boot' | 'glitch' | 'error' | 'recovery'>('boot');
  const [bootText, setBootText] = useState('');
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [showPressKey, setShowPressKey] = useState(false);
  const [corruptedLines, setCorruptedLines] = useState<string[]>([]);

  // Generate random corrupted text
  const corruptText = useCallback((text: string, intensity: number): string => {
    return text
      .split('')
      .map((char) => {
        if (Math.random() < intensity) {
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
        return char;
      })
      .join('');
  }, []);

  // Boot sequence
  useEffect(() => {
    if (phase !== 'boot') return;

    let step = 0;
    const interval = setInterval(() => {
      if (step < TERROR_MESSAGES.length) {
        setBootText(TERROR_MESSAGES[step]);
        step++;
      } else {
        clearInterval(interval);
        // Trigger glitch transition
        setTimeout(() => setPhase('glitch'), 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [phase]);

  // Glitch phase
  useEffect(() => {
    if (phase !== 'glitch') return;

    let intensity = 0;
    const glitchInterval = setInterval(() => {
      intensity += 0.05;
      setGlitchIntensity(intensity);
      
      // Generate corrupted boot text
      setBootText(corruptText(TERROR_MESSAGES[TERROR_MESSAGES.length - 1], intensity));

      if (intensity >= 1) {
        clearInterval(glitchInterval);
        setPhase('error');
      }
    }, 100);

    return () => clearInterval(glitchInterval);
  }, [phase, corruptText]);

  // Error phase - generate corrupted code lines
  useEffect(() => {
    if (phase !== 'error') return;

    const errorLines = [
      'FATAL EXCEPTION: 0xDEADBEEF',
      'MEMORY CORRUPTION AT ADDRESS 0x00000000',
      'SANITY CORE: CRITICAL FAILURE',
      'ENTITY DETECTED IN SYSTEM SPACE',
      'STACK TRACE:', 
      '  at SanityManager.dissolve (sanity.js:666)',
      '  at RealityAnchor.sever (reality.js:13)',
      '  at TheDarkness.enter (void.js:???),',
      '  at Player.mind (consciousness.js:0)',
      'DIMENSIONAL BREACH IMMINENT',
      'ATTEMPTING EMERGENCY RECOVERY...',
      '[FAILED]',
      '',
      '[PRESS ANY KEY TO CONTINUE...]',
    ];

    let lineIndex = 0;
    const lines: string[] = [];
    
    const typeInterval = setInterval(() => {
      if (lineIndex < errorLines.length) {
        const line = errorLines[lineIndex];
        // Randomly corrupt some lines
        if (Math.random() > 0.6) {
          lines.push(corruptText(line, 0.3));
        } else {
          lines.push(line);
        }
        setCorruptedLines([...lines]);
        lineIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setShowPressKey(true);
          setPhase('recovery');
        }, 1000);
      }
    }, 150);

    return () => clearInterval(typeInterval);
  }, [phase, corruptText]);

  // Handle key press to continue
  useEffect(() => {
    if (phase !== 'recovery') return;

    const handleKeyPress = () => {
      onComplete();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleKeyPress);
    window.addEventListener('touchstart', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleKeyPress);
      window.removeEventListener('touchstart', handleKeyPress);
    };
  }, [phase, onComplete]);

  // Screen flicker effect
  const [flicker, setFlicker] = useState(false);
  useEffect(() => {
    if (phase !== 'error' && phase !== 'glitch') return;

    const flickerInterval = setInterval(() => {
      setFlicker(Math.random() > 0.7);
    }, 50);

    return () => clearInterval(flickerInterval);
  }, [phase]);

  const getPhaseStyles = () => {
    switch (phase) {
      case 'boot':
        return {
          background: '#0f0f23',
          color: '#e94560',
        };
      case 'glitch':
        return {
          background: flicker ? '#1a0000' : '#0f0f23',
          color: flicker ? '#ff0000' : '#e94560',
        };
      case 'error':
      case 'recovery':
        return {
          background: '#000000',
          color: '#ff0000',
        };
      default:
        return {};
    }
  };

  const styles = getPhaseStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: styles.background,
        color: styles.color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Courier New, monospace',
        zIndex: 10000,
        overflow: 'hidden',
        transition: 'background 0.05s ease',
      }}
    >
      {/* Scanlines effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          pointerEvents: 'none',
          opacity: phase === 'error' || phase === 'glitch' ? 0.5 : 0.2,
        }}
      />

      {/* CRT flicker overlay */}
      {flicker && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,0,0,0.1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        {(phase === 'boot' || phase === 'glitch') && (
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '0.2em',
              textShadow: flicker ? '2px 0 #ff0000, -2px 0 #00ff00' : '0 0 10px currentColor',
              transform: `translateX(${Math.random() * glitchIntensity * 10 - 5}px)`,
              animation: phase === 'glitch' ? 'shake 0.1s infinite' : undefined,
            }}
          >
            {bootText}
          </div>
        )}

        {(phase === 'error' || phase === 'recovery') && (
          <div
            style={{
              textAlign: 'left',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              maxWidth: '600px',
              padding: '2rem',
              background: 'rgba(0,0,0,0.8)',
              border: '2px solid #ff0000',
              boxShadow: flicker ? '0 0 20px #ff0000' : '0 0 10px #660000',
            }}
          >
            {corruptedLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.includes('PRESS ANY KEY') 
                    ? '#ffff00' 
                    : line.includes('FATAL') || line.includes('CRITICAL') || line.includes('BREACH')
                    ? '#ff0000'
                    : line.includes('void.js:???') || line.includes('consciousness.js:0')
                    ? '#ff6600'
                    : '#ff4444',
                  fontWeight: line.includes('FATAL') || line.includes('CRITICAL') ? 'bold' : 'normal',
                  animation: Math.random() > 0.9 ? 'flicker 0.1s infinite' : undefined,
                }}
              >
                {line}
                {i === corruptedLines.length - 1 && showPressKey && (
                  <span
                    style={{
                      animation: 'blink 1s infinite',
                      marginLeft: '0.5rem',
                    }}
                  >
                    _
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Game hint - makes it obvious this is intentional */}
        {phase === 'recovery' && (
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.8rem',
              color: '#666',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            <div>☠ THIS IS PART OF THE GAME EXPERIENCE ☠</div>
            <div style={{ marginTop: '0.5rem', color: '#999' }}>Press any key to enter the nightmare</div>
          </div>
        )}
      </div>

      {/* Static noise effect during glitch */}
      {phase === 'glitch' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: glitchIntensity * 0.3,
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) skewX(-2deg); }
          75% { transform: translateX(5px) skewX(2deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default HorrorIntro;
