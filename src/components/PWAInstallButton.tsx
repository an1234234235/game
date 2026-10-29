import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { SoundSystem } from '../systems/SoundSystem';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as standalone PWA, hide install trigger
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    SoundSystem.playSelect();
    if (isInstallable) {
      await install();
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wider bg-[#223326] hover:bg-[#2e4533] active:bg-[#1a291f] border border-[#7caa79] text-[#b8e2b5] transition-colors cursor-pointer shadow-xs ${className}`}
        title="Install on Mobile / Desktop (PWA)"
      >
        <Smartphone size={13} className="text-[#a4d4a0]" />
        {variant === 'full' ? (
          <span>CÀI APP ĐIỆN THOẠI / INSTALL</span>
        ) : (
          <span>INSTALL APP</span>
        )}
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-[#1b2421] border-2 border-[#d5b66c] p-5 shadow-2xl text-[#e4dec8]">
            <button
              onClick={() => {
                SoundSystem.playSelect();
                setShowIOSModal(false);
              }}
              className="absolute top-3 right-3 text-[#9aa697] hover:text-[#e4dec8] p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3 border-b border-[#313f37] pb-2">
              <Smartphone size={18} className="text-[#d5b66c]" />
              <h3 className="font-serif text-sm tracking-wider text-[#e7d9a5] font-bold">
                CÀI ĐẶT TRÊN ĐIỆN THOẠI (PWA)
              </h3>
            </div>

            <p className="text-xs text-[#c7c8b2] mb-3 leading-relaxed">
              Bạn có thể chơi Lanternfall toàn màn hình mượt mà như app gốc trên iOS & Android:
            </p>

            <div className="space-y-2.5 bg-[#141b18] p-3 border border-[#313f37] text-xs font-mono mb-4">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#313f37] text-[#d5b66c] flex items-center justify-center text-[10px] shrink-0 font-bold">
                  1
                </span>
                <span>
                  Trên iPhone/iPad (Safari), bấm nút <Share2 size={12} className="inline text-[#79c0ff]" /> <strong>Chia sẻ (Share)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#313f37] text-[#d5b66c] flex items-center justify-center text-[10px] shrink-0 font-bold">
                  2
                </span>
                <span>
                  Chọn <PlusSquare size={12} className="inline text-[#7caa79]" /> <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#313f37] text-[#d5b66c] flex items-center justify-center text-[10px] shrink-0 font-bold">
                  3
                </span>
                <span>Mở biểu tượng Lanternfall ngoài màn hình để chơi toàn màn hình không có thanh địa chỉ!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-[#344239] hover:bg-[#43564a] border border-[#d5b66c] text-[#e7d9a5] text-xs font-mono font-semibold tracking-wider cursor-pointer transition-colors"
            >
              ĐÃ HIỂU / CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
