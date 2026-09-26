import { describe, it, expect } from 'vitest';
import { isValidPosition } from './collision';
import { CellValue, Grid, BOARD_WIDTH, BOARD_HEIGHT } from './types';

function emptyGrid(): Grid {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null as CellValue),
  );
}

describe('isValidPosition', () => {
  it('accepts cells inside an empty grid', () => {
    expect(isValidPosition(emptyGrid(), [{ row: 0, col: 0 }, { row: 5, col: 9 }])).toBe(true);
  });

  it('rejects cells past the left/right/bottom edges', () => {
    const g = emptyGrid();
    expect(isValidPosition(g, [{ row: 0, col: -1 }])).toBe(false);
    expect(isValidPosition(g, [{ row: 0, col: BOARD_WIDTH }])).toBe(false);
    expect(isValidPosition(g, [{ row: BOARD_HEIGHT, col: 0 }])).toBe(false);
  });

  it('rejects cells overlapping an occupied cell', () => {
    const g = emptyGrid();
    g[3][4] = 'T';
    expect(isValidPosition(g, [{ row: 3, col: 4 }])).toBe(false);
  });

  it('allows cells above the top (negative row) for spawn overflow', () => {
    expect(isValidPosition(emptyGrid(), [{ row: -1, col: 4 }])).toBe(true);
  });
});
