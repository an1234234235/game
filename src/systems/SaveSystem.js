const STORAGE_PREFIX = 'lanternfall-save:';

function getStorage() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  if (globalThis.localStorage) {
    return globalThis.localStorage;
  }

  if (!globalThis.__LANTERNFALL_MEMORY__) {
    globalThis.__LANTERNFALL_MEMORY__ = {};
  }

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(globalThis.__LANTERNFALL_MEMORY__, key)
        ? globalThis.__LANTERNFALL_MEMORY__[key]
        : null;
    },
    setItem(key, value) {
      globalThis.__LANTERNFALL_MEMORY__[key] = String(value);
    },
    removeItem(key) {
      delete globalThis.__LANTERNFALL_MEMORY__[key];
    },
  };
}

export function saveGameState(gameState, slot = 'default') {
  const storage = getStorage();
  if (!storage) return null;

  storage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(gameState));
  return gameState;
}

export function loadGameState(slot = 'default') {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(`${STORAGE_PREFIX}${slot}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave(slot = 'default') {
  return Boolean(loadGameState(slot));
}

export function clearSave(slot = 'default') {
  const storage = getStorage();
  if (!storage) return false;
  storage.removeItem(`${STORAGE_PREFIX}${slot}`);
  return true;
}
