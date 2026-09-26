import { describe, it, expect } from 'vitest';
import { Game } from './game';
import { BOARD_WIDTH } from '../engine/types';

function setupOneFullLine(g: Game): void {
  for (let col = 0; col < BOARD_WIDTH; col++) g.board.grid[19][col] = 'I';
  g.board.grid[19][0] = null;
  g.current = { type: 'I', rotation: 1, row: 16, col: -2 }; // вертикальная I в столбце 0
  g.hardDrop();
}

function correctIndex(g: Game): number {
  const q = g.activeQuestion!.question;
  return q.options.indexOf(q.correct);
}

describe('Game — answering questions', () => {
  it('correct answer marks the line to clear and adds score', () => {
    const g = new Game({ rng: () => 0 });
    setupOneFullLine(g);
    expect(g.phase).toBe('question');
    const before = g.score;
    const res = g.answer(correctIndex(g));
    expect(res.correct).toBe(true);
    expect(res.done).toBe(true);
    expect(g.score).toBeGreaterThan(before);
    expect(g.phase).toBe('resolving');
    expect(g.pendingClears()).toEqual([19]);
  });

  it('resolve clears the marked line and resumes play', () => {
    const g = new Game({ rng: () => 0 });
    setupOneFullLine(g);
    g.answer(correctIndex(g));
    g.resolve();
    expect(g.phase).toBe('playing');
    expect(g.linesCleared).toBe(1);
    expect(g.board.getFullLines()).toEqual([]);
  });

  it('wrong answer applies penalty and does NOT clear the line', () => {
    const g = new Game({ rng: () => 0 });
    g.score = 200;
    setupOneFullLine(g);
    const wrong = (correctIndex(g) + 1) % 4;
    const res = g.answer(wrong);
    expect(res.correct).toBe(false);
    expect(res.correctAnswer.length).toBeGreaterThan(0); // правильный ответ отдан для показа
    expect(g.score).toBe(150); // 200 - 50
    expect(g.phase).toBe('resolving');
    expect(g.pendingClears()).toEqual([]);
    g.resolve();
    expect(g.board.getFullLines()).toEqual([19]); // строка осталась заполненной
  });

  it('timeout (index -1) counts as wrong', () => {
    const g = new Game({ rng: () => 0 });
    g.score = 100;
    setupOneFullLine(g);
    const res = g.answer(-1);
    expect(res.correct).toBe(false);
    expect(g.score).toBe(50);
  });

  it('score never drops below zero', () => {
    const g = new Game({ rng: () => 0 });
    g.score = 20;
    setupOneFullLine(g);
    g.answer(-1);
    expect(g.score).toBe(0);
  });

  it('asks one question per completed line; correct clears, wrong stays', () => {
    const g = new Game({ rng: () => 0 });
    // заполнить строки 18 и 19 кроме столбца 0
    for (let col = 1; col < BOARD_WIDTH; col++) {
      g.board.grid[18][col] = 'I';
      g.board.grid[19][col] = 'I';
    }
    // вертикальная I в столбце 0 закрывает обе строки
    g.current = { type: 'I', rotation: 1, row: 16, col: -2 };
    g.hardDrop();
    expect(g.phase).toBe('question');
    expect(g.questionQueue.length).toBe(2);

    // первый вопрос — строка 18 — отвечаем верно
    expect(g.activeQuestion!.row).toBe(18);
    const q1 = g.activeQuestion!.question;
    const r1 = g.answer(q1.options.indexOf(q1.correct));
    expect(r1.correct).toBe(true);
    expect(r1.done).toBe(false);

    // перешли ко второму вопросу — строка 19 — отвечаем неверно (таймаут)
    expect(g.phase).toBe('question');
    expect(g.activeQuestion!.row).toBe(19);
    const r2 = g.answer(-1);
    expect(r2.correct).toBe(false);
    expect(r2.done).toBe(true);

    expect(g.phase).toBe('resolving');
    expect(g.pendingClears()).toEqual([18]);
    expect(g.score).toBe(50); // +100 верный (уровень 1) − 50 штраф

    g.resolve();
    expect(g.linesCleared).toBe(1);
    // строка 18 очищена; строка 19 (неверный ответ) осталась заполненной
    expect(g.board.getFullLines()).toEqual([19]);
  });
});
