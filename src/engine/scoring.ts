export const WRONG_ANSWER_PENALTY = 50;

export function lineScore(level: number): number {
  return 100 * level;
}

export function levelForLines(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

export function dropInterval(level: number): number {
  return Math.max(100, 800 - (level - 1) * 70);
}
