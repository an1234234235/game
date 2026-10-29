import React, { useEffect } from 'react';
import { GameState } from '../types/game';
import { getFloorDefinition } from '../data/floors';
import { advanceFloor } from '../systems/ProgressionSystem';
import { SoundSystem } from '../systems/SoundSystem';

interface FloorClearScreenProps {
  gameState: GameState;
  reward: { xp: number; gold: number };
  onContinue: (nextState: GameState) => void;
}

export const FloorClearScreen: React.FC<FloorClearScreenProps> = ({
  gameState,
  reward,
  onContinue,
}) => {
  const currentFloor = gameState.dungeon.floor ?? 1;
  const definition = getFloorDefinition(currentFloor);

  useEffect(() => {
    SoundSystem.playVictory();
  }, []);

  const handleNext = () => {
    SoundSystem.playSelect();
    const nextState = advanceFloor(gameState, currentFloor);
    onContinue(nextState);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0d110f] p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(124,170,121,0.18),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.012)_0_1px,transparent_1px_5px)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[720px] bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-1 bg-[#d5b66c] mb-6 shadow-[0_0_10px_rgba(213,182,108,0.7)]" />

        <h2 className="font-serif text-3xl sm:text-4xl text-[#e7d9a5] tracking-widest font-normal drop-shadow">
          FLOOR CLEARED
        </h2>

        <h3 className="mt-3 font-serif text-xl sm:text-2xl text-[#d1b879]">
          {definition.name}
        </h3>

        <div className="my-6 px-6 py-3 bg-[#202b26] border border-[#59695d] font-mono text-sm sm:text-base text-[#d6d4c5] tracking-wider">
          Reward: <strong className="text-[#e2c77b]">{reward.xp ?? 0} XP</strong> • <strong className="text-[#d5b66c]">{reward.gold ?? 0} Gold</strong>
        </div>

        <p className="text-xs sm:text-sm text-[#a8b6a2] max-w-lg leading-relaxed italic mb-8">
          The lantern burns brighter. A hidden passage opens beyond the stone archway into the next floor of Lanternfall.
        </p>

        <button
          onClick={handleNext}
          className="py-3.5 px-8 bg-[#344239] hover:bg-[#43564a] active:bg-[#28352d] border border-[#d5b66c] text-[#e7d9a5] text-sm font-semibold tracking-wider transition-colors shadow-lg cursor-pointer"
        >
          CONTINUE DESCENT
        </button>
      </div>
    </div>
  );
};
