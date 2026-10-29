import React from 'react';

interface IntroScreenProps {
  onBeginJourney: () => void;
  onBackToMenu: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onBeginJourney, onBackToMenu }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0d110f] p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(83,104,84,0.18),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.012)_0_1px,transparent_1px_5px)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[780px] min-h-[460px] bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 sm:p-12 flex flex-col items-center justify-between text-center">
        <div>
          <div className="w-12 h-1 bg-[#d5b66c] mx-auto mb-5 shadow-[0_0_8px_rgba(213,182,108,0.6)]" />
          
          <h2 className="font-serif text-2xl sm:text-3xl text-[#e7d9a5] tracking-widest font-normal">
            THE STORY BEGINS
          </h2>
          
          <div className="w-32 h-[1px] bg-[#59695d] mx-auto mt-3 mb-8" />

          <div className="space-y-4 text-xs sm:text-sm text-[#d5d0bf] max-w-xl mx-auto leading-relaxed font-sans font-light">
            <p>
              <strong className="text-[#e2c77b] font-medium">Aster Vale</strong>, a ranger of the Lanternfall frontier, steps into the drowned archive.
            </p>
            <p>
              The vault hums with frost, memory, and a forgotten crown beneath the floor of the ruins.
            </p>
            <p className="text-[#a8b6a2]">
              Your party follows the echo of the old king. The dungeon will test every choice.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
          <button
            onClick={onBeginJourney}
            className="flex-1 py-3 px-6 bg-[#344239] hover:bg-[#43564a] active:bg-[#28352d] border border-[#d5b66c] text-[#e7d9a5] text-sm font-semibold tracking-wider transition-colors shadow-md cursor-pointer"
          >
            BEGIN JOURNEY
          </button>
          <button
            onClick={onBackToMenu}
            className="py-3 px-5 bg-[#242f2b] hover:bg-[#35443b] active:bg-[#1a231f] border border-[#59695d] text-[#9aa697] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
