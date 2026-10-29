# Lanternfall RPG

A dark fantasy turn-based dungeon exploration RPG application built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Story & Menus**: Title screen with New Game, Continue (persistent save state support), and lore introduction featuring Aster Vale.
- **Dungeon Exploration**:
  - 14x9 tactical floor map with walls, chests, NPCs, monsters, and sealed boss chambers.
  - Multi-input controls: WASD / Arrow keys, tile clicking, and on-screen directional buttons.
  - Nearby detection radar with proximity interaction (`[E]` key or interactive button).
  - Field panels: Live Adventurer vitals (HP/MP bars), Party Roster, Inventory modal, Formation overview, 5-Floor World Map, and Pause menu.
- **Turn-Based Tactical Combat**:
  - Full party representation (Warrior, Ranger, Mage) facing up to 3 monsters or formidable bosses.
  - Animated pixel art spritesheets (8-frame idle cycles) and crisp retro static enemy sprites.
  - Dynamic initiative turn order ordered by Speed (SPD).
  - Combat commands: Attack, Skill (Power Strike), Magic (Ember), Item (Potion healing), Guard (damage reduction), and Run.
  - Live combat action log and post-battle resolution (Replay or Return to Dungeon).
- **5 Mysterious Tower Floors**:
  - Floor 1: The Sunken Archive (Boss: Ice King)
  - Floor 2: Ashen Vaults (Boss: Ember Warden)
  - Floor 3: Frostglass Catacombs (Boss: Frost Queen)
  - Floor 4: Root of the Hollow (Boss: Thorn Sentinel)
  - Floor 5: Crown of Lanternfall (Boss: Lantern King)
- **Persistence**: Automatic game save and resume backed by localStorage.

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run test suite:

```bash
npm test
```