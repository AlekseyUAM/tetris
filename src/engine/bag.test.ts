import { describe, it, expect } from 'vitest';
import { Bag } from './bag';
import { PieceType } from './types';

const ALL: PieceType[] = ['I','O','T','S','Z','J','L'];

describe('Bag', () => {
  it('produces all 7 types within each group of 7 with no repeats', () => {
    const bag = new Bag(() => 0); // детерминированный rng
    const first = Array.from({ length: 7 }, () => bag.next());
    expect([...first].sort()).toEqual([...ALL].sort());
  });

  it('refills after 7 draws', () => {
    const bag = new Bag(() => 0);
    for (let i = 0; i < 7; i++) bag.next();
    const second = Array.from({ length: 7 }, () => bag.next());
    expect([...second].sort()).toEqual([...ALL].sort());
  });
});
