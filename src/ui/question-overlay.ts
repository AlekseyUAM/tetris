import { Question } from '../vocab/question';

export interface OverlayCallbacks {
  onAnswer(index: number): void;
  onTimeout(): void;
}

const ANSWER_MS = 10_000;

export class QuestionOverlay {
  private el: HTMLDivElement;
  private promptEl: HTMLDivElement;
  private optionsEl: HTMLDivElement;
  private fillEl: HTMLDivElement;
  private rafId = 0;
  private timeoutId = 0;
  private startTs = 0;
  private cb: OverlayCallbacks | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'overlay';
    this.el.innerHTML =
      '<div class="prompt"></div>' +
      '<div class="options"></div>' +
      '<div id="timerbar"><div id="timerfill"></div></div>';
    root.appendChild(this.el);
    this.promptEl = this.el.querySelector('.prompt') as HTMLDivElement;
    this.optionsEl = this.el.querySelector('.options') as HTMLDivElement;
    this.fillEl = this.el.querySelector('#timerfill') as HTMLDivElement;
  }

  show(q: Question, cb: OverlayCallbacks): void {
    this.cb = cb;
    this.promptEl.textContent = q.prompt;
    this.optionsEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = opt;
      b.onclick = () => cb.onAnswer(i);
      this.optionsEl.appendChild(b);
    });
    this.el.classList.add('visible');
    this.startTimer();
  }

  private startTimer(): void {
    this.startTs = performance.now();
    const tick = () => {
      const elapsed = performance.now() - this.startTs;
      const ratio = Math.max(0, 1 - elapsed / ANSWER_MS);
      this.fillEl.style.width = `${ratio * 100}%`;
      if (ratio > 0) this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
    this.timeoutId = window.setTimeout(() => this.cb?.onTimeout(), ANSWER_MS);
  }

  private stopTimer(): void {
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.timeoutId);
  }

  showFeedback(correct: boolean, correctAnswer: string): void {
    this.stopTimer();
    const buttons = Array.from(this.optionsEl.querySelectorAll('button.opt')) as HTMLButtonElement[];
    for (const b of buttons) {
      if (b.textContent === correctAnswer) b.classList.add('correct');
      else if (!correct) b.classList.add('wrong');
      b.onclick = null;
    }
  }

  hide(): void {
    this.stopTimer();
    this.el.classList.remove('visible');
  }

  dispose(): void {
    this.stopTimer();
    this.el.remove();
  }
}
