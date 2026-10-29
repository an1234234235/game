import React, { useState } from 'react';
import { GameState, SceneMode, FloorEncounter, EnemyTemplate } from './types/game';
import { createInitialGameState } from './data/gameState';
import { loadGameState, saveGameState } from './systems/SaveSystem';
import { MenuScreen } from './components/MenuScreen';
import { IntroScreen } from './components/IntroScreen';
import { ExplorationScreen } from './components/ExplorationScreen';
import { BattleScreen } from './components/BattleScreen';
import { FloorClearScreen } from './components/FloorClearScreen';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<SceneMode>('menu');
  const [gameState, setGameState] = useState<GameState>(() => {
    return loadGameState('default') || createInitialGameState();
  });

  const [activeBattle, setActiveBattle] = useState<{
    encounter: FloorEncounter;
    enemyGroup: EnemyTemplate[];
  } | null>(null);

  const [floorReward, setFloorReward] = useState<{ xp: number; gold: number }>({ xp: 0, gold: 0 });
  const isOnline = useOnlineStatus();

  // New Game: Fresh state -> Intro story
  const handleNewGame = () => {
    const fresh = createInitialGameState();
    setGameState(fresh);
    saveGameState(fresh, 'default');
    setCurrentScene('intro');
  };

  // Continue: Load saved game or Intro if empty
  const handleContinue = () => {
    const saved = loadGameState('default');
    if (saved) {
      setGameState(saved);
      setCurrentScene('exploration');
    } else {
      handleNewGame();
    }
  };

  // Begin journey from Intro
  const handleBeginJourney = () => {
    const initial = createInitialGameState();
    setGameState(initial);
    saveGameState(initial, 'default');
    setCurrentScene('exploration');
  };

  // Start battle
  const handleStartBattle = (encounter: FloorEncounter, enemyGroup: EnemyTemplate[]) => {
    setActiveBattle({ encounter, enemyGroup });
    setCurrentScene('battle');
  };

  // Return to exploration
  const handleReturnToDungeon = () => {
    setActiveBattle(null);
    setCurrentScene('exploration');
  };

  // Floor cleared
  const handleFloorCleared = (reward: { xp: number; gold: number }) => {
    setFloorReward(reward);
    setCurrentScene('floor-clear');
  };

  // Continue to next floor from FloorClearScreen
  const handleContinueToNextFloor = (nextState: GameState) => {
    setGameState(nextState);
    saveGameState(nextState, 'default');
    setActiveBattle(null);
    setCurrentScene('exploration');
  };

  // Restart current floor
  const handleRestartFloor = () => {
    const restartedState: GameState = {
      ...gameState,
      player: {
        ...gameState.player,
        currentHp: gameState.player.stats.hp,
        currentMp: gameState.player.stats.mp,
        statusEffects: [],
      },
      party: gameState.party.map((m) => ({
        ...m,
        currentHp: m.stats.hp,
        currentMp: m.stats.mp,
        statusEffects: [],
      })),
      dungeon: {
        ...gameState.dungeon,
        playerX: 2,
        playerY: 2,
        enemyDefeated: false,
        defeatedEncounters: [],
      },
    };
    setGameState(restartedState);
    saveGameState(restartedState, 'default');
    setCurrentScene('exploration');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#111716] flex flex-col items-center justify-center font-sans overflow-x-hidden selection:bg-[#d5b66c] selection:text-[#111716]">
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="fixed top-2 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#2a1b1b] border border-[#d36e61] text-[#e89184] text-xs font-mono rounded shadow-lg animate-bounce">
          <WifiOff size={14} />
          <span>Chế độ Ngoại tuyến (Offline Mode) - Dữ liệu vẫn được lưu tự động!</span>
        </div>
      )}

      {/* Main Container: Full viewport on mobile (min-h-[100dvh]), centered card frame on desktop */}
      <main
        className="w-full min-h-[100dvh] lg:min-h-0 lg:h-[720px] lg:max-h-[850px] lg:max-w-[1280px] relative bg-[#111716] lg:shadow-2xl flex flex-col"
        aria-label="Lanternfall RPG React Application"
      >
        {currentScene === 'menu' && (
          <MenuScreen onNewGame={handleNewGame} onContinue={handleContinue} />
        )}

        {currentScene === 'intro' && (
          <IntroScreen
            onBeginJourney={handleBeginJourney}
            onBackToMenu={() => setCurrentScene('menu')}
          />
        )}

        {currentScene === 'exploration' && (
          <ExplorationScreen
            gameState={gameState}
            onUpdateGameState={setGameState}
            onStartBattle={handleStartBattle}
            onReturnToMenu={() => setCurrentScene('menu')}
            onRestartFloor={handleRestartFloor}
          />
        )}

        {currentScene === 'battle' && activeBattle && (
          <BattleScreen
            gameState={gameState}
            encounter={activeBattle.encounter}
            enemyGroup={activeBattle.enemyGroup}
            onUpdateGameState={setGameState}
            onReturnToDungeon={handleReturnToDungeon}
            onFloorCleared={handleFloorCleared}
          />
        )}

        {currentScene === 'floor-clear' && (
          <FloorClearScreen
            gameState={gameState}
            reward={floorReward}
            onContinue={handleContinueToNextFloor}
          />
        )}
      </main>
    </div>
  );
};

export default App;
