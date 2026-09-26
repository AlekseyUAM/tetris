import { describe, it, expect } from 'vitest';
import { Game } from './game';
import { getCells } from '../engine/pieces';
import { BOARD_WIDTH } from '../engine/types';

describe('Game — playing phase', () => {
  it('starts playing with a current piece and a next type', () => {
    const g = new Game({ rng: () => 0 });
    expect(g.phase).toBe('playing');
    expect(g.current).toBeTruthy();
    expect(g.next).toBeTruthy();
    expect(g.score).toBe(0);
    expect(g.level).toBe(1);
  });

  it('moves the current piece left and right within bounds', () => {
    const g = new Game({ rng: () => 0 });
    const startCol = g.current.col;
    g.moveRight();
    expect(g.current.col).toBe(startCol + 1);
    g.moveLeft();
    expect(g.current.col).toBe(startCol);
  });

  it('step moves the piece down by one row', () => {
    const g = new Game({ rng: () => 0 });
    const startRow = g.current.row;
    g.step();
    expect(g.current.row).toBe(startRow + 1);
  });

  it('locks the piece and spawns a new one when it cannot fall further', () => {
    const g = new Game({ rng: () => 0 });
    // шагаем, пока первая фигура не зафиксируется (поле перестанет быть пустым)
    let guard = 0;
    while (g.board.grid.flat().every((c) => c === null) && g.phase === 'playing' && guard < 100) {
      g.step();
      guard++;
    }
    // фиксация произошла; spawnNext создал новую фигуру у верха
    expect(g.phase).toBe('playing');
    expect(g.board.grid.flat().some((c) => c !== null)).toBe(true);
    expect(g.current.row).toBe(0);
  });

  it('hardDrop drops the piece to the bottom and locks it', () => {
    const g = new Game({ rng: () => 0 });
    g.hardDrop();
    // хотя бы одна клетка нижней области занята
    const occupied = g.board.grid.flat().filter((c) => c !== null).length;
    expect(occupied).toBe(4);
  });

  it('rotate keeps the piece in a valid position', () => {
    const g = new Game({ rng: () => 0 });
    g.rotate();
    expect(g.current.rotation).toBeGreaterThanOrEqual(0);
    expect(g.current.rotation).toBeLessThan(4);
  });

  it('enters question phase when a locked piece completes a line', () => {
    const g = new Game({ rng: () => 0 });
    // заполнить нижнюю строку кроме одной клетки, затем ронять фигуру в дыру
    for (let col = 0; col < BOARD_WIDTH; col++) g.board.grid[19][col] = 'I';
    g.board.grid[19][0] = null;
    // поставить текущую фигуру так, чтобы закрыть дыру
    g.current = { type: 'I', rotation: 1, row: 16, col: -2 }; // вертикальная I в столбце 0
    expect(getCells(g.current).some((c) => c.col === 0)).toBe(true);
    g.hardDrop();
    expect(g.phase).toBe('question');
    expect(g.questionQueue.length).toBeGreaterThanOrEqual(1);
    expect(g.activeQuestion).not.toBeNull();
  });

  it('ends the game when a new piece cannot spawn', () => {
    const g = new Game({ rng: () => 0 });
    // заполнить верхние строки, чтобы спавн был невозможен
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < BOARD_WIDTH; col++) g.board.grid[row][col] = 'I';
    g.hardDrop();
    expect(g.phase).toBe('gameover');
  });
});
