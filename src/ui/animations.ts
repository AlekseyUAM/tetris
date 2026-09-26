import { BOARD_WIDTH } from '../engine/types';

const FLASH_MS = 250;

export function animateLineClear(
  ctx: CanvasRenderingContext2D,
  rows: number[],
  cellSize: number,
  onDone: () => void,
): void {
  if (rows.length === 0) {
    onDone();
    return;
  }
  const start = performance.now();
  const step = () => {
    const t = (performance.now() - start) / FLASH_MS;
    if (t >= 1) {
      onDone();
      return;
    }
    // мигающая белая заливка поверх сгорающих строк
    const alpha = Math.abs(Math.sin(t * Math.PI * 3));
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    for (const row of rows) {
      ctx.fillRect(0, row * cellSize, BOARD_WIDTH * cellSize, cellSize);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
