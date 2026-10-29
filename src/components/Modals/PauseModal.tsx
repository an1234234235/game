import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  onRestartFloor: () => void;
  onReturnToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestartFloor, onReturnToMenu }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080c0a]/80 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-[440px] bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 text-center">
        <div className="w-10 h-1 bg-[#d5b66c] mx-auto mb-4" />
        <h3 className="font-serif text-2xl text-[#e2c77b] tracking-wider mb-2">
          EXPEDITION PAUSED
        </h3>
        <p className="text-xs text-[#c7c8b2] mb-6">
          The dungeon holds its breath. Progress is automatically saved.
        </p>

        <div className="flex flex-col gap-3 max-w-[240px] mx-auto">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 bg-[#344239] hover:bg-[#43564a] border border-[#d5b66c] text-[#e7d9a5] text-xs font-semibold tracking-wider cursor-pointer transition-colors shadow"
          >
            RESUME EXPEDITION
          </button>

          <button
            onClick={onRestartFloor}
            className="w-full py-2.5 px-4 bg-[#242f2b] hover:bg-[#35443b] border border-[#59695d] text-[#e4dec8] text-xs font-semibold tracking-wider cursor-pointer transition-colors"
          >
            RESTART FLOOR
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full py-2.5 px-4 bg-[#202824] hover:bg-[#2b3530] border border-[#435248] text-[#9aa697] text-xs font-semibold tracking-wider cursor-pointer transition-colors"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
