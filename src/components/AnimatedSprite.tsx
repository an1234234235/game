import React, { useState, useEffect } from 'react';
import { getEnemyAsset } from '../data/assetManifest.js';

export interface AssetDef {
  key: string;
  path: string;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  attackPath?: string;
  attackFrameWidth?: number;
  attackFrameHeight?: number;
  attackFrameCount?: number;
}

interface AnimatedSpriteProps {
  assetKey: string;
  className?: string;
  displaySize?: number;
  alt?: string;
  isAttacking?: boolean;
}

export const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  assetKey,
  className = '',
  displaySize = 128,
  alt = 'Enemy sprite',
  isAttacking = false,
}) => {
  const asset: AssetDef = getEnemyAsset(assetKey);
  const [frameIndex, setFrameIndex] = useState(0);

  const hasAttack = Boolean(isAttacking && asset.attackPath && asset.attackFrameCount);
  const activePath = hasAttack ? asset.attackPath! : asset.path;
  const frameCount = hasAttack ? asset.attackFrameCount! : (asset.frameCount || 1);
  const frameWidth = hasAttack ? (asset.attackFrameWidth || 128) : (asset.frameWidth || displaySize);
  const frameHeight = hasAttack ? (asset.attackFrameHeight || 106) : (asset.frameHeight || displaySize);
  const frameInterval = hasAttack ? 75 : 125; // Faster FPS for attack sequence

  // Reset frame when switching between idle and attack
  useEffect(() => {
    setFrameIndex(0);
  }, [hasAttack]);

  useEffect(() => {
    if (frameCount <= 1) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameCount);
    }, frameInterval);
    return () => clearInterval(interval);
  }, [frameCount, frameInterval, hasAttack]);

  // Normalize path if necessary
  const src = activePath.startsWith('/') ? activePath : `/${activePath}`;

  if (frameCount <= 1) {
    return (
      <div
        className={`flex items-center justify-center select-none ${className}`}
        style={{ width: displaySize, height: displaySize }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    );
  }

  // Calculate scaling factor so frameWidth/Height fits in displaySize
  const scale = displaySize / Math.max(frameWidth, frameHeight);
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const totalSheetWidth = frameWidth * frameCount * scale;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center select-none ${className}`}
      style={{ width: displaySize, height: displaySize }}
    >
      <div
        className="relative overflow-hidden pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute top-0 left-0 max-w-none pointer-events-none"
          style={{
            height: scaledHeight,
            width: totalSheetWidth,
            transform: `translateX(-${frameIndex * scaledWidth}px)`,
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
};
