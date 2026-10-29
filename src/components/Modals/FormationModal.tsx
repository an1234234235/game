import React from 'react';
import { GameState } from '../../types/game';

interface FormationModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const FormationModal: React.FC<FormationModalProps> = ({ gameState, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080c0a]/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-[#1b2421] border-2 border-[#d5b66c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-[#59695d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-[#d5b66c]" />
            <h3 className="font-serif text-xl text-[#e2c77b] tracking-wider">
              PARTY FORMATION
            </h3>
          </div>
          <span className="text-xs font-mono text-[#9aa697]">
            ROSTER: {gameState.party.length}/3
          </span>
        </div>

        <div className="space-y-3 py-2">
          {gameState.party.map((member, index) => {
            const isLead = index === 0;
            return (
              <div
                key={member.id}
                className={`p-3.5 bg-[#202b26] border transition-colors ${
                  isLead ? 'border-[#d5b66c]/80 bg-[#25322c]' : 'border-[#435248]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 bg-[#17201d] text-[#d5b66c] border border-[#59695d]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#e4dec8] flex items-center gap-2">
                        {member.name}
                        {isLead && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#7caa79]/20 text-[#7caa79] border border-[#7caa79]/50 uppercase">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#9aa697] font-mono mt-0.5">
                        {member.role.toUpperCase()} • LV {String(member.level).padStart(2, '0')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs space-y-0.5">
                    <div className="text-[#7caa79]">
                      HP {member.currentHp}/{member.stats.hp}
                    </div>
                    <div className="text-[#75a6bf]">
                      MP {member.currentMp}/{member.stats.mp}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#313f37] flex items-center justify-between text-xs">
                  <div className="text-[#a8b6a2] text-[11px]">
                    Skills: <span className="text-[#d5d0bf]">{member.skills.join(', ')}</span>
                  </div>
                  <div className="text-[10px] text-[#9aa697] font-mono">
                    SPD {member.stats.spd} • ATK {member.stats.atk} • DEF {member.stats.def}
                  </div>
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
