export interface PieceType {
    x: number,
    y: number,
    name: string;
    value: number;
    color: string;
    moved: boolean;
    doubleTurn?: number;
    destination: string;
}

export interface MoveType {
    x: number,
    y: number,
    type: string,
    piece: PieceType,
    double: boolean,
    enpassant: boolean,
    promotion: boolean,
    castle: boolean,
    confirmed: boolean
}


export interface MovesType {
    [key:string]: MoveType
}

export function createNewPiece(x: number = 0, y: number = 0, value: number = 0, name: string = "", color: string = "", moved: boolean = false, doubleTurn: number = 0, destination: string = "") : PieceType {
    return {
        x:x,
        y:y,
        name:name,
        value:value,
        color:color,
        moved:moved,
        doubleTurn:doubleTurn,
        destination:destination
    }
}

export function createNewMove(x:number, y: number, type:string, piece:PieceType = createNewPiece(), double: boolean = false, enpassant:boolean = false, promotion:boolean = false, castle:boolean = false, confirmed:boolean = false):MoveType{
    return{
        x:x,
        y:y,
        type:type,
        piece:piece,
        double:double,
        enpassant:enpassant,
        promotion:promotion,
        castle:castle,
        confirmed:confirmed
    }
}


export interface BoardSquare {
    idx:string;
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

