const KEY = 'tetris-vocab-highscore';

function store(explicit?: Storage): Storage | null {
  if (explicit) return explicit;
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function loadHighScore(storage?: Storage): number {
  const s = store(storage);
  if (!s) return 0;
  const raw = s.getItem(KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function saveHighScore(score: number, storage?: Storage): number {
  const s = store(storage);
  const current = loadHighScore(storage);
  const best = Math.max(current, score);
  if (s) s.setItem(KEY, String(best));
  return best;
}
