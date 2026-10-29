import React from 'react';
import { FLOOR_DEFINITIONS } from '../../data/floors';
import { GameState } from '../../types/game';

interface WorldMapModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ gameState, onClose }) => {
  const currentFloor = gameState.dungeon.floor ?? 1;
  const unlockedFloors = gameState.progression.unlockedFloors ?? [1];
  const completedFloors = gameState.progression.completedFloors ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080c0a]/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="relative w-full max-w-[580px] max-h-[90vh] overflow-y-auto bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-[#59695d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-[#d5b66c]" />
            <h3 className="font-serif text-xl text-[#e2c77b] tracking-wider">
              WORLD MAP / THE 5 TOWERS
            </h3>
          </div>
          <span className="text-xs font-mono text-[#d5b66c]">
            CURRENT: FLOOR {String(currentFloor).padStart(2, '0')}
          </span>
        </div>

        <div className="space-y-2.5 py-1 max-h-[380px] overflow-y-auto pr-1">
          {FLOOR_DEFINITIONS.map((floorDef) => {
            const isCurrent = floorDef.floor === currentFloor;
            const isUnlocked = unlockedFloors.includes(floorDef.floor);
            const isCompleted = completedFloors.includes(floorDef.floor);

            return (
              <div
                key={floorDef.id}
                className={`p-3 border transition-colors ${
                  isCurrent
                    ? 'bg-[#2a3830] border-[#d5b66c]'
                    : isCompleted
                      ? 'bg-[#1e2722] border-[#4b5a4f]'
                      : isUnlocked
                        ? 'bg-[#202b26] border-[#3a473e]'
                        : 'bg-[#151c19] border-[#252f29] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 border ${
                        isCurrent
                          ? 'bg-[#d5b66c] text-[#111716] font-bold border-[#d5b66c]'
                          : isCompleted
                            ? 'bg-[#7caa79]/20 text-[#7caa79] border-[#7caa79]/50'
                            : 'bg-[#17201d] text-[#9aa697] border-[#435248]'
                      }`}
                    >
                      F{String(floorDef.floor).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-[#e4dec8]">
                        {floorDef.name}
                      </h4>
                      <p className="text-[11px] text-[#9aa697] mt-0.5">
                        {floorDef.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    {isCompleted ? (
                      <span className="text-[#7caa79] flex items-center gap-1 font-semibold">
                        CLEARED
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[#d5b66c] font-semibold animate-pulse">
                        EXPLORING
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[#c4c2ad]">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[#556358]">
                        LOCKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#303d35] flex items-center justify-between text-[11px] text-[#9aa697] font-mono">
                  <span>Boss: <strong className="text-[#e2c77b]">{floorDef.boss}</strong></span>
                  <span>Reward: {floorDef.reward.xp} XP • {floorDef.reward.gold} Gold</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#242f2b] hover:bg-[#35443b] border border-[#59695d] text-[#e4dec8] text-xs font-semibold tracking-wider cursor-pointer transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
