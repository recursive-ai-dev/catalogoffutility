/**
 * Enhanced Translation Hook
 * Provides optimized translation functions with caching
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useMemo } from 'react';

export const useTranslation = (namespace?: string) => {
  const { t, i18n, ready } = useI18nTranslation(namespace);

  // Memoized translation function for better performance
  const translate = useMemo(() => {
    return (key: string, options?: any) => {
      try {
        return t(key, options);
      } catch (error) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    };
  }, [t]);

  // Quick access to common translations
  const common = useMemo(() => ({
    loading: translate('common.loading'),
    error: translate('common.error'),
    success: translate('common.success'),
    warning: translate('common.warning'),
    save: translate('common.save'),
    load: translate('common.load'),
    delete: translate('common.delete'),
    cancel: translate('common.cancel'),
    confirm: translate('common.confirm'),
    close: translate('common.close'),
    day: translate('common.day'),
    sanity: translate('common.sanity')
  }), [translate]);

  // Header translations
  const header = useMemo(() => ({
    best: translate('header.best'),
    days: translate('header.days'),
    newRecord: translate('header.newRecord')
  }), [translate]);

  // Game-specific translations
  const game = useMemo(() => ({
    title: translate('game.title'),
    subtitle: translate('game.subtitle'),
    loading: translate('game.loading'),
    systemError: translate('game.systemError'),
    restartSystem: translate('game.restartSystem')
  }), [translate]);

  // Cabin system translations
  const cabin = useMemo(() => ({
    systems: translate('cabin.systems'),
    door: translate('cabin.door'),
    radio: translate('cabin.radio'),
    album: translate('cabin.album'),
    manual: translate('cabin.manual'),
    goals: translate('cabin.goals'),
    reward: translate('cabin.reward'),
    reset: translate('cabin.reset'),
    fuse: translate('cabin.fuse'),
    operational: translate('cabin.operational')
  }), [translate]);

  // Entity translations
  const entities = useMemo(() => ({
    title: translate('entities.title'),
    noEntities: translate('entities.noEntities'),
    scanning: translate('entities.scanning'),
    selectEntity: translate('entities.selectEntity'),
    noEntitiesRange: translate('entities.noEntitiesRange')
  }), [translate]);

  // Navigation translations
  const navigation = useMemo(() => ({
    title: translate('navigation.title'),
    returnToBase: translate('navigation.returnToBase'),
    destinations: translate('navigation.destinations'),
    doorSealed: translate('navigation.doorSealed'),
    activateDoor: translate('navigation.activateDoor'),
    activateDoorBtn: translate('navigation.activateDoorBtn'),
    routesDetected: translate('navigation.routesDetected'),
    ready: translate('navigation.ready'),
    warning: translate('navigation.warning'),
    warningText: translate('navigation.warningText')
  }), [translate]);

  // Mental state translations
  const mental = useMemo(() => ({
    mentalState: translate('mental.mentalState'),
    coreStability: translate('mental.coreStability'),
    criticalThreshold: translate('mental.criticalThreshold'),
    healthy: translate('mental.healthy'),
    concerned: translate('mental.concerned'),
    critical: translate('mental.critical'),
    danger: translate('mental.danger')
  }), [translate]);

  // Communication translations
  const communication = useMemo(() => ({
    transmission: translate('communication.transmission'),
    entityQuery: translate('communication.entityQuery'),
    selectEntityPrompt: translate('communication.selectEntityPrompt'),
    awaitingSelection: translate('communication.awaitingSelection'),
    contactEstablished: translate('communication.contactEstablished'),
    entityArchived: translate('communication.entityArchived'),
    noProtocol: translate('communication.noProtocol'),
    entity: translate('communication.entity'),
    warning: translate('communication.warning'),
    awaitingInput: translate('communication.awaitingInput')
  }), [translate]);

  // Fuse box translations
  const fuseBox = useMemo(() => ({
    title: translate('fuseBox.title'),
    audio: translate('fuseBox.audio'),
    visual: translate('fuseBox.visual'),
    display: translate('fuseBox.display'),
    saves: translate('fuseBox.saves'),
    audioControls: translate('fuseBox.audioControls'),
    musicVolume: translate('fuseBox.musicVolume'),
    soundEffects: translate('fuseBox.soundEffects'),
    visualTheme: translate('fuseBox.visualTheme'),
    displayMode: translate('fuseBox.displayMode'),
    enterFullScreen: translate('fuseBox.enterFullScreen'),
    exitFullScreen: translate('fuseBox.exitFullScreen'),
    saveManagement: translate('fuseBox.saveManagement'),
    newSave: translate('fuseBox.newSave'),
    import: translate('fuseBox.import'),
    load: translate('fuseBox.load'),
    delete: translate('fuseBox.delete'),
    export: translate('fuseBox.export'),
    noSaveFiles: translate('fuseBox.noSaveFiles'),
    createFirstSave: translate('fuseBox.createFirstSave'),
    confirmDeletion: translate('fuseBox.confirmDeletion'),
    deletionWarning: translate('fuseBox.deletionWarning'),
    systemStatus: translate('fuseBox.systemStatus'),
    powerLevel: translate('fuseBox.powerLevel'),
    sanityCoreStable: translate('fuseBox.sanityCoreStable'),
    readyForInput: translate('fuseBox.readyForInput')
  }), [translate]);

  // Location translations
  const locations = useMemo(() => ({
    cabin: translate('locations.cabin'),
    forest: translate('locations.forest'),
    lake: translate('locations.lake'),
    ruins: translate('locations.ruins'),
    bridge: translate('locations.bridge'),
    cave: translate('locations.cave'),
    tower: translate('locations.tower'),
    graveyard: translate('locations.graveyard'),
    lighthouse: translate('locations.lighthouse'),
    mansion: translate('locations.mansion'),
    swamp: translate('locations.swamp'),
    desert: translate('locations.desert'),
    valley: translate('locations.valley'),
    garden: translate('locations.garden'),
    portal: translate('locations.portal')
  }), [translate]);

  // Color scheme translations
  const colorSchemes = useMemo(() => ({
    terminal: translate('colorSchemes.terminal'),
    terminalDesc: translate('colorSchemes.terminalDesc'),
    amber: translate('colorSchemes.amber'),
    amberDesc: translate('colorSchemes.amberDesc'),
    cyan: translate('colorSchemes.cyan'),
    cyanDesc: translate('colorSchemes.cyanDesc'),
    synthwave: translate('colorSchemes.synthwave'),
    synthwaveDesc: translate('colorSchemes.synthwaveDesc'),
    alert: translate('colorSchemes.alert'),
    alertDesc: translate('colorSchemes.alertDesc'),
    matrix: translate('colorSchemes.matrix'),
    matrixDesc: translate('colorSchemes.matrixDesc'),
    violet: translate('colorSchemes.violet'),
    violetDesc: translate('colorSchemes.violetDesc'),
    emerald: translate('colorSchemes.emerald'),
    emeraldDesc: translate('colorSchemes.emeraldDesc'),
    sunset: translate('colorSchemes.sunset'),
    sunsetDesc: translate('colorSchemes.sunsetDesc'),
    ice: translate('colorSchemes.ice'),
    iceDesc: translate('colorSchemes.iceDesc'),
    gold: translate('colorSchemes.gold'),
    goldDesc: translate('colorSchemes.goldDesc'),
    crimson: translate('colorSchemes.crimson'),
    crimsonDesc: translate('colorSchemes.crimsonDesc')
  }), [translate]);

  return {
    t: translate,
    i18n,
    ready,
    common,
    header,
    game,
    cabin,
    entities,
    navigation,
    mental,
    communication,
    fuseBox,
    locations,
    colorSchemes,
    currentLanguage: i18n.language,
    isRTL: ['ar', 'he', 'fa', 'ur'].includes(i18n.language)
  };
};