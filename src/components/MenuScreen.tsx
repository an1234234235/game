import React, { useState } from 'react';
import { hasSave } from '../systems/SaveSystem';
import { Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';
import { SoundSystem } from '../systems/SoundSystem';
import { PWAInstallButton } from './PWAInstallButton';

interface MenuScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onNewGame, onContinue }) => {
  const saveExists = hasSave('default');
  const [exitMessage, setExitMessage] = useState(false);
  const [isMuted, setIsMuted] = useState(() => SoundSystem.getMuted());

  const handleNewGame = () => {
    SoundSystem.playSelect();
    onNewGame();
  };

  const handleContinue = () => {
    SoundSystem.playSelect();
    onContinue();
  };

  const toggleAudio = () => {
    const muted = SoundSystem.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      SoundSystem.playSelect();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] lg:min-h-0 flex items-center justify-center bg-[#0d110f] p-3 sm:p-6 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(83,104,84,0.2),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.012)_0_1px,transparent_1px_5px)] pointer-events-none" />

      {/* Top action bar: Audio & PWA Install */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
        <PWAInstallButton />
        <button
          onClick={toggleAudio}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-[#1b2421]/90 hover:bg-[#25322e] border border-[#59695d] text-[#e4dec8] cursor-pointer transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={14} className="text-[#d36e61]" /> : <Volume2 size={14} className="text-[#7caa79]" />}
          <span className="hidden sm:inline text-[10px] tracking-wider">{isMuted ? 'MUTED' : 'AUDIO'}</span>
        </button>
      </div>

      {/* Main menu card */}
      <div className="relative z-10 w-full max-w-[760px] min-h-[460px] bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 sm:p-12 flex flex-col items-center justify-center text-center my-auto">
        {/* Gold accent ornament */}
        <div className="w-16 h-1 bg-[#d5b66c] mb-5 sm:mb-6 shadow-[0_0_8px_rgba(213,182,108,0.6)]" />

        <h1 className="font-serif text-3xl sm:text-5xl text-[#e7d9a5] tracking-widest font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          LANTERNFALL
        </h1>
        
        <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-[#a8b6a2] uppercase font-mono">
          RETRO TURN-BASED EXPEDITION RPG
        </p>

        {/* Platform compatibility badge */}
        <div className="mt-3 flex items-center gap-3 text-[10px] font-mono text-[#d5b66c] bg-[#141b18] px-3 py-1 border border-[#59695d]/50">
          <span className="flex items-center gap-1"><Monitor size={12} /> WEB DESKTOP</span>
          <span className="text-[#59695d]">•</span>
          <span className="flex items-center gap-1"><Smartphone size={12} /> SMARTPHONE & PWA</span>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-[#d2d1bd] italic max-w-md font-serif">
          "A small tower of ruined light and broken vows."
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col gap-3.5 w-full max-w-[280px]">
          <button
            onClick={handleNewGame}
            className="w-full min-h-[48px] py-3 px-6 bg-[#344239] hover:bg-[#43564a] active:bg-[#28352d] border border-[#d5b66c] text-[#e7d9a5] text-sm font-semibold tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center"
          >
            NEW GAME (CHƠI MỚI)
          </button>

          <button
            onClick={handleContinue}
            className={`w-full min-h-[48px] py-3 px-6 border text-sm font-semibold tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center ${
              saveExists
                ? 'bg-[#242f2b] hover:bg-[#35443b] active:bg-[#1a231f] border-[#59695d] text-[#e4dec8]'
                : 'bg-[#18211d] border-[#36423a] text-[#6b776f] hover:border-[#4f5f54] hover:text-[#9aa697]'
            }`}
          >
            CONTINUE {saveExists ? '(SAVED)' : ''}
          </button>

          <button
            onClick={() => {
              SoundSystem.playSelect();
              setExitMessage(true);
            }}
            className="w-full min-h-[44px] py-2.5 px-6 bg-[#242f2b] hover:bg-[#35443b] active:bg-[#1a231f] border border-[#59695d] text-[#e4dec8] text-sm font-semibold tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center"
          >
            EXIT / NGHỈ
          </button>
        </div>

        {exitMessage && (
          <div className="mt-5 text-xs text-[#9aa697] italic font-mono animate-fade-in">
            Tiến trình được tự động lưu. Bạn có thể an tâm tắt tab hoặc chuyển ứng dụng bất cứ lúc nào!
          </div>
        )}
      </div>
    </div>
  );
};
