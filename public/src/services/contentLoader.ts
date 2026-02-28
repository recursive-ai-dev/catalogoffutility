/**
 * Runtime content loader.
 * Loads authored base locations and derives encounter questions directly from location data.
 */

import { Location, NPC, BoosterPack, WeatherCondition } from '../types/game';

type LoadedQuestion = {
  id: string;
  npcId: string;
  questionId: string;
  locationId: string;
  encounter: number;
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
};

const BASE_LOCATION_FILES = [
  'cabin.json',
  'block_17.json',
  'underpass.json',
  'office_333.json',
  'resonance_monolith.json',
  'suns_death.json',
  'tall_grass.json',
  'cliff_edge.json',
  'infested_room.json',
  'ashlands.json',
  'waiting_room.json'
];

const LOCATION_ID_OVERRIDES: Record<string, string> = {
  office_333: 'office',
  suns_death: 'event_horizon',
  tall_grass: 'field',
  cliff_edge: 'cliff',
  infested_room: 'infestation'
};

const LOCATION_VIDEO_FALLBACKS: Record<string, string> = {
  cabin: '/videos/locations/cabin_video.mp4',
  ashlands: '/videos/locations/ashlands_video.mp4',
  block_17: '/videos/locations/block_17_main.mp4',
  underpass: '/videos/locations/underpass_video.mp4',
  office: '/videos/locations/office_video.mp4',
  resonance_monolith: '/videos/locations/resonance_monolith.mp4',
  event_horizon: '/videos/locations/event_horizon_video.mp4',
  field: '/videos/locations/field_video.mp4',
  cliff: '/videos/locations/cliff_video.mp4',
  infestation: '/videos/locations/infestation_video.mp4',
  waiting_room: '/videos/locations/waiting_room_video.mp4'
};

const LOCATION_IMAGE_FALLBACK = '/images/locations/cabin_image.jpg';
const LOCATION_MUSIC_FALLBACK = '/music/locations/cabin_bgm.mp3';
const KNOWN_BOOSTER_FILES = [
  'booster_winter_forest.json',
  'booster_shadow_realm.json',
  'booster_crystal_caves.json',
  'booster_floating_islands.json'
];
const CORE_NARRATIVE_ROUTE = ['block_17', 'ashlands', 'underpass', 'office', 'resonance_monolith'] as const;

export interface LoadedContent {
  locations: Location[];
  boosterPacks: BoosterPack[];
  allCharacters: NPC[];
  questions: LoadedQuestion[];
}

export class ContentLoader {
  private static instance: ContentLoader;
  private loadedContent: LoadedContent = {
    locations: [],
    boosterPacks: [],
    allCharacters: [],
    questions: []
  };
  private locationPool: string[] = [];
  private baseGameLocationIds: string[] = [];

  static getInstance(): ContentLoader {
    if (!ContentLoader.instance) {
      ContentLoader.instance = new ContentLoader();
    }
    return ContentLoader.instance;
  }

  async loadAllContent(): Promise<LoadedContent> {
    try {
      this.loadedContent = {
        locations: [],
        boosterPacks: [],
        allCharacters: [],
        questions: []
      };

      await this.loadBaseLocations();
      await this.loadQuestions();
      await this.loadBoosterPacks();
      this.compileAllCharacters();
      this.initializeLocationPool();

      console.log('✅ Content loaded:', {
        locations: this.loadedContent.locations.length,
        explorable: this.baseGameLocationIds.length,
        characters: this.loadedContent.allCharacters.length,
        questions: this.loadedContent.questions.length
      });

      return this.loadedContent;
    } catch (error) {
      console.error('Failed to load content:', error);
      return this.loadedContent;
    }
  }

  private async loadBaseLocations(): Promise<void> {
    const loadedFiles: string[] = [];

    for (const file of BASE_LOCATION_FILES) {
      try {
        const response = await fetch(`/src/data/locations_base/${file}`);
        if (!response.ok) {
          continue;
        }

        const rawLocation = await response.json();
        const normalizedLocation = this.normalizeLocation(rawLocation);
        this.loadedContent.locations.push(normalizedLocation as unknown as Location);
        loadedFiles.push(file);
      } catch (error) {
        console.warn(`Failed to load base location: ${file}`, error);
      }
    }

    if (!this.loadedContent.locations.some(location => location.id === 'cabin')) {
      this.loadedContent.locations.unshift(this.createFallbackCabin());
    }

    this.loadedContent.locations.sort((a, b) => a.index - b.index);
    console.log(`Loaded ${this.loadedContent.locations.length} base locations`, loadedFiles);
  }

  private normalizeLocation(rawLocation: any): Location {
    const rawId = this.toId(rawLocation.id || 'unknown_location');
    const normalizedId = this.toId(LOCATION_ID_OVERRIDES[rawId] || rawId);
    const weather = this.normalizeWeather(rawLocation.weather, normalizedId);
    const characters = this.normalizeCharacters(rawLocation.characters, normalizedId, rawLocation.name);

    const normalized = {
      ...rawLocation,
      id: normalizedId,
      name: rawLocation.name || this.formatName(normalizedId),
      description: rawLocation.description || `A strange place called ${this.formatName(normalizedId)}.`,
      imagePath: this.resolveLocationImagePath(rawLocation, normalizedId),
      videoPath: this.resolveLocationVideoPath(rawLocation, normalizedId),
      musicPath: this.resolveLocationMusicPath(rawLocation, normalizedId),
      index: typeof rawLocation.index === 'number' ? rawLocation.index : this.loadedContent.locations.length + 1,
      dangerLevel: typeof rawLocation.dangerLevel === 'number' ? rawLocation.dangerLevel : 1,
      atmosphere: (rawLocation.atmosphere || 'mysterious') as any,
      weather,
      weatherEffects: this.getWeatherEffects(weather, normalizedId),
      timeOfDay: (rawLocation.timeOfDay || 'night') as any,
      specialFeatures: Array.isArray(rawLocation.specialFeatures) ? rawLocation.specialFeatures : [],
      characters
    };

    return normalized as Location;
  }

  private normalizeCharacters(rawCharacters: any, locationId: string, locationName?: string): NPC[] {
    if (!Array.isArray(rawCharacters)) {
      return [];
    }

    return rawCharacters.map((rawCharacter: any) => {
      const characterId = this.toId(rawCharacter.id || `${locationId}_entity`);
      const questionId = this.toId(rawCharacter.questionId || characterId);

      return {
        ...rawCharacter,
        id: characterId,
        name: rawCharacter.name || this.formatName(characterId),
        imagePath: rawCharacter.imagePath || `/images/locations/${characterId}_image.jpg`,
        videoPath: rawCharacter.videoPath || `/videos/npcs/${characterId}_video.mp4`,
        questionId,
        personality: rawCharacter.personality || {
          archetype: 'mysterious',
          traits: ['enigmatic'],
          emotionalState: 'calm',
          trustLevel: 50,
          communicationStyle: 'cryptic'
        },
        difficulty: typeof rawCharacter.difficulty === 'number' ? rawCharacter.difficulty : 1,
        relationship: typeof rawCharacter.relationship === 'number' ? rawCharacter.relationship : 0,
        backstory: rawCharacter.backstory || `An unsettling presence in ${locationName || this.formatName(locationId)}.`,
        motivations: Array.isArray(rawCharacter.motivations) ? rawCharacter.motivations : ['unknown'],
        fears: Array.isArray(rawCharacter.fears) ? rawCharacter.fears : ['unknown']
      } as NPC;
    });
  }

  private normalizeWeather(rawWeather: any, locationId: string): WeatherCondition {
    if (locationId === 'cabin') {
      return { type: 'clear', intensity: 'light', visibility: 100 };
    }

    const typeAliases: Record<string, WeatherCondition['type']> = {
      clear: 'clear',
      cloudy: 'cloudy',
      rainy: 'rainy',
      stormy: 'stormy',
      foggy: 'foggy',
      snowy: 'snowy',
      artificial: 'cloudy',
      damp: 'foggy',
      humid: 'cloudy',
      smoky: 'foggy'
    };

    const intensityAliases: Record<string, WeatherCondition['intensity']> = {
      light: 'light',
      moderate: 'moderate',
      heavy: 'heavy',
      buzzing: 'moderate',
      dripping: 'moderate',
      stagnant: 'heavy'
    };

    const rawType = this.toId(rawWeather?.type || '');
    const rawIntensity = this.toId(rawWeather?.intensity || '');
    const type = typeAliases[rawType] || 'cloudy';
    const intensity = intensityAliases[rawIntensity] || 'moderate';
    const visibility = this.clampNumber(rawWeather?.visibility, 10, 100, 70);

    return { type, intensity, visibility };
  }

  private resolveLocationImagePath(rawLocation: any, locationId: string): string {
    if (typeof rawLocation.imagePath === 'string' && rawLocation.imagePath.length > 0) {
      return rawLocation.imagePath;
    }
    return `/images/locations/${locationId}_image.jpg`;
  }

  private resolveLocationVideoPath(rawLocation: any, locationId: string): string {
    if (typeof rawLocation.videoPath === 'string' && rawLocation.videoPath.length > 0) {
      return rawLocation.videoPath;
    }
    if (Array.isArray(rawLocation.videoPaths) && rawLocation.videoPaths.length > 0) {
      return rawLocation.videoPaths[0];
    }
    return LOCATION_VIDEO_FALLBACKS[locationId] || `/videos/locations/${locationId}_video.mp4`;
  }

  private resolveLocationMusicPath(rawLocation: any, locationId: string): string {
    if (typeof rawLocation.musicPath === 'string' && rawLocation.musicPath.length > 0) {
      return rawLocation.musicPath;
    }
    if (Array.isArray(rawLocation.musicPaths) && rawLocation.musicPaths.length > 0) {
      return rawLocation.musicPaths[0];
    }
    return `/music/locations/${locationId}_bgm.mp3`;
  }

  private createFallbackCabin(): Location {
    const weather: WeatherCondition = {
      type: 'clear',
      intensity: 'light',
      visibility: 100
    };

    return {
      id: 'cabin' as any,
      name: 'The Cabin',
      description:
        'You wake in a small cabin with one door. Rest here, then step out into strange places that test your mind.',
      imagePath: LOCATION_IMAGE_FALLBACK,
      videoPath: LOCATION_VIDEO_FALLBACKS.cabin,
      musicPath: LOCATION_MUSIC_FALLBACK,
      index: 0,
      dangerLevel: 0,
      atmosphere: 'peaceful',
      weather,
      weatherEffects: this.getWeatherEffects(weather, 'cabin'),
      timeOfDay: 'day',
      specialFeatures: ['safe_zone', 'single_exit'],
      characters: []
    };
  }

  private async loadQuestions(): Promise<void> {
    const compiledQuestions: LoadedQuestion[] = [];

    for (const location of this.loadedContent.locations as Array<Location & { characters?: any[] }>) {
      for (const character of location.characters || []) {
        const encounters = Array.isArray((character as any).encounters) ? (character as any).encounters : [];
        const questionOwnerId = this.toId((character as any).questionId || character.id);

        encounters.forEach((encounter: any, encounterIndex: number) => {
          const encounterNumber = typeof encounter.encounter === 'number' ? encounter.encounter : encounterIndex + 1;
          const optionA = this.extractEncounterOption(encounter, 'A');
          const optionB = this.extractEncounterOption(encounter, 'B');
          const rawCorrect = String(encounter.correctAnswer || 'A').toUpperCase();
          const correctAnswer: 'A' | 'B' = rawCorrect === 'B' ? 'B' : 'A';

          compiledQuestions.push({
            id: `${questionOwnerId}_encounter_${encounterNumber}`,
            npcId: this.toId(character.id),
            questionId: questionOwnerId,
            locationId: this.toId(location.id),
            encounter: encounterNumber,
            question: encounter.question || 'What do you choose when reality falters?',
            optionA,
            optionB,
            correctAnswer
          });
        });
      }
    }

    this.loadedContent.questions = compiledQuestions;
    console.log(`Loaded ${compiledQuestions.length} encounter questions`);
  }

  private extractEncounterOption(encounter: any, option: 'A' | 'B'): string {
    const responses = Array.isArray(encounter?.responses) ? encounter.responses : [];
    const direct = responses.find((response: any) => String(response?.option || '').toUpperCase() === option);
    if (direct?.text) {
      return String(direct.text);
    }

    const byIndex = option === 'A' ? responses[0] : responses[1];
    if (byIndex?.text) {
      return String(byIndex.text);
    }

    const legacy = option === 'A' ? encounter?.optionA : encounter?.optionB;
    if (legacy) {
      return String(legacy);
    }

    return option === 'A' ? 'Hold onto what is real.' : 'Let the unknown decide.';
  }

  private async loadBoosterPacks(): Promise<void> {
    const boosterPackFiles = await this.discoverBoosterPacks();

    for (const file of boosterPackFiles) {
      const boosterId = this.getBoosterIdFromFile(file);
      const isOwned = await this.checkBoosterOwnership(boosterId);
      if (!isOwned) {
        continue;
      }

      try {
        const response = await fetch(`/boosters/${boosterId}.json`);
        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.warn(`Failed to load booster pack: ${file} Invalid content type: ${contentType || 'unknown'}`);
          continue;
        }

        const boosterPack = await response.json();

        this.loadedContent.boosterPacks.push(boosterPack);
        if (Array.isArray(boosterPack.locations)) {
          this.loadedContent.locations.push(...boosterPack.locations);
        }
      } catch (error) {
        console.warn(`Failed to load booster pack: ${file}`, error);
      }
    }
  }

  private async discoverBoosterPacks(): Promise<string[]> {
    return KNOWN_BOOSTER_FILES;
  }

  private async checkBoosterOwnership(boosterId: string): Promise<boolean> {
    try {
      const response = await fetch(`/boosters/${boosterId}.json`, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      return response.ok && contentType.includes('application/json');
    } catch {
      return false;
    }
  }

  private getBoosterIdFromFile(fileName: string): string {
    return fileName.replace(/\.json$/i, '');
  }

  private compileAllCharacters(): void {
    this.loadedContent.allCharacters = [];
    for (const location of this.loadedContent.locations) {
      if (location.characters?.length) {
        this.loadedContent.allCharacters.push(...location.characters);
      }
    }
  }

  private initializeLocationPool(): void {
    this.baseGameLocationIds = this.loadedContent.locations
      .filter(location => location.id !== 'cabin')
      .map(location => String(location.id));
    this.resetLocationPool();
  }

  resetLocationPool(): void {
    this.locationPool = [...this.baseGameLocationIds];
  }

  removeLocationFromPool(locationId: string): void {
    const index = this.locationPool.indexOf(locationId);
    if (index > -1) {
      this.locationPool.splice(index, 1);
    }
  }

  isLocationPoolEmpty(): boolean {
    return this.locationPool.length === 0;
  }

  getRemainingLocations(): string[] {
    return [...this.locationPool];
  }

  generateTravelOptions(visitedLocations: Set<string>, currentDay: number): string[] {
    void currentDay;

    if (this.isLocationPoolEmpty()) {
      return [];
    }

    const options: string[] = [];
    const nextNarrativeLocation = this.getNextNarrativeLocation(visitedLocations);

    if (nextNarrativeLocation) {
      options.push(nextNarrativeLocation);
    }

    const unseenLocations = this.locationPool.filter(
      locationId => !visitedLocations.has(locationId) && locationId !== nextNarrativeLocation
    );
    const fallbackLocations = this.locationPool.filter(locationId => locationId !== nextNarrativeLocation);
    const locationCandidates = unseenLocations.length > 0 ? unseenLocations : fallbackLocations;
    const shuffledCandidates = this.shuffleLocations(locationCandidates);

    if (shuffledCandidates[0]) {
      options.push(shuffledCandidates[0]);
    }
    if (shuffledCandidates[1] && Math.random() < 0.8) {
      options.push(shuffledCandidates[1]);
    }
    if (shuffledCandidates[2] && Math.random() < 0.45) {
      options.push(shuffledCandidates[2]);
    }

    return Array.from(new Set(options)).slice(0, 3);
  }

  private getNextNarrativeLocation(visitedLocations: Set<string>): string | null {
    for (const locationId of CORE_NARRATIVE_ROUTE) {
      if (!visitedLocations.has(locationId) && this.locationPool.includes(locationId)) {
        return locationId;
      }
    }
    return null;
  }

  private shuffleLocations(locationIds: string[]): string[] {
    return [...locationIds].sort(() => Math.random() - 0.5);
  }

  generateCharactersForLocation(locationId: string): NPC[] {
    const location = this.loadedContent.locations.find(entry => entry.id === locationId);
    if (!location?.characters?.length) {
      return [];
    }

    const shuffled = [...location.characters].sort(() => Math.random() - 0.5);
    const spawnCount = this.getSpawnCount(shuffled.length);
    return shuffled.slice(0, spawnCount);
  }

  private getSpawnCount(characterCount: number): number {
    if (characterCount <= 1) return 1;
    if (characterCount === 2) return Math.random() < 0.7 ? 2 : 1;
    if (characterCount >= 3) {
      if (Math.random() < 0.4) return 3;
      return Math.random() < 0.7 ? 2 : 1;
    }
    return 1;
  }

  getLocationById(locationId: string): Location | undefined {
    const key = this.toId(locationId);
    return this.loadedContent.locations.find(location => this.toId(location.id as string) === key);
  }

  getAllLocations(): Location[] {
    return this.loadedContent.locations;
  }

  getAvailableBoosterPacks(): BoosterPack[] {
    return this.loadedContent.boosterPacks;
  }

  getQuestions(): LoadedQuestion[] {
    return this.loadedContent.questions;
  }

  getQuestionByNpcId(npcId: string): LoadedQuestion | undefined {
    const matches = this.findQuestionsByNpcId(npcId);
    if (!matches.length) {
      return undefined;
    }
    return [...matches].sort((a, b) => a.encounter - b.encounter)[0];
  }

  private findQuestionsByNpcId(npcId: string): LoadedQuestion[] {
    const lookupKeys = this.expandLookupKeys(npcId);

    return this.loadedContent.questions.filter(question => {
      const questionKeys = [
        ...this.expandLookupKeys(question.npcId),
        ...this.expandLookupKeys(question.questionId),
        ...this.expandLookupKeys(question.id)
      ];

      return lookupKeys.some(key => questionKeys.includes(key));
    });
  }

  private expandLookupKeys(value: string): string[] {
    const normalized = this.toId(value);
    if (!normalized) {
      return [];
    }

    const keys = new Set<string>([normalized]);
    const segments = normalized.split('_').filter(Boolean);

    if (segments.length > 1) {
      keys.add(segments.slice(1).join('_'));
      keys.add(segments.slice(-1)[0]);
      keys.add(segments.slice(-2).join('_'));
    }

    return Array.from(keys);
  }

  getPoolStatus(): { total: number; remaining: number; visited: number } {
    const total = this.baseGameLocationIds.length;
    return {
      total,
      remaining: this.locationPool.length,
      visited: total - this.locationPool.length
    };
  }

  private getWeatherEffects(
    weather: WeatherCondition,
    locationId: string
  ): { sanityModifier: number; description: string } {
    if (locationId === 'cabin') {
      return {
        sanityModifier: 0,
        description: 'The cabin shelters you from the outside world.'
      };
    }

    const weatherEffects: Record<
      WeatherCondition['type'],
      { base: number; intensity: Record<WeatherCondition['intensity'], number> }
    > = {
      clear: { base: 2, intensity: { light: 1.0, moderate: 1.2, heavy: 1.5 } },
      cloudy: { base: -2, intensity: { light: 1.0, moderate: 1.2, heavy: 1.4 } },
      rainy: { base: -5, intensity: { light: 1.2, moderate: 1.5, heavy: 2.0 } },
      stormy: { base: -8, intensity: { light: 1.5, moderate: 2.0, heavy: 2.5 } },
      foggy: { base: -6, intensity: { light: 1.0, moderate: 1.3, heavy: 1.6 } },
      snowy: { base: -4, intensity: { light: 1.2, moderate: 1.4, heavy: 1.6 } }
    };

    const effect = weatherEffects[weather.type];
    const intensityMultiplier = effect.intensity[weather.intensity];
    const visibilityFactor = weather.visibility / 100;
    const sanityModifier = effect.base * intensityMultiplier * (1 + (1 - visibilityFactor));

    return {
      sanityModifier: Math.round(sanityModifier * 10) / 10,
      description: `Weather pressure: ${weather.type}, ${weather.intensity}, visibility ${weather.visibility}%.`
    };
  }

  private toId(value: unknown): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  private formatName(id: string): string {
    return id
      .split('_')
      .filter(Boolean)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, numeric));
  }
}

export const contentLoader = ContentLoader.getInstance();
