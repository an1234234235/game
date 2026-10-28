export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = Object.freeze({
  ink: 0x111716,
  panel: 0x1b2421,
  panelRaised: 0x242f2b,
  line: 0x59695d,
  muted: 0x9aa697,
  paper: 0xe4dec8,
  gold: 0xd5b66c,
  green: 0x7caa79,
  red: 0xd36e61,
  blue: 0x75a6bf,
  floor: 0x344239,
  wall: 0x515e51,
  shadow: 0x151b18,
});

export function addPanel(scene, x, y, width, height, options = {}) {
  const graphics = scene.add.graphics();
  graphics.fillStyle(options.fill ?? COLORS.panel, 1);
  graphics.fillRect(x, y, width, height);
  graphics.lineStyle(options.lineWidth ?? 2, options.stroke ?? COLORS.line, 1);
  graphics.strokeRect(x, y, width, height);
  if (options.accent !== false) {
    graphics.fillStyle(options.accentColor ?? COLORS.gold, 1);
    graphics.fillRect(x, y, 34, 3);
  }
  return graphics;
}

export function addLabel(scene, text, x, y, options = {}) {
  const requestedSize = Number.parseFloat(options.size ?? '14px');
  return scene.add.text(x, y, text, {
    fontFamily: options.display ? 'Georgia, serif' : 'Segoe UI, Trebuchet MS, sans-serif',
    fontSize: `${requestedSize * 1.15}px`,
    color: options.color ?? '#e4dec8',
    fontStyle: options.bold ? 'bold' : 'normal',
    letterSpacing: 0,
    lineSpacing: options.lineSpacing ?? 5,
    wordWrap: options.wrapWidth ? { width: options.wrapWidth } : undefined,
    align: options.align ?? 'left',
  }).setResolution(2);
}

export function addButton(scene, x, y, width, height, label, onClick, options = {}) {
  const bg = scene.add.rectangle(x, y, width, height, options.fill ?? COLORS.panelRaised)
    .setStrokeStyle(1, options.stroke ?? COLORS.line)
    .setInteractive({ useHandCursor: true });
  const text = addLabel(scene, label, x, y, {
    size: options.size ?? '13px',
    color: options.textColor ?? '#e4dec8',
    bold: options.bold ?? false,
    align: 'center',
  }).setOrigin(0.5);

  bg.on('pointerover', () => bg.setFillStyle(options.hoverFill ?? 0x35443b));
  bg.on('pointerout', () => bg.setFillStyle(options.fill ?? COLORS.panelRaised));
  bg.on('pointerdown', onClick);
  return { bg, text };
}

export function addMeter(scene, x, y, width, label, value, max, color) {
  addLabel(scene, `${label}  ${value}/${max}`, x, y, { size: '12px', color: '#c7c8b2' });
  scene.add.rectangle(x + width / 2, y + 24, width, 10, COLORS.shadow).setOrigin(0.5);
  const ratio = max > 0 ? Phaser.Math.Clamp(value / max, 0, 1) : 0;
  if (ratio > 0) {
    scene.add.rectangle(x, y + 24, width * ratio, 10, color).setOrigin(0, 0.5);
  }
  scene.add.rectangle(x + width / 2, y + 24, width, 10).setOrigin(0.5).setStrokeStyle(1, COLORS.line);
}