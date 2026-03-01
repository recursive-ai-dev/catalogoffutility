class AudioService {
  constructor() {
    this.currentMusic = null;
    this.radioMusic = null;
    this.musicVolume = 75;
    this.soundVolume = 75;
    this.radioEnabled = false;
  }

  setVolume(musicVolume, soundVolume) {
    this.musicVolume = musicVolume;
    this.soundVolume = soundVolume;
    
    if (this.currentMusic) {
      this.currentMusic.volume = musicVolume / 100;
    }
    
    if (this.radioMusic) {
      this.radioMusic.volume = musicVolume / 100;
    }
  }

  playLocationMusic(musicPath) {
    // Stop current music
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }

    // Implement audio loading and playing
    try {
      this.currentMusic = new Audio(musicPath);
      this.currentMusic.volume = this.musicVolume / 100;
      this.currentMusic.loop = true;
      this.currentMusic.play().catch(error => {
        console.error(`Error playing music: ${error.message}`);
      });
    } catch (error) {
      console.error(`Failed to load audio: ${musicPath}`, error);
    }
  }

  toggleRadio() {
    this.radioEnabled = !this.radioEnabled;
    
    if (this.radioEnabled) {
      // Stop location music
      if (this.currentMusic) {
        this.currentMusic.pause();
      }
      
      // Play random radio music
      const radioTracks = [
        '/music/radio/static_dreams.mp3',
        '/music/radio/distant_voices.mp3',
        '/music/radio/forgotten_frequencies.mp3',
        '/music/radio/midnight_signals.mp3'
      ];
      
      const randomTrack = radioTracks[Math.floor(Math.random() * radioTracks.length)];
      try {
        this.radioMusic = new Audio(randomTrack);
        this.radioMusic.volume = this.musicVolume / 100;
        this.radioMusic.loop = true;
        this.radioMusic.play().catch(error => {
          console.error(`Error playing radio music: ${error.message}`);
        });
      } catch (error) {
        console.error(`Failed to load radio audio: ${randomTrack}`, error);
      }
    } else {
      // Stop radio music
      if (this.radioMusic) {
        this.radioMusic.pause();
        this.radioMusic = null;
      }
      
      // Resume location music if available
      if (this.currentMusic) {
        this.currentMusic.play().catch(error => {
          console.error(`Error resuming music: ${error.message}`);
        });
      }
    }
    
    return this.radioEnabled;
  }

  playSound(soundPath) {
    // Play sound effect
    try {
      const sound = new Audio(soundPath);
      sound.volume = this.soundVolume / 100;
      sound.play().catch(error => {
        console.error(`Error playing sound: ${error.message}`);
      });
    } catch (error) {
      console.error(`Failed to load sound: ${soundPath}`, error);
    }
  }

  stopAll() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
    
    if (this.radioMusic) {
      this.radioMusic.pause();
      this.radioMusic = null;
    }
  }
}

export const audioService = new AudioService();
