/**
 * Audio Service for managing game music and sound effects
 * Provides type-safe audio handling with performance optimizations
 */

import { assetPreloader } from './assetPreloader';

interface AudioSettings {
  musicVolume: number;
  soundVolume: number;
}

export class AudioService {
  private currentMusic: HTMLAudioElement | null = null;
  private radioMusic: HTMLAudioElement | null = null;
  private ambientLayers: Map<string, HTMLAudioElement> = new Map();
  private musicVolume: number = 75;
  private soundVolume: number = 75;
  private radioEnabled: boolean = false;
  private currentMusicPath: string = '';
  private preloadedSounds: Map<string, HTMLAudioElement> = new Map();
  private crossfadeInterval: NodeJS.Timeout | null = null;
  private sanityLevel: number = 100;
  private atmosphereAudio: HTMLAudioElement | null = null;
  private terrorEffects: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Preload commonly used sounds for better performance
    this.preloadCommonSounds();
    this.preloadAtmosphericSounds();
    this.initializeAmbientAtmosphere();
  }

  setVolume(musicVolume: number, soundVolume: number): void {
    this.musicVolume = Math.max(0, Math.min(100, musicVolume));
    this.soundVolume = Math.max(0, Math.min(100, soundVolume));
    
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume / 100;
    }
    
    if (this.radioMusic) {
      this.radioMusic.volume = this.musicVolume / 100;
    }
  }

  getVolume(): AudioSettings {
    return {
      musicVolume: this.musicVolume,
      soundVolume: this.soundVolume
    };
  }

  async playLocationMusic(musicPath: string, useCrossfade: boolean = true): Promise<void> {
    // Check if the music is already playing
    if (this.currentMusicPath === musicPath && this.currentMusic && !this.radioEnabled) {
      if (this.currentMusic.paused) {
        await this.currentMusic.play().catch(error => {
          console.error(`Error resuming music: ${error.message}`);
        });
      }
      return;
    }

    this.currentMusicPath = musicPath;

    // Create new audio instance
    try {
      const newAudio = new Audio(musicPath);
      newAudio.loop = true;
      
      if (!this.radioEnabled) {
        if (this.currentMusic && useCrossfade) {
          // Use smooth crossfade for better atmosphere
          this.crossfadeToMusic(newAudio);
        } else {
          // Stop current music immediately
          if (this.currentMusic) {
            this.currentMusic.pause();
          }
          newAudio.volume = this.musicVolume / 100;
          this.currentMusic = newAudio;
          await newAudio.play().catch(error => {
            console.error(`Error playing music: ${error.message}`);
          });
        }
      } else {
        // Store for when radio is turned off
        this.currentMusic = newAudio;
      }
    } catch (error) {
      console.error(`Failed to load audio: ${musicPath}`, error);
    }
  }



  async playSound(soundPath: string, volumeMultiplier: number = 1): Promise<void> {
    // Check for preloaded sound
    let sound = this.preloadedSounds.get(soundPath);
    if (!sound) {
      // Create new audio instance if not preloaded
      try {
        sound = new Audio(soundPath);
        this.preloadedSounds.set(soundPath, sound);
      } catch (error) {
        console.error(`Failed to load sound: ${soundPath}`, error);
        return;
      }
    }

    // Clone the audio element to allow multiple simultaneous plays
    const soundClone = sound.cloneNode(true) as HTMLAudioElement;
    soundClone.volume = (this.soundVolume / 100) * volumeMultiplier;
    
    // Add subtle effects based on sanity level
    if (this.sanityLevel < 50) {
      soundClone.playbackRate = 0.95 + (Math.random() * 0.1);
    }
    
    await soundClone.play().catch(error => {
      console.error(`Error playing sound: ${error.message}`);
    });
  }

  async playSanitySound(isPositive: boolean): Promise<void> {
    const soundPath = isPositive ? '/sounds/ui/sanity_restore.mp3' : '/sounds/ui/sanity_drop.mp3';
    await this.playSound(soundPath, isPositive ? 0.7 : 1.2);
  }

  async playAchievementSound(): Promise<void> {
    await this.playSound('/sounds/ui/achievement_unlock.mp3', 0.8);
  }

  // Enhanced radio with better transitions
  async toggleRadio(): Promise<boolean> {
    this.radioEnabled = !this.radioEnabled;
    
    if (this.radioEnabled) {
      // Fade out location music and fade in radio
      if (this.currentMusic) {
        this.fadeOut(this.currentMusic, 1000);
      }
      
      // Play random radio music with atmospheric static
      const radioTracks = [
        '/music/radio/static_dreams.mp3',
        '/music/radio/distant_voices.mp3',
        '/music/radio/forgotten_frequencies.mp3',
        '/music/radio/midnight_signals.mp3'
      ];
      
      const randomTrack = radioTracks[Math.floor(Math.random() * radioTracks.length)];
      try {
        this.radioMusic = new Audio(randomTrack);
        this.radioMusic.volume = 0;
        this.radioMusic.loop = true;
        await this.radioMusic.play();
        
        // Fade in radio music
        this.fadeIn(this.radioMusic, this.musicVolume / 100, 1500);
        
        // Add subtle static effect
        setTimeout(() => {
          this.playSound('/sounds/radio/static_burst.mp3', 0.3);
        }, 500);
        
      } catch (error) {
        console.error(`Failed to load radio audio: ${randomTrack}`, error);
      }
    } else {
      // Fade out radio and resume location music
      if (this.radioMusic) {
        this.fadeOut(this.radioMusic, 1000);
        setTimeout(() => {
          if (this.radioMusic) {
            this.radioMusic.pause();
            this.radioMusic = null;
          }
        }, 1000);
      }
      
      // Resume location music if available
      if (this.currentMusic) {
        this.currentMusic.volume = 0;
        await this.currentMusic.play().catch(() => {});
        this.fadeIn(this.currentMusic, this.musicVolume / 100, 1500);
      }
    }
    
    return this.radioEnabled;
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = duration / 50;
    const volumeStep = targetVolume / steps;
    
    const fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(targetVolume, audio.volume + volumeStep);
      } else {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  stopAll(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
    
    if (this.radioMusic) {
      this.radioMusic.pause();
      this.radioMusic = null;
    }
    
    if (this.atmosphereAudio) {
      this.atmosphereAudio.pause();
    }
    
    this.stopAllTerrorEffects();
    
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = null;
    }
    
    this.currentMusicPath = '';
  }

  preloadSound(soundPath: string): void {
    if (!this.preloadedSounds.has(soundPath)) {
      try {
        const sound = new Audio(soundPath);
        this.preloadedSounds.set(soundPath, sound);
      } catch (error) {
        console.error(`Failed to preload sound: ${soundPath}`, error);
      }
    }
  }

  private preloadCommonSounds(): void {
    // Preload common sound effects for immediate playback
    const commonSounds = [
      '/sounds/ui/click.mp3',
      '/sounds/ui/error.mp3',
      '/sounds/ui/success.mp3',
      '/sounds/environment/door_creak.mp3',
      '/sounds/environment/footsteps.mp3',
      '/sounds/ui/sanity_drop.mp3',
      '/sounds/ui/sanity_restore.mp3',
      '/sounds/ui/achievement_unlock.mp3'
    ];

    commonSounds.forEach(soundPath => {
      this.preloadSound(soundPath);
    });
  }

  private preloadAtmosphericSounds(): void {
    // Preload atmospheric and terror sounds
    const atmosphericSounds = [
      '/sounds/atmosphere/wind_whisper.mp3',
      '/sounds/atmosphere/distant_echo.mp3',
      '/sounds/atmosphere/electrical_hum.mp3',
      '/sounds/terror/heartbeat_slow.mp3',
      '/sounds/terror/heartbeat_fast.mp3',
      '/sounds/terror/breathing_heavy.mp3',
      '/sounds/terror/static_burst.mp3',
      '/sounds/terror/whisper_distorted.mp3'
    ];

    atmosphericSounds.forEach(soundPath => {
      try {
        const audio = new Audio(soundPath);
        audio.volume = 0.3;
        audio.loop = true;
        this.terrorEffects.set(soundPath.split('/').pop()?.replace('.mp3', '') || '', audio);
      } catch (error) {
        console.warn(`Failed to preload atmospheric sound: ${soundPath}`);
      }
    });
  }

  private initializeAmbientAtmosphere(): void {
    // Create subtle ambient atmosphere layer
    try {
      this.atmosphereAudio = new Audio('/sounds/atmosphere/base_ambience.mp3');
      this.atmosphereAudio.volume = 0.1;
      this.atmosphereAudio.loop = true;
      // Start playing atmospheric base (very subtle)
      this.atmosphereAudio.play().catch(() => {
        // Will play when user first interacts
      });
    } catch (error) {
      console.warn('Failed to initialize ambient atmosphere');
    }
  }

  setSanityLevel(sanity: number): void {
    this.sanityLevel = Math.max(0, Math.min(100, sanity));
    this.updateAudioBasedOnSanity();
  }

  private updateAudioBasedOnSanity(): void {
    // Adjust audio effects based on sanity level
    const sanityRatio = this.sanityLevel / 100;
    const terrorIntensity = 1 - sanityRatio;
    
    // Update base atmosphere volume
    if (this.atmosphereAudio) {
      this.atmosphereAudio.volume = Math.max(0.05, 0.15 * (1 - sanityRatio));
    }
    
    // Apply terror effects based on sanity
    if (this.sanityLevel < 20) {
      // Critical sanity - intense effects
      this.playTerrorEffect('heartbeat_fast', 0.4 * terrorIntensity);
      this.playTerrorEffect('breathing_heavy', 0.2 * terrorIntensity);
      
      // Apply audio distortion to current music
      if (this.currentMusic) {
        this.currentMusic.playbackRate = 0.95 + (Math.random() * 0.1);
      }
    } else if (this.sanityLevel < 40) {
      // Low sanity - moderate effects
      this.playTerrorEffect('heartbeat_slow', 0.3 * terrorIntensity);
      this.stopTerrorEffect('heartbeat_fast');
      this.stopTerrorEffect('breathing_heavy');
      
      if (this.currentMusic) {
        this.currentMusic.playbackRate = 0.98 + (Math.random() * 0.04);
      }
    } else if (this.sanityLevel < 60) {
      // Medium sanity - subtle effects
      this.playTerrorEffect('electrical_hum', 0.1 * terrorIntensity);
      this.stopTerrorEffect('heartbeat_slow');
      this.stopTerrorEffect('heartbeat_fast');
      this.stopTerrorEffect('breathing_heavy');
      
      if (this.currentMusic) {
        this.currentMusic.playbackRate = 1.0;
      }
    } else {
      // High sanity - clear audio
      this.stopAllTerrorEffects();
      
      if (this.currentMusic) {
        this.currentMusic.playbackRate = 1.0;
      }
    }
  }

  private playTerrorEffect(effectName: string, volume: number): void {
    const effect = this.terrorEffects.get(effectName);
    if (effect) {
      effect.volume = Math.min(volume, this.soundVolume / 100);
      if (effect.paused) {
        effect.currentTime = 0;
        effect.play().catch(() => {});
      }
    }
  }

  private stopTerrorEffect(effectName: string): void {
    const effect = this.terrorEffects.get(effectName);
    if (effect && !effect.paused) {
      this.fadeOut(effect, 500);
    }
  }

  private stopAllTerrorEffects(): void {
    this.terrorEffects.forEach((effect) => {
      if (!effect.paused) {
        this.fadeOut(effect, 1000);
      }
    });
  }

  private fadeOut(audio: HTMLAudioElement, duration: number): void {
    const startVolume = audio.volume;
    const fadeStep = startVolume / (duration / 50);
    
    const fadeInterval = setInterval(() => {
      if (audio.volume > fadeStep) {
        audio.volume -= fadeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  private crossfadeToMusic(newAudio: HTMLAudioElement, duration: number = 2000): void {
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
    }

    const oldAudio = this.currentMusic;
    const targetVolume = this.musicVolume / 100;
    const steps = duration / 50;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    // Start new audio at 0 volume
    newAudio.volume = 0;
    newAudio.play().catch(error => {
      console.error(`Error starting crossfade: ${error.message}`);
    });

    this.crossfadeInterval = setInterval(() => {
      currentStep++;
      
      // Fade in new audio
      if (newAudio.volume < targetVolume) {
        newAudio.volume = Math.min(targetVolume, newAudio.volume + volumeStep);
      }
      
      // Fade out old audio
      if (oldAudio && oldAudio.volume > 0) {
        oldAudio.volume = Math.max(0, oldAudio.volume - volumeStep);
      }
      
      // Crossfade complete
      if (currentStep >= steps) {
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.volume = targetVolume; // Reset for potential reuse
        }
        newAudio.volume = targetVolume;
        this.currentMusic = newAudio;
        clearInterval(this.crossfadeInterval!);
        this.crossfadeInterval = null;
      }
    }, 50);
  }

  isRadioEnabled(): boolean {
    return this.radioEnabled;
  }
}

export const audioService = new AudioService();
