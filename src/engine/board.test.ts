import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { BOARD_WIDTH, BOARD_HEIGHT } from './types';

function fillRow(board: Board, row: number) {
  for (let col = 0; col < BOARD_WIDTH; col++) board.grid[row][col] = 'I';
}

describe('Board', () => {
  it('starts empty', () => {
    const b = new Board();
    expect(b.grid.length).toBe(BOARD_HEIGHT);
    expect(b.grid[0].length).toBe(BOARD_WIDTH);
    expect(b.grid.flat().every((c) => c === null)).toBe(true);
  });

  it('locks a piece into the grid', () => {
    const b = new Board();
    b.lockPiece([{ row: 1, col: 2 }, { row: 1, col: 3 }], 'S');
    expect(b.grid[1][2]).toBe('S');
    expect(b.grid[1][3]).toBe('S');
  });

  it('finds full lines', () => {
    const b = new Board();
    fillRow(b, 19);
    fillRow(b, 17);
    expect(b.getFullLines()).toEqual([17, 19]);
  });

  it('clears lines and shifts everything above down', () => {
    const b = new Board();
    b.grid[18][0] = 'T';   // маркер над заполняемой строкой
    fillRow(b, 19);
    b.clearLines([19]);
    expect(b.getFullLines()).toEqual([]);
    expect(b.grid[19][0]).toBe('T'); // маркер съехал на одну строку вниз
    expect(b.grid[0].every((c) => c === null)).toBe(true);
  });

  it('clears multiple non-adjacent lines at once', () => {
    const b = new Board();
    fillRow(b, 17);
    fillRow(b, 19);
    b.clearLines([17, 19]);
    expect(b.grid.flat().every((c) => c === null)).toBe(true);
  });
});
