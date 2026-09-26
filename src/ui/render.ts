import { Board } from '../engine/board';
import { Piece, getCells, COLORS } from '../engine/pieces';
import { BOARD_WIDTH, BOARD_HEIGHT, CellValue } from '../engine/types';

function drawCell(ctx: CanvasRenderingContext2D, row: number, col: number, color: string, size: number): void {
  const x = col * size;
  const y = row * size;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  current: Piece | null,
  cellSize: number,
): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, BOARD_WIDTH * cellSize, BOARD_HEIGHT * cellSize);

  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const v: CellValue = board.grid[row][col];
      if (v) drawCell(ctx, row, col, COLORS[v], cellSize);
    }
  }

  if (current) {
    for (const c of getCells(current)) {
      if (c.row >= 0) drawCell(ctx, c.row, c.col, COLORS[current.type], cellSize);
    }
  }
}
