import { Board } from '../engine/board';
import { Bag } from '../engine/bag';
import { createPiece, getCells, Piece } from '../engine/pieces';
import { isValidPosition } from '../engine/collision';
import { PieceType } from '../engine/types';
import { generateQuestion, Question } from '../vocab/question';
import { DICTIONARY } from '../vocab/dictionary';
import { lineScore, WRONG_ANSWER_PENALTY, levelForLines } from '../engine/scoring';

export type Phase = 'playing' | 'question' | 'resolving' | 'gameover';

export interface PendingQuestion {
  row: number;
  question: Question;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  done: boolean;
}

export interface GameOptions {
  rng?: () => number;
}

export class Game {
  board = new Board();
  current: Piece;
  next: PieceType;
  phase: Phase = 'playing';
  score = 0;
  level = 1;
  linesCleared = 0;
  questionQueue: PendingQuestion[] = [];
  activeQuestion: PendingQuestion | null = null;

  private rng: () => number;
  private bag: Bag;
  // состояние разрешения вопросов — используется в Task 9
  protected correctRows: number[] = [];
  protected queueIndex = 0;

  constructor(opts: GameOptions = {}) {
    this.rng = opts.rng ?? Math.random;
    this.bag = new Bag(this.rng);
    this.current = createPiece(this.bag.next());
    this.next = this.bag.next();
  }

  private tryMove(dRow: number, dCol: number): boolean {
    const moved = { ...this.current, row: this.current.row + dRow, col: this.current.col + dCol };
    if (isValidPosition(this.board.grid, getCells(moved))) {
      this.current = moved;
      return true;
    }
    return false;
  }

  moveLeft(): void {
    if (this.phase === 'playing') this.tryMove(0, -1);
  }

  moveRight(): void {
    if (this.phase === 'playing') this.tryMove(0, 1);
  }

  rotate(): void {
    if (this.phase !== 'playing') return;
    const rotated = { ...this.current, rotation: (this.current.rotation + 1) % 4 };
    if (isValidPosition(this.board.grid, getCells(rotated))) this.current = rotated;
  }

  softDrop(): void {
    if (this.phase !== 'playing') return;
    if (!this.tryMove(1, 0)) this.lock();
  }

  step(): void {
    if (this.phase !== 'playing') return;
    if (!this.tryMove(1, 0)) this.lock();
  }

  hardDrop(): void {
    if (this.phase !== 'playing') return;
    while (this.tryMove(1, 0)) { /* падаем до упора */ }
    this.lock();
  }

  private lock(): void {
    const before = new Set(this.board.getFullLines());
    this.board.lockPiece(getCells(this.current), this.current.type);
    const full = this.board.getFullLines().filter((row) => !before.has(row));
    if (full.length > 0) {
      this.correctRows = [];
      this.queueIndex = 0;
      this.questionQueue = full.map((row) => ({
        row,
        question: generateQuestion(DICTIONARY, this.rng),
      }));
      this.activeQuestion = this.questionQueue[0];
      this.phase = 'question';
    } else {
      this.spawnNext();
    }
  }

  protected spawnNext(): void {
    this.current = createPiece(this.next);
    this.next = this.bag.next();
    this.phase = isValidPosition(this.board.grid, getCells(this.current)) ? 'playing' : 'gameover';
  }

  pendingClears(): number[] {
    return [...this.correctRows];
  }

  answer(optionIndex: number): AnswerResult {
    if (this.phase !== 'question' || !this.activeQuestion) {
      return { correct: false, correctAnswer: '', done: true };
    }
    const q = this.activeQuestion.question;
    const chosen = optionIndex >= 0 && optionIndex < q.options.length ? q.options[optionIndex] : undefined;
    const correct = chosen === q.correct;

    if (correct) {
      this.correctRows.push(this.activeQuestion.row);
      this.score += lineScore(this.level);
    } else {
      this.score = Math.max(0, this.score - WRONG_ANSWER_PENALTY);
    }

    this.queueIndex += 1;
    let done = false;
    if (this.queueIndex < this.questionQueue.length) {
      this.activeQuestion = this.questionQueue[this.queueIndex];
    } else {
      this.activeQuestion = null;
      this.phase = 'resolving';
      done = true;
    }
    return { correct, correctAnswer: q.correct, done };
  }

  resolve(): void {
    if (this.phase !== 'resolving') return;
    this.board.clearLines(this.correctRows);
    this.linesCleared += this.correctRows.length;
    this.level = levelForLines(this.linesCleared);
    this.correctRows = [];
    this.questionQueue = [];
    this.queueIndex = 0;
    this.activeQuestion = null;
    this.spawnNext();
  }
}
