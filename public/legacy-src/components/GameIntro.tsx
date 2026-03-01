import React, { useState, useEffect, useRef } from 'react';

/**
 * GameIntro - A cinematic intro sequence that plays after the horror error screen
 * Features video playback with atmospheric text overlays
 */

interface GameIntroProps {
  onComplete: () => void;
}

const INTRO_LINES = [
  { text: 'The cabin was supposed to be a refuge...', delay: 2000, duration: 4000 },
  { text: 'But the woods remember things we have forgotten.', delay: 6500, duration: 4000 },
  { text: 'They are waiting for you.', delay: 11000, duration: 3000 },
  { text: 'Survive. Uncover the truth. Or join them.', delay: 15000, duration: 4000 },
];

export const GameIntro: React.FC<GameIntroProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [showPressKey, setShowPressKey] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [skipPrompt, setSkipPrompt] = useState(false);

  // Handle video loaded
  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  // Schedule text lines
  useEffect(() => {
    if (!videoLoaded) return;

    const timeouts: NodeJS.Timeout[] = [];

    INTRO_LINES.forEach((line, index) => {
      // Show line
      const showTimeout = setTimeout(() => {
        setCurrentLineIndex(index);
      }, line.delay);
      timeouts.push(showTimeout);

      // Hide line
      const hideTimeout = setTimeout(() => {
        setCurrentLineIndex(-1);
      }, line.delay + line.duration);
      timeouts.push(hideTimeout);
    });

    // Show press key prompt
    const pressKeyTimeout = setTimeout(() => {
      setShowPressKey(true);
    }, 20000);
    timeouts.push(pressKeyTimeout);

    // Show skip prompt earlier
    const skipTimeout = setTimeout(() => {
      setSkipPrompt(true);
    }, 3000);
    timeouts.push(skipTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [videoLoaded]);

  // Handle interaction to skip/continue
  useEffect(() => {
    const handleInteraction = () => {
      onComplete();
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [onComplete]);

  // Auto-complete when video ends
  const handleVideoEnded = () => {
    setShowPressKey(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        src="/assets/videos/cabin.mp4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
        autoPlay
        muted
        loop={false}
        playsInline
        onLoadedData={handleVideoLoaded}
        onEnded={handleVideoEnded}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Film grain effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
          opacity: 0.3,
        }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '800px',
          padding: '2rem',
        }}
      >
        {currentLineIndex >= 0 && (
          <div
            style={{
              fontSize: '1.8rem',
              color: '#e94560',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 400,
              textShadow: '0 0 20px rgba(233, 69, 96, 0.5), 0 0 40px rgba(233, 69, 96, 0.3)',
              animation: 'fadeInOut 4s ease-in-out',
              letterSpacing: '0.1em',
              lineHeight: 1.6,
            }}
          >
            {INTRO_LINES[currentLineIndex].text}
          </div>
        )}

        {showPressKey && (
          <div
            style={{
              marginTop: '3rem',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <div
              style={{
                fontSize: '1.2rem',
                color: '#fff',
                fontFamily: 'Courier New, monospace',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Press any key to begin
              <span style={{ animation: 'blink 1s infinite', marginLeft: '0.5rem' }}>_</span>
            </div>
          </div>
        )}
      </div>

      {/* Skip prompt */}
      {skipPrompt && !showPressKey && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Courier New, monospace',
            letterSpacing: '0.1em',
          }}
        >
          Press any key to skip
        </div>
      )}

      {/* Loading state */}
      {!videoLoaded && (
        <div
          style={{
            position: 'absolute',
            color: '#e94560',
            fontFamily: 'Orbitron, monospace',
            fontSize: '1rem',
            letterSpacing: '0.2em',
          }}
        >
          Loading...
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GameIntro;
