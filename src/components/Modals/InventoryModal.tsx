import React from 'react';
import { GameState } from '../../types/game';

interface InventoryModalProps {
  gameState: GameState;
  onUseItem?: (itemId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ gameState, onUseItem, onClose }) => {
  const potion = gameState.inventory.find((i) => i.id === 'potion');
  const potionQty = potion?.quantity ?? 0;
  const player = gameState.player;
  const canHeal = potionQty > 0 && player.currentHp < player.stats.hp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080c0a]/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="relative w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-[#59695d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-[#d5b66c]" />
            <h3 className="font-serif text-xl text-[#e2c77b] tracking-wider">
              INVENTORY
            </h3>
          </div>
          <span className="text-xs font-mono text-[#9aa697]">
            CAPACITY: {gameState.inventory.length}/10
          </span>
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between p-3 bg-[#202b26] border border-[#435248]">
            <div>
              <div className="text-sm font-medium text-[#e4dec8] flex items-center gap-2">
                <span>Potion</span>
                <span className="text-xs px-2 py-0.5 bg-[#17201d] text-[#d5b66c] border border-[#59695d] font-mono">
                  x{potionQty}
                </span>
              </div>
              <p className="text-xs text-[#9aa697] mt-1">
                Restores up to 35 HP. Fresh mountain spring water infused with sunlit moss.
              </p>
            </div>
            {onUseItem && (
              <button
                onClick={() => onUseItem('potion')}
                disabled={!canHeal}
                className={`px-3 py-1.5 text-xs font-semibold tracking-wider border cursor-pointer ${
                  canHeal
                    ? 'bg-[#344239] hover:bg-[#43564a] text-[#7caa79] border-[#7caa79]'
                    : 'bg-[#18201c] text-[#556358] border-[#36423a] cursor-not-allowed'
                }`}
              >
                USE
              </button>
            )}
          </div>

          <div className="p-3 bg-[#17201d] border border-[#303d35] text-center text-xs text-[#6e7d72] italic">
            No other items carried. The archives keep their relics guarded.
          </div>
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
