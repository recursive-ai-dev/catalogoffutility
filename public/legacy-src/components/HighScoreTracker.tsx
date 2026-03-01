import React, { useState, useEffect } from 'react';
import { Trophy, Star, Calendar, Brain, Award } from 'lucide-react';
import { CacheService } from '../services/cacheService';
import { HighScore } from '../types/game';
import { useTranslation } from '../hooks/useTranslation';

interface HighScoreTrackerProps {
  currentDays: number;
  currentSanity: number;
}

export const HighScoreTracker: React.FC<HighScoreTrackerProps> = ({
  currentDays,
  currentSanity
}) => {
  const { common, header } = useTranslation();
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    (async () => {
      const scores = await CacheService.getInstance().getHighScores();
      setHighScores(scores as any); // Temporary type assertion to bypass mismatch
    })();
  }, [currentDays]);

  // Add high score when game ends (sanity reaches 0)
  useEffect(() => {
    (async () => {
      if (currentSanity === 0 && currentDays > 0) {
        const newScores = await CacheService.getInstance().addHighScore(currentDays, currentSanity, 0);
        setHighScores(newScores as any); // Temporary type assertion to bypass mismatch
      }
    })();
  }, [currentSanity, currentDays]);

  const topScore = highScores.length > 0 ? highScores[0] : null;
  const isNewRecord = currentDays > 0 && (!topScore || currentDays > topScore.daysSurvived);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showFullList) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 crt-screen">
        <div className="retro-panel max-w-3xl max-h-96 overflow-y-auto m-4 p-6 scanlines">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold retro-accent flex items-center gap-3">
              <Trophy size={32} />
              SURVIVAL RECORDS
            </h3>
            <button
              onClick={() => setShowFullList(false)}
              className="w-8 h-8 flex items-center justify-center retro-border retro-text hover:retro-accent transition-colors bg-black"
            >
              ×
            </button>
          </div>
          
          {highScores.length === 0 ? (
            <div className="text-center py-12 retro-dim">
              <Award size={64} className="mx-auto mb-6 opacity-50" />
              <div className="text-2xl mb-4">NO RECORDS FOUND</div>
              <div className="text-lg">BEGIN SURVIVAL PROTOCOL TO ESTABLISH RECORDS</div>
            </div>
          ) : (
            <div className="space-y-3">
              {highScores.map((score, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 retro-border ${
                    index === 0 
                      ? 'retro-accent border-4 bg-black' 
                      : 'retro-text bg-black'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'retro-accent' : 'retro-text'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="retro-dim" />
                        <span className="text-lg font-bold">
                          {score.daysSurvived} {header.days} SURVIVED
                        </span>
                      </div>
                      <div className="text-sm retro-dim">
                        RECORDED: {formatDate(score.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain size={16} className="retro-dim" />
                    <span className="text-lg retro-text">
                      {score.finalSanity}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Current/Top Score Display */}
      <div className="flex items-center gap-6 text-lg">
        {isNewRecord && currentSanity > 0 && (
          <div className="flex items-center gap-2 retro-accent animate-pulse">
            <Star size={20} />
            <span className="font-bold">{header.newRecord}</span>
          </div>
        )}
        
        <button
          onClick={() => setShowFullList(true)}
          className="flex items-center gap-3 retro-text hover:retro-accent transition-colors"
        >
          <Trophy size={20} className="retro-accent" />
          <span>
            {header.best}: {topScore ? `${topScore.daysSurvived} ${header.days}` : `0 ${header.days}`}
          </span>
        </button>
      </div>
    </>
  );
};
