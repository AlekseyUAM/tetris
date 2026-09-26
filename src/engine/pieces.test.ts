import { describe, it, expect } from 'vitest';
import { createPiece, getCells, SHAPES, COLORS } from './pieces';

describe('pieces', () => {
  it('spawns a piece at the top center', () => {
    const p = createPiece('T');
    expect(p).toMatchObject({ type: 'T', rotation: 0, row: 0, col: 3 });
  });

  it('every piece has 4 rotation states of 4 cells each', () => {
    for (const states of Object.values(SHAPES)) {
      expect(states).toHaveLength(4);
      for (const state of states) expect(state).toHaveLength(4);
    }
  });

  it('getCells offsets shape cells by piece origin', () => {
    const p = { type: 'O' as const, rotation: 0, row: 5, col: 4 };
    const cells = getCells(p);
    // O в состоянии 0 занимает (0,1)(0,2)(1,1)(1,2)
    expect(cells).toEqual([
      { row: 5, col: 5 }, { row: 5, col: 6 },
      { row: 6, col: 5 }, { row: 6, col: 6 },
    ]);
  });

  it('has a distinct colour per piece type', () => {
    expect(Object.keys(COLORS).sort()).toEqual(['I','J','L','O','S','T','Z']);
    expect(new Set(Object.values(COLORS)).size).toBe(7);
  });
});
