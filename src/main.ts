import { Game } from './game/game';
import { drawBoard } from './ui/render';
import { attachTouchInput } from './ui/input';
import { QuestionOverlay } from './ui/question-overlay';
import { animateLineClear } from './ui/animations';
import { dropInterval } from './engine/scoring';
import { loadHighScore, saveHighScore } from './storage/storage';
import { BOARD_WIDTH, BOARD_HEIGHT } from './engine/types';

const CELL = Math.floor(Math.min(window.innerWidth / BOARD_WIDTH, (window.innerHeight * 0.8) / BOARD_HEIGHT));

const canvas = document.getElementById('board') as HTMLCanvasElement;
canvas.width = BOARD_WIDTH * CELL;
canvas.height = BOARD_HEIGHT * CELL;
const ctx = canvas.getContext('2d')!;

const scoreEl = document.getElementById('score')!;
const levelEl = document.getElementById('level')!;
const bestEl = document.getElementById('best')!;

const game = new Game();
const overlay = new QuestionOverlay(document.getElementById('app')!);
let best = loadHighScore();
bestEl.textContent = String(best);

attachTouchInput(canvas, {
  onLeft: () => game.moveLeft(),
  onRight: () => game.moveRight(),
  onRotate: () => game.rotate(),
  onSoftDrop: () => game.softDrop(),
  onHardDrop: () => game.hardDrop(),
});

// клавиатура для отладки на десктопе
window.addEventListener('keydown', (e) => {
  if (game.phase !== 'playing') return;
  if (e.key === 'ArrowLeft') game.moveLeft();
  else if (e.key === 'ArrowRight') game.moveRight();
  else if (e.key === 'ArrowUp') game.rotate();
  else if (e.key === 'ArrowDown') game.softDrop();
  else if (e.key === ' ') game.hardDrop();
});

let lastDrop = performance.now();
let overlayShown = false;
let animating = false;
let feedbackActive = false;
let gameoverRendered = false;

function syncHud(): void {
  scoreEl.textContent = String(game.score);
  levelEl.textContent = String(game.level);
  if (game.score > best) {
    best = saveHighScore(game.score);
    bestEl.textContent = String(best);
  }
}

function loop(now: number): void {
  if (game.phase === 'playing') {
    overlayShown = false;
    if (now - lastDrop >= dropInterval(game.level)) {
      game.step();
      lastDrop = now;
    }
    drawBoard(ctx, game.board, game.current, CELL);
  } else if (game.phase === 'question') {
    drawBoard(ctx, game.board, null, CELL);
    if (!overlayShown && game.activeQuestion) {
      overlayShown = true;
      const q = game.activeQuestion.question;
      const submit = (index: number) => {
        const res = game.answer(index);
        overlay.showFeedback(res.correct, res.correctAnswer);
        feedbackActive = true;
        window.setTimeout(() => {
          overlay.hide();
          overlayShown = false;
          feedbackActive = false;
        }, 1500);
      };
      overlay.show(q, { onAnswer: submit, onTimeout: () => submit(-1) });
    }
  } else if (game.phase === 'resolving') {
    drawBoard(ctx, game.board, null, CELL);
    // Ждём, пока скроется оверлей обратной связи (feedbackActive), иначе анимация
    // сгорания идёт под непрозрачным оверлеем и не видна, а игра возобновляется
    // под перекрытием.
    if (!animating && !feedbackActive) {
      animating = true;
      const rows = game.pendingClears();
      animateLineClear(ctx, rows, CELL, () => {
        game.resolve();
        lastDrop = performance.now();
        animating = false;
      });
    }
  } else if (game.phase === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = `${CELL}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    gameoverRendered = true;
  }

  syncHud();
  if (!gameoverRendered) requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// регистрация service worker (Task 16)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* офлайн необязателен */ });
  });
}
