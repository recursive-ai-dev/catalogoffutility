import React, { useState, useEffect } from "react";
import {
  Settings,
  X,
  Volume2,
  Palette,
  Maximize,
  Monitor,
  Save,
  Upload,
  Download,
  Trash2,
  Clock,
  Image as ImageIcon,
  ChevronDown,
  Package,
} from "lucide-react";
import { GameSettings, SaveSlot } from "../types/game";
import { saveSystemService } from "../services/saveSystemService";
import { useBoosterPacks } from "../hooks/useBoosterPacks";

interface FuseBoxProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  gameState: any; // Current game state for saving
  onLoadGame: (gameState: any) => void; // Callback to load a game state
}

export const FuseBox: React.FC<FuseBoxProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  gameState,
  onLoadGame,
}) => {
  const [activeTab, setActiveTab] = useState<
    "audio" | "visual" | "display" | "saves" | "boosters"
  >("audio");
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSave, setSelectedSave] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  const {
    availableBoosters,
    ownedBoosters,
    openBoosterStore,
    refreshBoosters,
  } = useBoosterPacks();

  useEffect(() => {
    if (isOpen && activeTab === "saves") {
      loadSaveSlots();
    }
  }, [isOpen, activeTab]);

  const loadSaveSlots = async () => {
    setIsLoading(true);
    try {
      const slots = await saveSystemService.getSaveSlots();
      setSaveSlots(slots);
    } catch (error) {
      console.error("Failed to load save slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!gameState) return;

    setIsLoading(true);
    try {
      const saveName = `Manual Save ${new Date().toLocaleString()}`;
      await saveSystemService.saveGame(gameState, saveName, false);
      await loadSaveSlots();
    } catch (error) {
      console.error("Failed to save game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadGame = async (saveId: string) => {
    setIsLoading(true);
    try {
      const loadedState = await saveSystemService.loadGame(saveId);
      if (loadedState) {
        onLoadGame(loadedState);
        onClose();
      }
    } catch (error) {
      console.error("Failed to load game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    setIsLoading(true);
    try {
      await saveSystemService.deleteSave(saveId);
      await loadSaveSlots();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete save:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSave = async (saveId: string) => {
    try {
      const exportData = await saveSystemService.exportSave(saveId);
      if (exportData) {
        const blob = new Blob([exportData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ibt2_save_${saveId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export save:", error);
    }
  };

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const saveId = await saveSystemService.importSave(text);
      if (saveId) {
        await loadSaveSlots();
      }
    } catch (error) {
      console.error("Failed to import save:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatPlayTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  const colorSchemes = [
    {
      id: "terminal",
      name: "Terminal Green",
      description: "Classic green phosphor CRT",
      primary: "#00ff00",
      secondary: "#1a1a1a",
    },
    {
      id: "amber",
      name: "Amber CRT",
      description: "Warm amber monochrome",
      primary: "#ffb000",
      secondary: "#2d1a00",
    },
    {
      id: "cyan",
      name: "IBM Blue",
      description: "Classic IBM terminal",
      primary: "#00ffff",
      secondary: "#002d2d",
    },
    {
      id: "synthwave",
      name: "Synthwave",
      description: "80s neon aesthetic",
      primary: "#ff00ff",
      secondary: "#1a0f2d",
    },
    {
      id: "alert",
      name: "Red Alert",
      description: "Emergency system",
      primary: "#ff0000",
      secondary: "#2d0000",
    },
    {
      id: "matrix",
      name: "Matrix Blue",
      description: "Digital rain theme",
      primary: "#0080ff",
      secondary: "#001a2d",
    },
  ] as const;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      onUpdateSettings({ fullScreen: true });
    } else {
      document.exitFullscreen();
      onUpdateSettings({ fullScreen: false });
    }
  };

  const currentScheme =
    colorSchemes.find((scheme) => scheme.id === settings.colorScheme) ||
    colorSchemes[0];

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 crt-screen p-2 sm:p-4">
      <div className="modal-container max-w-4xl max-h-[95vh] w-full flex flex-col scanlines">
        {/* Fixed Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 pb-4 border-b-2 border-pixel-accent bg-pixel-gray flex-shrink-0 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <h3 className="retro-title retro-accent flex items-center gap-3">
              <Settings size={24} className="flex-shrink-0" />
              <span className="text-responsive-lg">FUSE BOX</span>
            </h3>

            {/* Tab Navigation */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("audio")}
                className={`retro-button px-2 sm:px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === "audio" ? "retro-accent border-4" : ""}`}
              >
                <Volume2 size={12} />
                <span className="hidden sm:inline">AUDIO</span>
              </button>
              <button
                onClick={() => setActiveTab("visual")}
                className={`retro-button px-2 sm:px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === "visual" ? "retro-accent border-4" : ""}`}
              >
                <Palette size={12} />
                <span className="hidden sm:inline">VISUAL</span>
              </button>
              <button
                onClick={() => setActiveTab("display")}
                className={`retro-button px-2 sm:px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === "display" ? "retro-accent border-4" : ""}`}
              >
                <Monitor size={12} />
                <span className="hidden sm:inline">DISPLAY</span>
              </button>
              <button
                onClick={() => setActiveTab("saves")}
                className={`retro-button px-2 sm:px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === "saves" ? "retro-accent border-4" : ""}`}
              >
                <Save size={12} />
                <span className="hidden sm:inline">SAVES</span>
              </button>
              <button
                onClick={() => setActiveTab("boosters")}
                className={`retro-button px-2 sm:px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === "boosters" ? "retro-accent border-4" : ""}`}
              >
                <Package size={12} />
                <span className="hidden sm:inline">BOOSTERS</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4">
          {/* Audio Settings Tab */}
          {activeTab === "audio" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block retro-dim mb-2 text-responsive">
                  MUSIC VOLUME: {settings.musicVolume}%
                </label>
                <div className="retro-progress">
                  <div
                    className="retro-progress-fill"
                    style={{ width: `${settings.musicVolume}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) =>
                    onUpdateSettings({ musicVolume: parseInt(e.target.value) })
                  }
                  className="w-full mt-2 opacity-0 absolute"
                />
              </div>

              <div>
                <label className="block retro-dim mb-2 text-responsive">
                  SOUND EFFECTS: {settings.soundVolume}%
                </label>
                <div className="retro-progress">
                  <div
                    className="retro-progress-fill"
                    style={{ width: `${settings.soundVolume}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) =>
                    onUpdateSettings({ soundVolume: parseInt(e.target.value) })
                  }
                  className="w-full mt-2 opacity-0 absolute"
                />
              </div>
            </div>
          )}

          {/* Visual Settings Tab */}
          {activeTab === "visual" && (
            <div className="space-y-4 sm:space-y-6">
              <h4 className="flex items-center gap-3 retro-text font-bold mb-4 text-responsive-lg">
                <Palette size={20} className="retro-accent" />
                VISUAL THEME
              </h4>

              {/* Color Scheme Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className="retro-button w-full p-4 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 retro-border"
                        style={{ backgroundColor: currentScheme.primary }}
                      />
                      <div
                        className="w-6 h-6 retro-border"
                        style={{ backgroundColor: currentScheme.secondary }}
                      />
                    </div>
                    <div>
                      <div className="retro-text font-bold text-responsive">
                        {currentScheme.name}
                      </div>
                      <div className="retro-dim text-xs">
                        {currentScheme.description}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`retro-accent transition-transform ${showColorDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showColorDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 z-10 mt-1 dropdown-menu max-h-64 overflow-y-auto"
                    style={{ minWidth: "400px" }}
                  >
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.id}
                        onClick={() => {
                          onUpdateSettings({ colorScheme: scheme.id });
                          setShowColorDropdown(false);
                        }}
                        className={`w-full p-3 text-left hover:retro-accent transition-colors border-b border-gray-600 last:border-b-0 ${
                          settings.colorScheme === scheme.id
                            ? "retro-accent"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div
                              className="w-4 h-4 retro-border"
                              style={{ backgroundColor: scheme.primary }}
                            />
                            <div
                              className="w-4 h-4 retro-border"
                              style={{ backgroundColor: scheme.secondary }}
                            />
                          </div>
                          <div>
                            <div className="retro-text font-bold text-sm">
                              {scheme.name}
                            </div>
                            <div className="retro-dim text-xs">
                              {scheme.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Accessibility: Reduce Flicker/Effects */}
                <div className="mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.accessibility?.reducedMotion}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          accessibility: {
                            ...settings.accessibility,
                            reducedMotion: e.target.checked,
                          },
                        })
                      }
                      className="form-checkbox w-5 h-5 retro-accent"
                    />
                    <span className="retro-text text-responsive">
                      Accessibility: Reduce CRT Flicker/Scanlines/Effects
                    </span>
                  </label>
                  <div className="retro-dim text-xs mt-2">
                    Disables CRT flicker, scanlines, and motion effects for
                    sensitive players or accessibility needs.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings Tab */}
          {activeTab === "display" && (
            <div className="space-y-4 sm:space-y-6">
              <h4 className="flex items-center gap-3 retro-text font-bold mb-4 text-responsive-lg">
                <Monitor size={20} className="retro-accent" />
                DISPLAY MODE
              </h4>

              <button
                onClick={toggleFullScreen}
                className="retro-button w-full py-4 flex items-center justify-center gap-3 text-responsive"
              >
                <Maximize size={20} />
                {settings.fullScreen ? "EXIT FULL SCREEN" : "ENTER FULL SCREEN"}
              </button>
            </div>
          )}

          {/* Save/Load Tab */}
          {activeTab === "saves" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="flex items-center gap-3 retro-text font-bold text-responsive-lg">
                  <Save size={20} className="retro-accent" />
                  SAVE MANAGEMENT
                </h4>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGame}
                    disabled={isLoading || !gameState}
                    className="retro-button px-3 sm:px-4 py-2 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Save size={14} />
                    <span className="hidden sm:inline">NEW SAVE</span>
                    <span className="sm:hidden">SAVE</span>
                  </button>

                  <label className="retro-button px-3 sm:px-4 py-2 flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                    <Upload size={14} />
                    <span className="hidden sm:inline">IMPORT</span>
                    <span className="sm:hidden">IMP</span>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleImportSave}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 retro-dim">
                  <div className="animate-pulse">LOADING SAVE DATA...</div>
                </div>
              ) : saveSlots.length === 0 ? (
                <div className="text-center py-8 retro-dim">
                  <Save size={48} className="mx-auto mb-4 opacity-50" />
                  <div className="text-lg sm:text-xl mb-2">
                    NO SAVE FILES FOUND
                  </div>
                  <div className="text-xs sm:text-sm">
                    Create your first save to begin
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {saveSlots.map((save) => (
                    <div
                      key={save.id}
                      className={`retro-border p-3 sm:p-4 bg-black transition-all ${
                        selectedSave === save.id ? "retro-accent border-4" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Save Screenshot/Icon */}
                        <div className="w-12 h-9 sm:w-16 sm:h-12 retro-border bg-black flex items-center justify-center flex-shrink-0">
                          {save.screenshot ? (
                            <img
                              src={save.screenshot}
                              alt="Save preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={16} className="retro-dim" />
                          )}
                        </div>

                        {/* Save Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="retro-text font-bold truncate text-sm">
                              {save.name}
                            </h5>
                            {save.isAutoSave && (
                              <span className="retro-accent text-xs">
                                [AUTO]
                              </span>
                            )}
                          </div>

                          <div className="text-xs retro-dim space-y-1">
                            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                              <span>Day {save.gameState.daysSurvived}</span>
                              <span>Sanity: {save.gameState.sanity}%</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatPlayTime(save.playTime)}
                              </span>
                            </div>
                            <div className="truncate">
                              Saved:{" "}
                              {new Date(save.lastModified).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Save Actions */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleLoadGame(save.id)}
                            className="retro-button px-2 sm:px-3 py-1 text-xs"
                          >
                            LOAD
                          </button>

                          <button
                            onClick={() => handleExportSave(save.id)}
                            className="retro-button px-2 sm:px-3 py-1 text-xs"
                          >
                            <Download size={10} className="inline mr-1" />
                            <span className="hidden sm:inline">EXP</span>
                          </button>

                          <button
                            onClick={() => setShowDeleteConfirm(save.id)}
                            className="retro-button px-2 sm:px-3 py-1 text-xs border-red-500 text-red-400 hover:bg-red-500 hover:text-black"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Boosters Tab */}
          {activeTab === "boosters" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="flex items-center gap-3 retro-text font-bold text-responsive-lg">
                  <Package size={20} className="retro-accent" />
                  BOOSTER PACKS ({ownedBoosters.length}/
                  {availableBoosters.length})
                </h4>

                <div className="flex gap-2">
                  <button
                    onClick={openBoosterStore}
                    className="retro-button px-3 sm:px-4 py-2 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Package size={14} />
                    <span>STORE</span>
                  </button>

                  <button
                    onClick={refreshBoosters}
                    className="retro-button px-3 sm:px-4 py-2 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Monitor size={14} />
                    <span>REFRESH</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableBoosters.map((booster) => (
                  <div
                    key={booster.id}
                    className={`retro-border p-3 sm:p-4 bg-black transition-all ${
                      booster.owned ? "border-green-400" : "border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Booster Icon */}
                      <div
                        className={`w-12 h-12 retro-border flex items-center justify-center flex-shrink-0 ${
                          booster.owned ? "bg-green-900" : "bg-gray-800"
                        }`}
                      >
                        <Package
                          size={20}
                          className={
                            booster.owned ? "text-green-400" : "text-gray-400"
                          }
                        />
                      </div>

                      {/* Booster Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="retro-text font-bold truncate text-sm">
                            {booster.name}
                          </h5>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              booster.rarity === "legendary"
                                ? "bg-yellow-400 text-black"
                                : booster.rarity === "epic"
                                  ? "bg-purple-400 text-white"
                                  : booster.rarity === "rare"
                                    ? "bg-blue-400 text-white"
                                    : "bg-gray-400 text-black"
                            }`}
                          >
                            {booster.rarity.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-xs retro-dim">
                          {booster.description}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-center gap-1">
                        {booster.owned ? (
                          <div className="text-green-400 text-xs font-bold">
                            OWNED
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">NOT OWNED</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="retro-border p-4 bg-black retro-dim text-center">
                <div className="text-sm mb-2">
                  Purchase booster packs to unlock new locations, characters,
                  and content!
                </div>
                <button
                  onClick={openBoosterStore}
                  className="retro-button px-6 py-3 retro-accent"
                >
                  VISIT BOOSTER STORE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-60 p-4">
          <div className="modal-container max-w-md w-full p-4 sm:p-6">
            <div className="text-center">
              <Trash2 size={48} className="retro-accent mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold retro-text mb-4">
                CONFIRM DELETION
              </h3>
              <p className="retro-dim mb-6 text-sm">
                This action cannot be undone. The save file will be permanently
                deleted.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="retro-button flex-1 py-3 text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDeleteSave(showDeleteConfirm)}
                  className="retro-button flex-1 py-3 text-sm bg-red-600 border-red-400 hover:bg-red-500"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuseBox;
