import { describe, it, expect } from 'vitest';
import { loadHighScore, saveHighScore } from './storage';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('high score storage', () => {
  it('returns 0 when nothing is stored', () => {
    expect(loadHighScore(fakeStorage())).toBe(0);
  });

  it('saves and loads a high score', () => {
    const s = fakeStorage();
    saveHighScore(1200, s);
    expect(loadHighScore(s)).toBe(1200);
  });

  it('keeps the higher score only', () => {
    const s = fakeStorage();
    saveHighScore(1000, s);
    const kept = saveHighScore(500, s);
    expect(kept).toBe(1000);
    expect(loadHighScore(s)).toBe(1000);
  });
});
