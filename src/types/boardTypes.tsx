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

export function createNewPiece(x: number = 0, y: number = 0, id: number = 0, name: string = "", color: string = "", moved: boolean = false, doubleTurn: number = 0, destination: string = "") : PieceType {
    return {
        x:x,
        y:y,
        id:id,
        name:name,
        color:color,
        moved:moved,
        doubleTurn:doubleTurn,
        destination:destination
    }
}

export interface BoardSquare {
    x: number;
    y: number;
    selected: boolean;
    highlighted: boolean;
    top: boolean;
    moveIndicator: string;
    theme: string;
    piece: PieceType;
}

export type BoardRow = BoardSquare[];
export type BoardType = BoardRow[];

export type BoardState = {
    selectedSquare: number | null
}

