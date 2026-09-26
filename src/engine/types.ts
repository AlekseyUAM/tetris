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
