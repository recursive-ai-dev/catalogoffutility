import React from 'react';
import { Image, X, Users, Database } from 'lucide-react';

interface PhotoAlbumProps {
  isOpen: boolean;
  onClose: () => void;
  answeredNPCs: Set<string>;
  allNPCs: { id: string; name: string; imagePath: string }[];
}

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({
  isOpen,
  onClose,
  answeredNPCs,
  allNPCs
}) => {
  if (!isOpen) return null;

  const completedNPCs = allNPCs.filter(npc => answeredNPCs.has(npc.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 crt-screen">
      <div className="retro-panel max-w-5xl max-h-96 overflow-y-auto m-4 w-full p-6 scanlines">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold retro-accent flex items-center gap-3">
            <Image size={32} />
            ENTITY DATABASE
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black"
          >
            <X size={16} />
          </button>
        </div>
        
        {completedNPCs.length === 0 ? (
          <div className="text-center py-16 retro-dim">
            <Database size={64} className="mx-auto mb-6 opacity-50" />
            <div className="text-2xl mb-4">DATABASE EMPTY</div>
            <div className="text-lg mb-2">NO ENTITIES ARCHIVED</div>
            <div className="text-sm">SUCCESSFULLY CONTACT ENTITIES TO ADD THEM TO DATABASE</div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center retro-border p-4 bg-black">
              <div className="retro-accent text-xl">
                ARCHIVED ENTITIES: {completedNPCs.length}
              </div>
              <div className="retro-dim text-sm mt-2">
                SUCCESSFUL CONTACT PROTOCOLS ESTABLISHED
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {completedNPCs.map((npc) => (
                <div 
                  key={npc.id}
                  className="retro-border bg-black p-3 text-center hover:retro-accent transition-colors"
                >
                  <div className="w-full aspect-square retro-border mb-3 flex items-center justify-center bg-black">
                    <img src={npc.imagePath} alt={npc.name} className="object-cover w-full h-full" onError={(e) => e.currentTarget.src = '/images/default_npc.png'} />
                  </div>
                  <div className="text-sm retro-text font-bold truncate">
                    {npc.name.toUpperCase()}
                  </div>
                  <div className="text-xs retro-dim mt-1">
                    ID: {npc.id.split('_').slice(1).join('_').toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoAlbum;
