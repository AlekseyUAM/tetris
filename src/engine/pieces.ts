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
