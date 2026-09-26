# Тетрис-словарь — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать PWA-игру: классический тетрис с разноцветными фигурами, где заполненная линия сгорает только после правильного ответа на вопрос-перевод слова.

**Architecture:** Чистая игровая логика (`engine/`, `vocab/`, `game/`) отделена от слоя отрисовки/ввода (`ui/`) и хранилища (`storage/`). Ядро — детерминированные функции и классы без DOM, покрытые юнит-тестами (Vitest). UI на HTML5 Canvas + DOM-оверлей для вопросов; тесты UI — ручные в браузере.

**Tech Stack:** TypeScript, Vite, Vitest, HTML5 Canvas, PWA (manifest + service worker).

## Global Constraints

- Язык кода — **TypeScript** (strict). Без UI-фреймворков (нет React/Vue/Svelte/Phaser).
- Поле — **10 столбцов × 20 строк** (`BOARD_WIDTH = 10`, `BOARD_HEIGHT = 20`).
- Сетка индексируется `grid[row][col]`, `row = 0` — верх.
- Тип клетки: `CellValue = PieceType | null` (`null` — пусто).
- Точка: `Point = { row: number; col: number }`.
- 7 тетромино с классическими цветами: I `#00f0f0`, O `#f0f000`, T `#a000f0`, S `#00f000`, Z `#f00000`, J `#0000f0`, L `#f0a000`.
- Таймер ответа — **10 секунд**; истечение = неверный ответ.
- Штраф за неверный ответ — **50 очков** (`WRONG_ANSWER_PENALTY = 50`), счёт не уходит ниже 0.
- Направление вопроса (`en-ru` / `ru-en`) и дистракторы выбираются случайно; в тестах случайность инжектируется через параметр `rng: () => number`.
- Ориентация — portrait. Управление сенсорное.
- Детерминизм ядра: никакого прямого `Math.random()`/`Date.now()` в `engine`/`vocab`/`game` — только инжектируемый `rng` и передаваемое время.

---

### Task 1: Настройка проекта (Vite + TypeScript + Vitest)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/sanity.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: рабочие команды `npm run dev`, `npm test`, `npm run build`.

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "tetris-vocab",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Создать `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Создать `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 4: Создать минимальный `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Тетрис-словарь</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Написать проверочный тест `src/sanity.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs the test toolchain', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Установить зависимости и запустить тест**

Run: `npm install && npm test`
Expected: 1 passed. (`src/main.ts` ещё нет — это нормально, тесты не импортируют его.)

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/sanity.test.ts package-lock.json
git commit -m "chore: scaffold Vite + TypeScript + Vitest"
```

---

### Task 2: Типы и тетромино

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/pieces.ts`
- Test: `src/engine/pieces.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `type PieceType = 'I'|'O'|'T'|'S'|'Z'|'J'|'L'`
  - `type CellValue = PieceType | null`
  - `type Grid = CellValue[][]`
  - `interface Point { row: number; col: number }`
  - `const BOARD_WIDTH = 10`, `const BOARD_HEIGHT = 20`
  - `const COLORS: Record<PieceType, string>`
  - `const SHAPES: Record<PieceType, Point[][]>` (4 состояния поворота на фигуру)
  - `interface Piece { type: PieceType; rotation: number; row: number; col: number }`
  - `function createPiece(type: PieceType): Piece` — спавн `rotation: 0, row: 0, col: 3`
  - `function getCells(piece: Piece): Point[]` — абсолютные координаты клеток

- [ ] **Step 1: Написать падающий тест `src/engine/pieces.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createPiece, getCells, SHAPES, COLORS } from './pieces';

describe('pieces', () => {
  it('spawns a piece at the top center', () => {
    const p = createPiece('T');
    expect(p).toMatchObject({ type: 'T', rotation: 0, row: 0, col: 3 });
  });

  it('every piece has 4 rotation states of 4 cells each', () => {
    for (const states of Object.values(SHAPES)) {
      expect(states).toHaveLength(4);
      for (const state of states) expect(state).toHaveLength(4);
    }
  });

  it('getCells offsets shape cells by piece origin', () => {
    const p = { type: 'O' as const, rotation: 0, row: 5, col: 4 };
    const cells = getCells(p);
    // O в состоянии 0 занимает (0,1)(0,2)(1,1)(1,2)
    expect(cells).toEqual([
      { row: 5, col: 5 }, { row: 5, col: 6 },
      { row: 6, col: 5 }, { row: 6, col: 6 },
    ]);
  });

  it('has a distinct colour per piece type', () => {
    expect(Object.keys(COLORS).sort()).toEqual(['I','J','L','O','S','T','Z']);
    expect(new Set(Object.values(COLORS)).size).toBe(7);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- pieces`
Expected: FAIL — `Cannot find module './pieces'`.

- [ ] **Step 3: Создать `src/engine/types.ts`**

```ts
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type CellValue = PieceType | null;
export type Grid = CellValue[][];

export interface Point {
  row: number;
  col: number;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};
```

- [ ] **Step 4: Создать `src/engine/pieces.ts`**

```ts
import { PieceType, Point, COLORS } from './types';

export { COLORS };

export interface Piece {
  type: PieceType;
  rotation: number;
  row: number;
  col: number;
}

const p = (row: number, col: number): Point => ({ row, col });

// 4 состояния поворота на фигуру; координаты относительно origin фигуры.
export const SHAPES: Record<PieceType, Point[][]> = {
  I: [
    [p(1,0),p(1,1),p(1,2),p(1,3)],
    [p(0,2),p(1,2),p(2,2),p(3,2)],
    [p(2,0),p(2,1),p(2,2),p(2,3)],
    [p(0,1),p(1,1),p(2,1),p(3,1)],
  ],
  O: [
    [p(0,1),p(0,2),p(1,1),p(1,2)],
    [p(0,1),p(0,2),p(1,1),p(1,2)],
    [p(0,1),p(0,2),p(1,1),p(1,2)],
    [p(0,1),p(0,2),p(1,1),p(1,2)],
  ],
  T: [
    [p(0,1),p(1,0),p(1,1),p(1,2)],
    [p(0,1),p(1,1),p(1,2),p(2,1)],
    [p(1,0),p(1,1),p(1,2),p(2,1)],
    [p(0,1),p(1,0),p(1,1),p(2,1)],
  ],
  S: [
    [p(0,1),p(0,2),p(1,0),p(1,1)],
    [p(0,1),p(1,1),p(1,2),p(2,2)],
    [p(1,1),p(1,2),p(2,0),p(2,1)],
    [p(0,0),p(1,0),p(1,1),p(2,1)],
  ],
  Z: [
    [p(0,0),p(0,1),p(1,1),p(1,2)],
    [p(0,2),p(1,1),p(1,2),p(2,1)],
    [p(1,0),p(1,1),p(2,1),p(2,2)],
    [p(0,1),p(1,0),p(1,1),p(2,0)],
  ],
  J: [
    [p(0,0),p(1,0),p(1,1),p(1,2)],
    [p(0,1),p(0,2),p(1,1),p(2,1)],
    [p(1,0),p(1,1),p(1,2),p(2,2)],
    [p(0,1),p(1,1),p(2,0),p(2,1)],
  ],
  L: [
    [p(0,2),p(1,0),p(1,1),p(1,2)],
    [p(0,1),p(1,1),p(2,1),p(2,2)],
    [p(1,0),p(1,1),p(1,2),p(2,0)],
    [p(0,0),p(0,1),p(1,1),p(2,1)],
  ],
};

export function createPiece(type: PieceType): Piece {
  return { type, rotation: 0, row: 0, col: 3 };
}

export function getCells(piece: Piece): Point[] {
  const state = SHAPES[piece.type][piece.rotation % 4];
  return state.map((c) => ({ row: c.row + piece.row, col: c.col + piece.col }));
}
```

- [ ] **Step 5: Запустить тест — убедиться, что проходит**

Run: `npm test -- pieces`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/pieces.ts src/engine/pieces.test.ts
git commit -m "feat: add board types and tetromino shapes with colours"
```

---

### Task 3: Проверка столкновений

**Files:**
- Create: `src/engine/collision.ts`
- Test: `src/engine/collision.test.ts`

**Interfaces:**
- Consumes: `Grid`, `Point`, `BOARD_WIDTH`, `BOARD_HEIGHT` из `types.ts`.
- Produces: `function isValidPosition(grid: Grid, cells: Point[]): boolean` — `true`, если все клетки в границах и не пересекают занятые.

- [ ] **Step 1: Написать падающий тест `src/engine/collision.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { isValidPosition } from './collision';
import { CellValue, Grid, BOARD_WIDTH, BOARD_HEIGHT } from './types';

function emptyGrid(): Grid {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null as CellValue),
  );
}

describe('isValidPosition', () => {
  it('accepts cells inside an empty grid', () => {
    expect(isValidPosition(emptyGrid(), [{ row: 0, col: 0 }, { row: 5, col: 9 }])).toBe(true);
  });

  it('rejects cells past the left/right/bottom edges', () => {
    const g = emptyGrid();
    expect(isValidPosition(g, [{ row: 0, col: -1 }])).toBe(false);
    expect(isValidPosition(g, [{ row: 0, col: BOARD_WIDTH }])).toBe(false);
    expect(isValidPosition(g, [{ row: BOARD_HEIGHT, col: 0 }])).toBe(false);
  });

  it('rejects cells overlapping an occupied cell', () => {
    const g = emptyGrid();
    g[3][4] = 'T';
    expect(isValidPosition(g, [{ row: 3, col: 4 }])).toBe(false);
  });

  it('allows cells above the top (negative row) for spawn overflow', () => {
    expect(isValidPosition(emptyGrid(), [{ row: -1, col: 4 }])).toBe(true);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- collision`
Expected: FAIL — `Cannot find module './collision'`.

- [ ] **Step 3: Создать `src/engine/collision.ts`**

```ts
import { Grid, Point, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export function isValidPosition(grid: Grid, cells: Point[]): boolean {
  for (const { row, col } of cells) {
    if (col < 0 || col >= BOARD_WIDTH) return false;
    if (row >= BOARD_HEIGHT) return false;
    if (row < 0) continue; // над полем — допустимо (спавн)
    if (grid[row][col] !== null) return false;
  }
  return true;
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- collision`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/collision.ts src/engine/collision.test.ts
git commit -m "feat: add collision detection"
```

---

### Task 4: Доска (фиксация, поиск и удаление линий)

**Files:**
- Create: `src/engine/board.ts`
- Test: `src/engine/board.test.ts`

**Interfaces:**
- Consumes: `Grid`, `CellValue`, `PieceType`, `Point`, `BOARD_WIDTH`, `BOARD_HEIGHT`.
- Produces: класс `Board`:
  - `grid: Grid`
  - `constructor()` — пустая сетка `BOARD_HEIGHT × BOARD_WIDTH`
  - `lockPiece(cells: Point[], type: PieceType): void`
  - `getFullLines(): number[]` — индексы полностью заполненных строк, по возрастанию
  - `clearLines(rows: number[]): void` — удалить строки, сдвинуть верхние вниз, добить пустыми сверху

- [ ] **Step 1: Написать падающий тест `src/engine/board.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { BOARD_WIDTH, BOARD_HEIGHT } from './types';

function fillRow(board: Board, row: number) {
  for (let col = 0; col < BOARD_WIDTH; col++) board.grid[row][col] = 'I';
}

describe('Board', () => {
  it('starts empty', () => {
    const b = new Board();
    expect(b.grid.length).toBe(BOARD_HEIGHT);
    expect(b.grid[0].length).toBe(BOARD_WIDTH);
    expect(b.grid.flat().every((c) => c === null)).toBe(true);
  });

  it('locks a piece into the grid', () => {
    const b = new Board();
    b.lockPiece([{ row: 1, col: 2 }, { row: 1, col: 3 }], 'S');
    expect(b.grid[1][2]).toBe('S');
    expect(b.grid[1][3]).toBe('S');
  });

  it('finds full lines', () => {
    const b = new Board();
    fillRow(b, 19);
    fillRow(b, 17);
    expect(b.getFullLines()).toEqual([17, 19]);
  });

  it('clears lines and shifts everything above down', () => {
    const b = new Board();
    b.grid[18][0] = 'T';   // маркер над заполняемой строкой
    fillRow(b, 19);
    b.clearLines([19]);
    expect(b.getFullLines()).toEqual([]);
    expect(b.grid[19][0]).toBe('T'); // маркер съехал на одну строку вниз
    expect(b.grid[0].every((c) => c === null)).toBe(true);
  });

  it('clears multiple non-adjacent lines at once', () => {
    const b = new Board();
    fillRow(b, 17);
    fillRow(b, 19);
    b.clearLines([17, 19]);
    expect(b.grid.flat().every((c) => c === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- board`
Expected: FAIL — `Cannot find module './board'`.

- [ ] **Step 3: Создать `src/engine/board.ts`**

```ts
import { CellValue, Grid, PieceType, Point, BOARD_WIDTH, BOARD_HEIGHT } from './types';

function emptyRow(): CellValue[] {
  return Array.from({ length: BOARD_WIDTH }, () => null as CellValue);
}

export class Board {
  grid: Grid;

  constructor() {
    this.grid = Array.from({ length: BOARD_HEIGHT }, () => emptyRow());
  }

  lockPiece(cells: Point[], type: PieceType): void {
    for (const { row, col } of cells) {
      if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
        this.grid[row][col] = type;
      }
    }
  }

  getFullLines(): number[] {
    const full: number[] = [];
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (this.grid[row].every((c) => c !== null)) full.push(row);
    }
    return full;
  }

  clearLines(rows: number[]): void {
    if (rows.length === 0) return;
    const toClear = new Set(rows);
    const kept = this.grid.filter((_, row) => !toClear.has(row));
    const removed = BOARD_HEIGHT - kept.length;
    const fresh = Array.from({ length: removed }, () => emptyRow());
    this.grid = [...fresh, ...kept];
  }
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- board`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/board.ts src/engine/board.test.ts
git commit -m "feat: add Board with lock, full-line detection and clearing"
```

---

### Task 5: Генератор фигур (7-bag)

**Files:**
- Create: `src/engine/bag.ts`
- Test: `src/engine/bag.test.ts`

**Interfaces:**
- Consumes: `PieceType`.
- Produces: класс `Bag`:
  - `constructor(rng: () => number = Math.random)`
  - `next(): PieceType` — выдаёт фигуры «мешками» по 7 без повторов внутри мешка

- [ ] **Step 1: Написать падающий тест `src/engine/bag.test.ts`**

```ts
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
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- bag`
Expected: FAIL — `Cannot find module './bag'`.

- [ ] **Step 3: Создать `src/engine/bag.ts`**

```ts
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- bag`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/bag.ts src/engine/bag.test.ts
git commit -m "feat: add 7-bag piece generator"
```

---

### Task 6: Очки, уровень, скорость

**Files:**
- Create: `src/engine/scoring.ts`
- Test: `src/engine/scoring.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `const WRONG_ANSWER_PENALTY = 50`
  - `function lineScore(level: number): number` → `100 * level`
  - `function levelForLines(totalLines: number): number` → `floor(totalLines / 10) + 1`
  - `function dropInterval(level: number): number` → мс между шагами гравитации

- [ ] **Step 1: Написать падающий тест `src/engine/scoring.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { lineScore, levelForLines, dropInterval, WRONG_ANSWER_PENALTY } from './scoring';

describe('scoring', () => {
  it('scores a cleared line by level', () => {
    expect(lineScore(1)).toBe(100);
    expect(lineScore(3)).toBe(300);
  });

  it('raises the level every 10 lines, starting at 1', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(25)).toBe(3);
  });

  it('drop interval shrinks with level but never below 100ms', () => {
    expect(dropInterval(1)).toBe(800);
    expect(dropInterval(2)).toBeLessThan(dropInterval(1));
    expect(dropInterval(50)).toBe(100);
  });

  it('exposes a fixed wrong-answer penalty', () => {
    expect(WRONG_ANSWER_PENALTY).toBe(50);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- scoring`
Expected: FAIL — `Cannot find module './scoring'`.

- [ ] **Step 3: Создать `src/engine/scoring.ts`**

```ts
export const WRONG_ANSWER_PENALTY = 50;

export function lineScore(level: number): number {
  return 100 * level;
}

export function levelForLines(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

export function dropInterval(level: number): number {
  return Math.max(100, 800 - (level - 1) * 70);
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- scoring`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/scoring.ts src/engine/scoring.test.ts
git commit -m "feat: add scoring, level and drop-speed rules"
```

---

### Task 7: Словарь и генерация вопросов

**Files:**
- Create: `src/vocab/dictionary.ts`
- Create: `src/vocab/question.ts`
- Test: `src/vocab/question.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `interface WordPair { en: string; ru: string }`
  - `const DICTIONARY: WordPair[]` (стартовый набор; можно расширять позже)
  - `type Direction = 'en-ru' | 'ru-en'`
  - `interface Question { direction: Direction; prompt: string; correct: string; options: string[] }`
  - `function generateQuestion(dict: WordPair[], rng: () => number = Math.random): Question` — 4 варианта (1 верный + 3 дистрактора), перемешаны

- [ ] **Step 1: Написать падающий тест `src/vocab/question.test.ts`**

```ts
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
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- question`
Expected: FAIL — `Cannot find module './question'`.

- [ ] **Step 3: Создать `src/vocab/dictionary.ts`**

```ts
export interface WordPair {
  en: string;
  ru: string;
}

// Стартовый набор частых слов. Расширяется свободно — логика от размера не зависит.
export const DICTIONARY: WordPair[] = [
  { en: 'cat', ru: 'кот' },
  { en: 'dog', ru: 'собака' },
  { en: 'house', ru: 'дом' },
  { en: 'water', ru: 'вода' },
  { en: 'tree', ru: 'дерево' },
  { en: 'book', ru: 'книга' },
  { en: 'car', ru: 'машина' },
  { en: 'sun', ru: 'солнце' },
  { en: 'moon', ru: 'луна' },
  { en: 'friend', ru: 'друг' },
  { en: 'city', ru: 'город' },
  { en: 'road', ru: 'дорога' },
  { en: 'bread', ru: 'хлеб' },
  { en: 'milk', ru: 'молоко' },
  { en: 'apple', ru: 'яблоко' },
  { en: 'window', ru: 'окно' },
  { en: 'door', ru: 'дверь' },
  { en: 'hand', ru: 'рука' },
  { en: 'head', ru: 'голова' },
  { en: 'night', ru: 'ночь' },
];
```

- [ ] **Step 4: Создать `src/vocab/question.ts`**

```ts
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

  const distractorPool = dict
    .filter((w) => answerOf(w) !== correct)
    .map(answerOf);

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
```

- [ ] **Step 5: Запустить тест — убедиться, что проходит**

Run: `npm test -- question`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/vocab/dictionary.ts src/vocab/question.ts src/vocab/question.test.ts
git commit -m "feat: add vocabulary dictionary and question generation"
```

---

### Task 8: Ядро игры — движение, гравитация, фиксация, конец игры

**Files:**
- Create: `src/game/game.ts`
- Test: `src/game/game.test.ts`

**Interfaces:**
- Consumes: `Board`, `Bag`, `createPiece`, `getCells`, `Piece`, `isValidPosition`, `generateQuestion`, `DICTIONARY`.
- Produces: класс `Game`:
  - `type Phase = 'playing' | 'question' | 'resolving' | 'gameover'`
  - `interface PendingQuestion { row: number; question: Question }`
  - Поля: `board: Board`, `current: Piece`, `next: PieceType`, `phase: Phase`, `score: number`, `level: number`, `linesCleared: number`, `questionQueue: PendingQuestion[]`, `activeQuestion: PendingQuestion | null`
  - `constructor(opts?: { rng?: () => number })`
  - `moveLeft(): void`, `moveRight(): void`, `rotate(): void`, `softDrop(): void`, `hardDrop(): void`, `step(): void`
  - (в этой задаче только фаза `playing`; `answer()`/`resolve()` добавляются в Task 9 — объявить как `// добавляется в Task 9`)

- [ ] **Step 1: Написать падающий тест `src/game/game.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { Game } from './game';
import { getCells } from '../engine/pieces';
import { BOARD_WIDTH } from '../engine/types';

describe('Game — playing phase', () => {
  it('starts playing with a current piece and a next type', () => {
    const g = new Game({ rng: () => 0 });
    expect(g.phase).toBe('playing');
    expect(g.current).toBeTruthy();
    expect(g.next).toBeTruthy();
    expect(g.score).toBe(0);
    expect(g.level).toBe(1);
  });

  it('moves the current piece left and right within bounds', () => {
    const g = new Game({ rng: () => 0 });
    const startCol = g.current.col;
    g.moveRight();
    expect(g.current.col).toBe(startCol + 1);
    g.moveLeft();
    expect(g.current.col).toBe(startCol);
  });

  it('step moves the piece down by one row', () => {
    const g = new Game({ rng: () => 0 });
    const startRow = g.current.row;
    g.step();
    expect(g.current.row).toBe(startRow + 1);
  });

  it('locks the piece and spawns a new one when it cannot fall further', () => {
    const g = new Game({ rng: () => 0 });
    // шагаем, пока первая фигура не зафиксируется (поле перестанет быть пустым)
    let guard = 0;
    while (g.board.grid.flat().every((c) => c === null) && g.phase === 'playing' && guard < 100) {
      g.step();
      guard++;
    }
    // фиксация произошла; spawnNext создал новую фигуру у верха
    expect(g.phase).toBe('playing');
    expect(g.board.grid.flat().some((c) => c !== null)).toBe(true);
    expect(g.current.row).toBe(0);
  });

  it('hardDrop drops the piece to the bottom and locks it', () => {
    const g = new Game({ rng: () => 0 });
    g.hardDrop();
    // хотя бы одна клетка нижней области занята
    const occupied = g.board.grid.flat().filter((c) => c !== null).length;
    expect(occupied).toBe(4);
  });

  it('rotate keeps the piece in a valid position', () => {
    const g = new Game({ rng: () => 0 });
    g.rotate();
    expect(g.current.rotation).toBeGreaterThanOrEqual(0);
    expect(g.current.rotation).toBeLessThan(4);
  });

  it('enters question phase when a locked piece completes a line', () => {
    const g = new Game({ rng: () => 0 });
    // заполнить нижнюю строку кроме одной клетки, затем ронять фигуру в дыру
    for (let col = 0; col < BOARD_WIDTH; col++) g.board.grid[19][col] = 'I';
    g.board.grid[19][0] = null;
    // поставить текущую фигуру так, чтобы закрыть дыру
    g.current = { type: 'I', rotation: 1, row: 16, col: -2 }; // вертикальная I в столбце 0
    expect(getCells(g.current).some((c) => c.col === 0)).toBe(true);
    g.hardDrop();
    expect(g.phase).toBe('question');
    expect(g.questionQueue.length).toBeGreaterThanOrEqual(1);
    expect(g.activeQuestion).not.toBeNull();
  });

  it('ends the game when a new piece cannot spawn', () => {
    const g = new Game({ rng: () => 0 });
    // заполнить верхние строки, чтобы спавн был невозможен
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < BOARD_WIDTH; col++) g.board.grid[row][col] = 'I';
    g.hardDrop();
    expect(g.phase).toBe('gameover');
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- game`
Expected: FAIL — `Cannot find module './game'`.

- [ ] **Step 3: Создать `src/game/game.ts`**

```ts
import { Board } from '../engine/board';
import { Bag } from '../engine/bag';
import { createPiece, getCells, Piece } from '../engine/pieces';
import { isValidPosition } from '../engine/collision';
import { PieceType } from '../engine/types';
import { generateQuestion, Question } from '../vocab/question';
import { DICTIONARY } from '../vocab/dictionary';

export type Phase = 'playing' | 'question' | 'resolving' | 'gameover';

export interface PendingQuestion {
  row: number;
  question: Question;
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
    // строки, уже заполненные ДО фиксации (напр. линия, оставшаяся после
    // неверного ответа), не должны повторно вызывать вопрос — берём только
    // линии, завершённые ИМЕННО этой фигурой.
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

  // answer() и resolve() добавляются в Task 9.
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- game`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/game/game.ts src/game/game.test.ts
git commit -m "feat: add game core — movement, gravity, lock, game over"
```

---

### Task 9: Ядро игры — ответы, штрафы, сгорание линий

**Files:**
- Modify: `src/game/game.ts`
- Test: `src/game/answer.test.ts`

**Interfaces:**
- Consumes: всё из Task 8, плюс `lineScore`, `WRONG_ANSWER_PENALTY`.
- Produces (методы `Game`):
  - `interface AnswerResult { correct: boolean; correctAnswer: string; done: boolean }`
  - `answer(optionIndex: number): AnswerResult` — оценить ответ на `activeQuestion`; `optionIndex` вне диапазона (напр. `-1` при таймауте) = неверно. Верно → строка помечается на сгорание и +очки; неверно → штраф. Переходит к следующему вопросу; когда очередь пуста → `phase = 'resolving'`.
  - `resolve(): void` — выполнить сгорание помеченных строк (`board.clearLines`), обновить `linesCleared`/`level`, заспавнить новую фигуру (`spawnNext`), очистить состояние вопросов. Возвращает игру в `playing` (или `gameover`).
  - `pendingClears(): number[]` — строки, ожидающие сгорания в фазе `resolving` (для анимации в UI).

- [ ] **Step 1: Написать падающий тест `src/game/answer.test.ts`**

```ts
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
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- answer`
Expected: FAIL — `g.answer is not a function`.

- [ ] **Step 3: Добавить методы в `src/game/game.ts`**

Добавить импорт вверху файла (в Task 8 из `../engine/scoring` ничего не импортировалось, так что дублей не будет):

```ts
import { lineScore, WRONG_ANSWER_PENALTY, levelForLines } from '../engine/scoring';
```

Добавить интерфейс рядом с `PendingQuestion`:

```ts
export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  done: boolean;
}
```

Добавить методы в класс `Game` (перед закрывающей `}`), заменив комментарий-заглушку из Task 8:

```ts
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- answer`
Expected: PASS (5 tests). Также прогнать всё: `npm test` → все зелёные.

- [ ] **Step 5: Commit**

```bash
git add src/game/game.ts src/game/answer.test.ts
git commit -m "feat: add question answering, penalties and line resolution"
```

---

### Task 10: Хранилище рекорда

**Files:**
- Create: `src/storage/storage.ts`
- Test: `src/storage/storage.test.ts`

**Interfaces:**
- Consumes: ничего (Web Storage API — инжектируется в тестах).
- Produces:
  - `function loadHighScore(storage?: Storage): number`
  - `function saveHighScore(score: number, storage?: Storage): number` — сохраняет только если больше текущего; возвращает актуальный рекорд.

- [ ] **Step 1: Написать падающий тест `src/storage/storage.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { loadHighScore, saveHighScore } from './storage';

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('high score storage', () => {
  it('returns 0 when nothing is stored', () => {
    expect(loadHighScore(fakeStorage())).toBe(0);
  });

  it('saves and loads a high score', () => {
    const s = fakeStorage();
    saveHighScore(1200, s);
    expect(loadHighScore(s)).toBe(1200);
  });

  it('keeps the higher score only', () => {
    const s = fakeStorage();
    saveHighScore(1000, s);
    const kept = saveHighScore(500, s);
    expect(kept).toBe(1000);
    expect(loadHighScore(s)).toBe(1000);
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- storage`
Expected: FAIL — `Cannot find module './storage'`.

- [ ] **Step 3: Создать `src/storage/storage.ts`**

```ts
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
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- storage`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/storage/storage.ts src/storage/storage.test.ts
git commit -m "feat: add high-score persistence"
```

---

### Task 11: Отрисовка поля на Canvas (с цветами)

**Files:**
- Create: `src/ui/render.ts`

**Interfaces:**
- Consumes: `Board`, `Piece`, `getCells`, `COLORS`, `BOARD_WIDTH`, `BOARD_HEIGHT`.
- Produces:
  - `function drawBoard(ctx: CanvasRenderingContext2D, board: Board, current: Piece | null, cellSize: number): void`

> Проверка ручная (визуальная); юнит-теста нет. Реальная проверка — в Task 15, когда игра запускается.

- [ ] **Step 1: Создать `src/ui/render.ts`**

```ts
import { Board } from '../engine/board';
import { Piece, getCells, COLORS } from '../engine/pieces';
import { BOARD_WIDTH, BOARD_HEIGHT, CellValue } from '../engine/types';

function drawCell(ctx: CanvasRenderingContext2D, row: number, col: number, color: string, size: number): void {
  const x = col * size;
  const y = row * size;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  current: Piece | null,
  cellSize: number,
): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, BOARD_WIDTH * cellSize, BOARD_HEIGHT * cellSize);

  for (let row = 0; row < BOARD_HEIGHT; row++) {
    for (let col = 0; col < BOARD_WIDTH; col++) {
      const v: CellValue = board.grid[row][col];
      if (v) drawCell(ctx, row, col, COLORS[v], cellSize);
    }
  }

  if (current) {
    for (const c of getCells(current)) {
      if (c.row >= 0) drawCell(ctx, c.row, c.col, COLORS[current.type], cellSize);
    }
  }
}
```

- [ ] **Step 2: Проверка типов**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/ui/render.ts
git commit -m "feat: add canvas board rendering with piece colours"
```

---

### Task 12: Сенсорное управление

**Files:**
- Create: `src/ui/input.ts`

**Interfaces:**
- Consumes: ничего (DOM Touch API).
- Produces:
  - `interface InputHandlers { onLeft(): void; onRight(): void; onRotate(): void; onSoftDrop(): void; onHardDrop(): void }`
  - `function attachTouchInput(el: HTMLElement, h: InputHandlers): () => void` — вешает слушатели, возвращает функцию отписки.

> Проверка ручная — в Task 15.

- [ ] **Step 1: Создать `src/ui/input.ts`**

```ts
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
```

- [ ] **Step 2: Проверка типов**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/ui/input.ts
git commit -m "feat: add touch input (swipe/tap) handling"
```

---

### Task 13: Оверлей вопроса с таймером

**Files:**
- Create: `src/ui/question-overlay.ts`
- Create: `src/ui/styles.css`

**Interfaces:**
- Consumes: `Question` из `../vocab/question`.
- Produces:
  - `interface OverlayCallbacks { onAnswer(index: number): void; onTimeout(): void }`
  - `class QuestionOverlay`:
    - `constructor(root: HTMLElement)`
    - `show(q: Question, cb: OverlayCallbacks): void` — рисует слово, 4 кнопки, полосу таймера на 10 с; тап по кнопке → `onAnswer(index)`; истечение → `onTimeout()`.
    - `showFeedback(correct: boolean, correctAnswer: string): void` — подсветка на ~1.5 с.
    - `hide(): void`
    - `dispose(): void` — снять таймеры.

> Проверка ручная — в Task 15.

- [ ] **Step 1: Создать `src/ui/styles.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #0b0b0b; color: #eee;
  font-family: system-ui, sans-serif; overscroll-behavior: none; }
#app { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px; }
#hud { display: flex; gap: 16px; font-size: 16px; }
canvas { touch-action: none; background: #111; border: 2px solid #333; }

#overlay { position: fixed; inset: 0; display: none; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; padding: 24px;
  background: rgba(0,0,0,0.85); }
#overlay.visible { display: flex; }
#overlay .prompt { font-size: 32px; font-weight: 700; }
#overlay .options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 420px; }
#overlay button.opt { padding: 18px; font-size: 20px; border: none; border-radius: 10px;
  background: #2a2a2a; color: #fff; }
#overlay button.opt.correct { background: #1f8a3b; }
#overlay button.opt.wrong { background: #a11; }
#timerbar { width: 100%; max-width: 420px; height: 8px; background: #333; border-radius: 4px; overflow: hidden; }
#timerfill { height: 100%; width: 100%; background: #4ea1ff; }
```

- [ ] **Step 2: Создать `src/ui/question-overlay.ts`**

```ts
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
```

- [ ] **Step 3: Проверка типов**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/ui/question-overlay.ts src/ui/styles.css
git commit -m "feat: add question overlay with countdown timer"
```

---

### Task 14: Анимация сгорания линии

**Files:**
- Create: `src/ui/animations.ts`

**Interfaces:**
- Consumes: `BOARD_WIDTH` из `../engine/types`.
- Produces:
  - `function animateLineClear(ctx: CanvasRenderingContext2D, rows: number[], cellSize: number, onDone: () => void): void` — вспышка/затухание указанных строк ~250 мс, затем вызывает `onDone()`.

> Проверка ручная — в Task 15.

- [ ] **Step 1: Создать `src/ui/animations.ts`**

```ts
import { BOARD_WIDTH } from '../engine/types';

const FLASH_MS = 250;

export function animateLineClear(
  ctx: CanvasRenderingContext2D,
  rows: number[],
  cellSize: number,
  onDone: () => void,
): void {
  if (rows.length === 0) {
    onDone();
    return;
  }
  const start = performance.now();
  const step = () => {
    const t = (performance.now() - start) / FLASH_MS;
    if (t >= 1) {
      onDone();
      return;
    }
    // мигающая белая заливка поверх сгорающих строк
    const alpha = Math.abs(Math.sin(t * Math.PI * 3));
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    for (const row of rows) {
      ctx.fillRect(0, row * cellSize, BOARD_WIDTH * cellSize, cellSize);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

- [ ] **Step 2: Проверка типов**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/ui/animations.ts
git commit -m "feat: add line-clear flash animation"
```

---

### Task 15: Точка входа — сборка, игровой цикл, HUD

**Files:**
- Create: `src/main.ts`
- Modify: `index.html`

**Interfaces:**
- Consumes: `Game`, `drawBoard`, `attachTouchInput`, `QuestionOverlay`, `animateLineClear`, `loadHighScore`, `saveHighScore`.
- Produces: играбельное приложение. Цикл `requestAnimationFrame` двигает гравитацию по `dropInterval(level)` в фазе `playing`; управляет оверлеем в фазе `question`; проигрывает анимацию и вызывает `game.resolve()` в фазе `resolving`; показывает Game Over и сохраняет рекорд.

> Проверка ручная в браузере (телефон/десктоп).

- [ ] **Step 1: Обновить `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Тетрис-словарь</title>
    <link rel="stylesheet" href="/src/ui/styles.css" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0b0b0b" />
  </head>
  <body>
    <div id="app">
      <div id="hud">
        <span>Очки: <b id="score">0</b></span>
        <span>Уровень: <b id="level">1</b></span>
        <span>Рекорд: <b id="best">0</b></span>
      </div>
      <canvas id="board"></canvas>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Создать `src/main.ts`**

```ts
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
        window.setTimeout(() => {
          overlay.hide();
          overlayShown = false;
        }, 1500);
      };
      overlay.show(q, { onAnswer: submit, onTimeout: () => submit(-1) });
    }
  } else if (game.phase === 'resolving') {
    const rows = game.pendingClears();
    drawBoard(ctx, game.board, null, CELL);
    game.phase = 'question'; // временно блокируем повторный вход, пока играет анимация
    animateLineClear(ctx, rows, CELL, () => {
      game.phase = 'resolving';
      game.resolve();
      syncHud();
      lastDrop = performance.now();
    });
  } else if (game.phase === 'gameover') {
    syncHud();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = `${CELL}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }

  syncHud();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// регистрация service worker (Task 16)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* офлайн необязателен */ });
  });
}
```

> Примечание по фазе `resolving`: временная установка `phase='question'` на время анимации — простой способ не входить в ветку `resolving` повторно каждый кадр. Если при реализации это окажется неудобным, замените на отдельный булев флаг `animating` в `main.ts` — поведение важнее приёма.

- [ ] **Step 3: Проверка типов и запуск**

Run: `npx tsc --noEmit && npm run dev`
Expected: без ошибок типов; dev-сервер поднялся.

- [ ] **Step 4: Ручная проверка в браузере**

Открыть указанный Vite URL. Проверить:
- Разноцветные фигуры падают, двигаются стрелками/свайпами, вращаются, hard drop работает.
- Заполнение линии открывает оверлей с вопросом (слово + 4 варианта + таймер).
- Правильный ответ → подсветка зелёным → вспышка линии → линия исчезает, очки растут.
- Неверный ответ/таймаут → подсветка правильного ответа → линия остаётся, очки падают (не ниже 0).
- Несколько линий → несколько вопросов подряд.
- Переполнение стакана → «Game Over», рекорд сохраняется (обновить страницу — «Рекорд» держится).

- [ ] **Step 5: Commit**

```bash
git add src/main.ts index.html
git commit -m "feat: wire up game loop, HUD, input and overlay into playable app"
```

---

### Task 16: PWA — манифест и офлайн

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/icon-192.png`, `public/icon-512.png` (сплошные цветные иконки-заглушки)

**Interfaces:**
- Consumes: регистрация SW уже добавлена в `main.ts` (Task 15).
- Produces: устанавливаемое офлайн-приложение.

> Проверка ручная (установка на домашний экран, офлайн-режим).

- [ ] **Step 1: Создать `public/manifest.json`**

```json
{
  "name": "Тетрис-словарь",
  "short_name": "Тетрис-словарь",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0b0b0b",
  "theme_color": "#0b0b0b",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Создать иконки-заглушки**

Run:
```bash
node -e "const fs=require('fs');const b64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';const png=Buffer.from(b64,'base64');fs.writeFileSync('public/icon-192.png',png);fs.writeFileSync('public/icon-512.png',png);console.log('icons written');"
```
Expected: `icons written` (1×1 PNG-заглушки; заменить на настоящие позже).

- [ ] **Step 3: Создать `public/sw.js`**

```js
const CACHE = 'tetris-vocab-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});
```

- [ ] **Step 4: Сборка и проверка**

Run: `npm run build && npm run preview`
Expected: сборка без ошибок; preview-сервер отдаёт приложение.

- [ ] **Step 5: Ручная проверка PWA**

- В Chrome/Android открыть preview-URL → меню → «Установить приложение»/«На главный экран».
- Открыть установленное приложение — работает в portrait.
- Включить авиарежим, перезапустить приложение — загружается офлайн, играется (словарь встроен).

- [ ] **Step 6: Commit**

```bash
git add public/manifest.json public/sw.js public/icon-192.png public/icon-512.png
git commit -m "feat: add PWA manifest, service worker and icons"
```

---

## Порядок и зависимости

Задачи идут строго по порядку: 2–7 — независимые «кирпичи» ядра (можно и параллельно), 8–9 зависят от 2–7, 11–14 — UI-слой (зависят от ядра), 15 связывает всё, 16 — PWA поверх готового приложения.

## Итоговая структура файлов

```
index.html
package.json  tsconfig.json  vite.config.ts
public/        manifest.json  sw.js  icon-192.png  icon-512.png
src/
  main.ts
  engine/  types.ts  pieces.ts  collision.ts  board.ts  bag.ts  scoring.ts  (+ *.test.ts)
  vocab/   dictionary.ts  question.ts  (+ question.test.ts)
  game/    game.ts  (+ game.test.ts  answer.test.ts)
  storage/ storage.ts  (+ storage.test.ts)
  ui/      render.ts  input.ts  question-overlay.ts  animations.ts  styles.css
```
