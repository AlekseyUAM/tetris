export interface InputHandlers {
  onLeft(): void;
  onRight(): void;
  onRotate(): void;
  onSoftDrop(): void;
  onHardDrop(): void;
}

const SWIPE_THRESHOLD = 24; // px

export function attachTouchInput(el: HTMLElement, h: InputHandlers): () => void {
  let startX = 0;
  let startY = 0;
  let moved = false;

  const onStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    moved = false;
  };

  const onEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx < SWIPE_THRESHOLD && ady < SWIPE_THRESHOLD) {
      h.onRotate(); // тап
      return;
    }
    if (adx > ady) {
      dx > 0 ? h.onRight() : h.onLeft();
    } else {
      dy > 0 ? h.onSoftDrop() : h.onHardDrop();
    }
    moved = true;
  };

  const prevent = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  };

  el.addEventListener('touchstart', onStart, { passive: true });
  el.addEventListener('touchend', onEnd, { passive: true });
  el.addEventListener('touchmove', prevent, { passive: false });

  return () => {
    el.removeEventListener('touchstart', onStart);
    el.removeEventListener('touchend', onEnd);
    el.removeEventListener('touchmove', prevent);
    void moved;
  };
}
