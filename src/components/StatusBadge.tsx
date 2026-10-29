import React, { useState } from 'react';
import { ActiveStatusEffect } from '../types/game';
import {
  Biohazard,
  Flame,
  ShieldAlert,
  ShieldX,
  Swords,
  ShieldCheck,
  HeartPulse,
  Zap,
} from 'lucide-react';

interface StatusBadgeProps {
  effect: ActiveStatusEffect;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  effect,
  size = 'sm',
  showLabel = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getEffectConfig = () => {
    switch (effect.type) {
      // --- DEBUFFS ---
      case 'poisoned':
        return {
          icon: Biohazard,
          badgeBg: 'bg-[#12281a] border-[#2e6b41] text-[#7caa79]',
          glow: 'shadow-[0_0_8px_rgba(124,170,121,0.4)]',
          label: 'Poisoned',
          tagColor: 'text-[#7caa79]',
          categoryLabel: 'DEBUFF',
          categoryClass: 'text-[#e87d56] bg-[#311c14]',
        };
      case 'burned':
        return {
          icon: Flame,
          badgeBg: 'bg-[#311c14] border-[#8a4229] text-[#e87d56]',
          glow: 'shadow-[0_0_8px_rgba(232,125,86,0.4)]',
          label: 'Burned',
          tagColor: 'text-[#e87d56]',
          categoryLabel: 'DEBUFF',
          categoryClass: 'text-[#e87d56] bg-[#311c14]',
        };
      case 'weakened':
        return {
          icon: ShieldAlert,
          badgeBg: 'bg-[#261a33] border-[#6b478d] text-[#b48fe0]',
          glow: 'shadow-[0_0_8px_rgba(180,143,224,0.4)]',
          label: 'Weakened',
          tagColor: 'text-[#b48fe0]',
          categoryLabel: 'DEBUFF',
          categoryClass: 'text-[#b48fe0] bg-[#261a33]',
        };
      case 'vulnerable':
        return {
          icon: ShieldX,
          badgeBg: 'bg-[#341618] border-[#8a2f35] text-[#e86670]',
          glow: 'shadow-[0_0_8px_rgba(232,102,112,0.4)]',
          label: 'Vulnerable',
          tagColor: 'text-[#e86670]',
          categoryLabel: 'DEBUFF',
          categoryClass: 'text-[#e86670] bg-[#341618]',
        };

      // --- BUFFS ---
      case 'empowered':
        return {
          icon: Swords,
          badgeBg: 'bg-[#2c2613] border-[#d5b66c] text-[#ffd666]',
          glow: 'shadow-[0_0_10px_rgba(213,182,108,0.5)]',
          label: 'Empowered',
          tagColor: 'text-[#ffd666]',
          categoryLabel: 'BUFF',
          categoryClass: 'text-[#d5b66c] bg-[#2c2613]',
        };
      case 'fortified':
        return {
          icon: ShieldCheck,
          badgeBg: 'bg-[#132635] border-[#388bfd] text-[#79c0ff]',
          glow: 'shadow-[0_0_10px_rgba(56,139,253,0.5)]',
          label: 'Fortified',
          tagColor: 'text-[#79c0ff]',
          categoryLabel: 'BUFF',
          categoryClass: 'text-[#79c0ff] bg-[#132635]',
        };
      case 'regenerating':
        return {
          icon: HeartPulse,
          badgeBg: 'bg-[#102d22] border-[#2ea043] text-[#56d364]',
          glow: 'shadow-[0_0_10px_rgba(46,160,67,0.5)]',
          label: 'Regen',
          tagColor: 'text-[#56d364]',
          categoryLabel: 'BUFF',
          categoryClass: 'text-[#56d364] bg-[#102d22]',
        };
      case 'hastened':
        return {
          icon: Zap,
          badgeBg: 'bg-[#2d2210] border-[#d29922] text-[#f0883e]',
          glow: 'shadow-[0_0_10px_rgba(210,153,34,0.5)]',
          label: 'Hastened',
          tagColor: 'text-[#f0883e]',
          categoryLabel: 'BUFF',
          categoryClass: 'text-[#f0883e] bg-[#2d2210]',
        };
    }
  };

  const config = getEffectConfig();
  const IconComponent = config.icon;
  const isSm = size === 'sm';

  return (
    <div
      className="relative inline-block cursor-help select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip(!showTooltip);
      }}
    >
      <div
        className={`flex items-center gap-1 font-mono uppercase font-semibold border rounded-xs transition-all ${config.badgeBg} ${config.glow} ${
          isSm ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]'
        }`}
      >
        <IconComponent size={isSm ? 10 : 13} className="shrink-0 animate-pulse" />
        {showLabel && <span>{config.label}</span>}
        <span className="opacity-90 px-1 py-0 bg-black/50 rounded-xs text-[8px] font-bold">
          {effect.duration}
        </span>
      </div>

      {/* Tooltip Card */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-[#1b2421] border border-[#d5b66c] shadow-[0_10px_25px_rgba(0,0,0,0.95)] z-50 text-[10px] text-[#e4dec8] rounded-xs pointer-events-none animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#435248] pb-1 mb-1.5 font-mono font-bold">
            <div className="flex items-center gap-1.5">
              <span className={config.tagColor}>{config.label}</span>
              <span className={`text-[8px] px-1 py-0 border border-current rounded-xs uppercase ${config.categoryClass}`}>
                {config.categoryLabel}
              </span>
            </div>
            <span className="text-[#d5b66c]">
              {effect.duration} {effect.duration === 1 ? 'turn' : 'turns'}
            </span>
          </div>
          <p className="text-[#c7c8b2] leading-tight font-sans mb-1">
            {effect.description}
          </p>
          {effect.statModifier && (
            <div className="text-[9px] text-[#ffd666] font-mono bg-black/30 px-1 py-0.5 rounded-xs mt-1">
              Stat Modifier: {effect.statModifier.stat.toUpperCase()} × {effect.statModifier.multiplier}
            </div>
          )}
          {effect.damagePerTurn && (
            <div className="text-[9px] text-[#e87d56] font-mono bg-black/30 px-1 py-0.5 rounded-xs mt-0.5">
              Damage: -{effect.damagePerTurn} HP / turn
            </div>
          )}
          {effect.healPerTurn && (
            <div className="text-[9px] text-[#56d364] font-mono bg-black/30 px-1 py-0.5 rounded-xs mt-0.5">
              Restoration: +{effect.healPerTurn} HP / turn
            </div>
          )}
        </div>
      )}
    </div>
  );
};
