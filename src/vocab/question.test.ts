import { describe, it, expect } from 'vitest';
import { generateQuestion } from './question';
import { WordPair } from './dictionary';

const DICT: WordPair[] = [
  { en: 'cat', ru: 'кот' },
  { en: 'dog', ru: 'собака' },
  { en: 'house', ru: 'дом' },
  { en: 'water', ru: 'вода' },
  { en: 'tree', ru: 'дерево' },
];

describe('generateQuestion', () => {
  it('en-ru: prompts with English, correct is its Russian', () => {
    const q = generateQuestion(DICT, () => 0); // rng=0 → первое слово, direction en-ru
    expect(q.direction).toBe('en-ru');
    expect(q.prompt).toBe('cat');
    expect(q.correct).toBe('кот');
  });

  it('always yields exactly 4 unique options including the correct one', () => {
    for (let i = 0; i < 20; i++) {
      const rng = () => (i % 7) / 7; // разные, но детерминированные значения
      const q = generateQuestion(DICT, rng);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
    }
  });

  it('returns exactly 4 unique options even when dict has duplicate translations', () => {
    // Two entries share the same Russian translation ('вода') — synonym duplicates.
    // The correct answer for 'sun' is 'солнце' (not the duplicated value).
    const dictWithDupes: WordPair[] = [
      { en: 'sun', ru: 'солнце' },
      { en: 'water', ru: 'вода' },
      { en: 'flood', ru: 'вода' }, // duplicate ru translation
      { en: 'cat', ru: 'кот' },
      { en: 'dog', ru: 'собака' },
    ];
    // rng() = 0 → direction en-ru, word index 0 → 'sun' / 'солнце'
    const q = generateQuestion(dictWithDupes, () => 0);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options).toContain(q.correct);
  });

  it('ru-en direction prompts with Russian, correct is English', () => {
    // подобранный rng, дающий direction ru-en; см. реализацию для порядка вызовов rng
    const seq = [0.99, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let k = 0;
    const rng = () => seq[k++ % seq.length];
    const q = generateQuestion(DICT, rng);
    expect(q.direction).toBe('ru-en');
    expect(DICT.some((w) => w.ru === q.prompt && w.en === q.correct)).toBe(true);
  });
});
