import { WordPair } from './dictionary';

export type Direction = 'en-ru' | 'ru-en';

export interface Question {
  direction: Direction;
  prompt: string;
  correct: string;
  options: string[];
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateQuestion(dict: WordPair[], rng: () => number = Math.random): Question {
  const direction: Direction = rng() < 0.5 ? 'en-ru' : 'ru-en';
  const word = pick(dict, rng);

  const prompt = direction === 'en-ru' ? word.en : word.ru;
  const correct = direction === 'en-ru' ? word.ru : word.en;
  const answerOf = (w: WordPair) => (direction === 'en-ru' ? w.ru : w.en);

  const distractorPool = [...new Set(
    dict.filter((w) => answerOf(w) !== correct).map(answerOf),
  )];

  const distractors: string[] = [];
  while (distractors.length < 3 && distractorPool.length > 0) {
    const idx = Math.floor(rng() * distractorPool.length);
    const [d] = distractorPool.splice(idx, 1);
    if (!distractors.includes(d)) distractors.push(d);
  }

  const options = [correct, ...distractors];
  // перемешать варианты
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { direction, prompt, correct, options };
}
