import React, { useRef, useEffect, useState } from 'react';

/**
 * VideoPlayer - Plays location and NPC encounter videos with atmospheric effects
 * Maps video paths from data files to actual asset locations
 */

interface VideoPlayerProps {
  videoPath: string;
  isPlaying?: boolean;
  onEnded?: () => void;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  overlayText?: string;
  sanity?: number;
}

// Map data file paths to actual asset paths
const VIDEO_PATH_MAP: Record<string, string> = {
  // Location videos
  '/videos/locations/cabin_video.mp4': '/assets/videos/cabin.mp4',
  '/videos/locations/ashlands_video.mp4': '/assets/videos/ashlands.mp4',
  '/videos/locations/apartment_block_video.mp4': '/assets/videos/apartment_block.mp4',
  '/videos/locations/waiting_room_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  '/videos/locations/block_17_video.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  '/videos/locations/block_17_main.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  '/videos/locations/block_17_alt_01.mp4': '/assets/videos/20250617_2316_Vintage Moonlit Ocean_remix_01jy0d4jsmf2bvcpdzw23nye0b.mp4',
  
  // Additional location videos (mapped to available horror scenes)
  '/videos/locations/cliff_video.mp4': '/assets/videos/20250617_2316_Vintage Moonlit Ocean_remix_01jy0d4jsmf2bvcpdzw23nye0b.mp4',
  '/videos/locations/infestation_video.mp4': '/assets/videos/20250617_2342_Vintage Horror Scene_remix_01jy0em73efx2vm2hqwf4141x4.mp4',
  '/videos/locations/office_video.mp4': '/assets/videos/20250618_0437_Vintage Office Unveiled_remix_01jy0zhv7wfb1vxb6325wddee3.mp4',
  '/videos/locations/underpass_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  '/videos/locations/field_video.mp4': '/assets/videos/20250617_2211_Vintage Light Unease_remix_01jy09e325e53s9res39s6sct3.mp4',
  '/videos/locations/event_horizon_video.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  '/videos/locations/resonance_monolith.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b37zefk18cf74n16kc2z9.mp4',
  
  // NPC encounter videos (using horror scene videos as encounter atmosphere)
  '/videos/npcs/cabin_guardian_spirit_video.mp4': '/assets/videos/20250617_2342_Vintage Horror Scene_remix_01jy0em73efx2vm2hqwf4141x4.mp4',
  '/videos/npcs/cabin_memory_keeper_video.mp4': '/assets/videos/20250617_2211_Vintage Light Unease_remix_01jy09e325e53s9res39s6sct3.mp4',
  '/videos/npcs/cabin_mysterious_entity_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  
  // Ashlands NPCs
  '/videos/npcs/abram_simonis_video.mp4': '/assets/videos/20250618_0437_Vintage Office Unveiled_remix_01jy0zhv7wfb1vxb6325wddee3.mp4',
  '/videos/npcs/apartment_lost_resident_video.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  '/videos/npcs/ashlands_mysterious_entity_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b37zefk18cf74n16kc2z9.mp4',
  '/videos/npcs/ashlands_witness_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b3807ebyadksmbe0js27v.mp4',
  '/videos/npcs/ashlands_hollow_husks_video.mp4': '/assets/videos/20250617_2316_Vintage Moonlit Ocean_remix_01jy0d4jsmf2bvcpdzw23nye0b.mp4',
  '/videos/npcs/ashlands_cinder_child_video.mp4': '/assets/videos/20250617_2211_Vintage Light Unease_remix_01jy09e325e53s9res39s6sct3.mp4',
  
  // Cliff NPCs
  '/videos/npcs/cliff_moon_watcher_video.mp4': '/assets/videos/20250617_2316_Vintage Moonlit Ocean_remix_01jy0d4jsmf2bvcpdzw23nye0b.mp4',
  '/videos/npcs/cliff_diver_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b3807ebyadksmbe0js27v.mp4',
  
  // Infestation NPCs
  '/videos/npcs/infestation_caretaker_video.mp4': '/assets/videos/20250617_2342_Vintage Horror Scene_remix_01jy0em73efx2vm2hqwf4141x4.mp4',
  '/videos/npcs/infestation_swarm_voice_video.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  
  // Office NPCs
  '/videos/npcs/office_supervisor_video.mp4': '/assets/videos/20250618_0437_Vintage Office Unveiled_remix_01jy0zhv7wfb1vxb6325wddee3.mp4',
  '/videos/npcs/office_caller_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  
  // Underpass NPCs
  '/videos/npcs/underpass_artist_video.mp4': '/assets/videos/20250617_2211_Vintage Light Unease_remix_01jy09e325e53s9res39s6sct3.mp4',
  '/videos/npcs/underpass_shadow_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b37zefk18cf74n16kc2z9.mp4',

  // Waiting Room NPCs
  '/videos/npcs/waiting_room_attendant_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  '/videos/npcs/waiting_room_echo_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b3807ebyadksmbe0js27v.mp4',
  
  // Field NPCs
  '/videos/npcs/field_watcher_video.mp4': '/assets/videos/20250619_2116_Vintage Night Terror_remix_01jy5b3807ebyadksmbe0js27v.mp4',
  '/videos/npcs/field_lost_child_video.mp4': '/assets/videos/20250617_2342_Vintage Horror Scene_remix_01jy0em73efx2vm2hqwf4141x4.mp4',
  
  // Event Horizon NPCs
  '/videos/npcs/event_horizon_orator_video.mp4': '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4',
  '/videos/npcs/event_horizon_silent_watcher_video.mp4': '/assets/videos/20250617_2316_Vintage Moonlit Ocean_remix_01jy0d4jsmf2bvcpdzw23nye0b.mp4',
  
  // Resonance Monolith NPCs
  '/videos/npcs/frequency_herald_video.mp4': '/assets/videos/20250619_1855_Sinister Shadows Lurking_remix_01jy530e49fzx996fa0pg2twx1.mp4',
  '/videos/npcs/signal_archivist_video.mp4': '/assets/videos/20250618_0437_Vintage Office Unveiled_remix_01jy0zhv7wfb1vxb6325wddee3.mp4',
};

const DEFAULT_LOCATION_VIDEO =
  '/assets/videos/20250618_0447_Vintage Night Terror_remix_01jy103tz2f2mbakca465c5hm6.mp4';
const DEFAULT_NPC_VIDEO =
  '/assets/videos/20250617_2342_Vintage Horror Scene_remix_01jy0em73efx2vm2hqwf4141x4.mp4';

const resolveVideoPath = (videoPath: string): string => {
  if (VIDEO_PATH_MAP[videoPath]) {
    return VIDEO_PATH_MAP[videoPath];
  }

  if (videoPath.startsWith('/src/data/locations/')) {
    return videoPath;
  }

  if (videoPath.startsWith('/videos/locations/')) {
    return DEFAULT_LOCATION_VIDEO;
  }

  if (videoPath.startsWith('/videos/npcs/')) {
    return DEFAULT_NPC_VIDEO;
  }

  return videoPath;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoPath,
  isPlaying = true,
  onEnded,
  loop = false,
  muted = true,
  className = '',
  overlayText,
  sanity = 100,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Resolve video path
  const resolvedPath = resolveVideoPath(videoPath);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Auto-play might be blocked, that's ok
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleLoaded = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    console.warn(`Failed to load video: ${resolvedPath}`);
  };

  // Calculate glitch effects based on sanity
  const getGlitchStyle = () => {
    if (sanity > 50) return {};
    if (sanity > 30) return { filter: 'contrast(1.1) saturate(0.8)' };
    if (sanity > 20) return { filter: 'contrast(1.2) saturate(0.6) hue-rotate(10deg)' };
    if (sanity > 10) return { filter: 'contrast(1.3) saturate(0.4) hue-rotate(20deg) blur(0.5px)' };
    return { filter: 'contrast(1.4) saturate(0.2) hue-rotate(30deg) blur(1px) invert(0.1)' };
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        src={resolvedPath}
        autoPlay={isPlaying}
        loop={loop}
        muted={muted}
        playsInline
        onLoadedData={handleLoaded}
        onError={handleError}
        onEnded={onEnded}
        className="w-full h-full object-cover"
        style={getGlitchStyle()}
      />

      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-retro-accent animate-pulse">Loading...</div>
        </div>
      )}

      {/* Error state - show placeholder */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="text-center">
            <div className="text-4xl mb-2">📺</div>
            <div className="text-retro-dim text-sm">Signal Lost</div>
          </div>
        </div>
      )}

      {/* CRT overlay effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Sanity-based flicker overlay */}
      {sanity <= 30 && (
        <div 
          className="absolute inset-0 pointer-events-none animate-flicker"
          style={{
            background: sanity <= 10 ? 'rgba(255,0,0,0.1)' : 'rgba(233,69,96,0.05)',
          }}
        />
      )}

      {/* Overlay text */}
      {overlayText && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="retro-text text-sm bg-black bg-opacity-70 px-3 py-1 inline-block">
            {overlayText}
          </div>
        </div>
      )}

      {/* Static noise at low sanity */}
      {sanity <= 20 && (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
