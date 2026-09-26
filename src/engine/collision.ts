import { Grid, Point, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export function isValidPosition(grid: Grid, cells: Point[]): boolean {
  for (const { row, col } of cells) {
    if (col < 0 || col >= BOARD_WIDTH) return false;
    if (row >= BOARD_HEIGHT) return false;
    if (row < 0) continue; // над полем — допустимо (спавн)
    if (grid[row][col] !== null) return false;
  }
  return true;
}
