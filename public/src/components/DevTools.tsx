import React from 'react';

interface DevToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevTools: React.FC<DevToolsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="retro-panel w-full max-w-xl p-6">
        <h2 className="mb-3 text-lg font-bold retro-text">Developer Tools</h2>
        <p className="mb-4 text-sm retro-dim">
          Dev tools are temporarily simplified for this build.
        </p>
        <button onClick={onClose} className="retro-button px-4 py-2 text-sm">
          Close
        </button>
      </div>
    </div>
  );
};

export default DevTools;
