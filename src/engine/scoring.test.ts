import { describe, it, expect } from 'vitest';
import { lineScore, levelForLines, dropInterval, WRONG_ANSWER_PENALTY } from './scoring';

describe('scoring', () => {
  it('scores a cleared line by level', () => {
    expect(lineScore(1)).toBe(100);
    expect(lineScore(3)).toBe(300);
  });

  it('raises the level every 10 lines, starting at 1', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it('drop interval shrinks with level but never below 100ms', () => {
    expect(dropInterval(1)).toBe(800);
    expect(dropInterval(2)).toBeLessThan(dropInterval(1));
    expect(dropInterval(50)).toBe(100);
  });

  it('exposes a fixed wrong-answer penalty', () => {
    expect(WRONG_ANSWER_PENALTY).toBe(50);
  });
});
