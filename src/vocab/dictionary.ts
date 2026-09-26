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
