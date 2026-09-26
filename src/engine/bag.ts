import { PieceType } from './types';

const ALL: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export class Bag {
  private queue: PieceType[] = [];
  constructor(private rng: () => number = Math.random) {}

  private refill(): void {
    const items = [...ALL];
    // перемешивание Фишера–Йетса на инжектированном rng
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    this.queue = items;
  }

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }
}
