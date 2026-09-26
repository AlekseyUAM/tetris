import { CellValue, Grid, PieceType, Point, BOARD_WIDTH, BOARD_HEIGHT } from './types';

function emptyRow(): CellValue[] {
  return Array.from({ length: BOARD_WIDTH }, () => null as CellValue);
}

export class Board {
  grid: Grid;

  constructor() {
    this.grid = Array.from({ length: BOARD_HEIGHT }, () => emptyRow());
  }

  lockPiece(cells: Point[], type: PieceType): void {
    for (const { row, col } of cells) {
      if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
        this.grid[row][col] = type;
      }
    }
  }

  getFullLines(): number[] {
    const full: number[] = [];
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (this.grid[row].every((c) => c !== null)) full.push(row);
    }
    return full;
  }

  clearLines(rows: number[]): void {
    if (rows.length === 0) return;
    const toClear = new Set(rows);
    const kept = this.grid.filter((_, row) => !toClear.has(row));
    const removed = BOARD_HEIGHT - kept.length;
    const fresh = Array.from({ length: removed }, () => emptyRow());
    this.grid = [...fresh, ...kept];
  }
}
