export interface PieceType {
    x: number,
    y: number,
    id: number;
    name: string;
    color: string;
    moved: boolean;
    doubleTurn?: number;
    destination: string;
}

export interface BoardSquare {
    x: number;
    y: number;
    selected: boolean;
    top: boolean;
    theme: string;
    piece: PieceType;
}

export type BoardRow = BoardSquare[];
export type BoardType = BoardRow[];

export type BoardState = {
    selectedSquare: number | null
}

