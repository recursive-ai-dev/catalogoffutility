declare module '../services/audioService' {
  export function setVolume(musicVolume: number, soundVolume: number): void;
  export function playLocationMusic(musicPath: string): void;
  export function toggleRadio(): boolean;
}
