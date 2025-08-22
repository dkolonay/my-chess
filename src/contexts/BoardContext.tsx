import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { BoardRow, BoardType, PieceType } from "../types/boardTypes";

type BoardContextProviderProps = {
    children: ReactNode;
}

export type BoardContextType = {
    board: BoardType;
    movePiece: (newX: number, newY: number, oldX: number, oldY: number) => boolean;
    flipped: boolean;
    selectedSquare: [number, number] | null;
    updateSelectedSquare: (newSquareX: number, newSquareY: number) => void;
    handleFlip: () => void;
}

const DEFAULT_BOARD: BoardType = []

for (let i = 0; i < 8; i++) {
    const row: BoardRow = [];
    for (let j = 0; j < 8; j++) {
        let piece: PieceType = {
            x: 0,
            y: 0,
            id: 0,
            name: 'none',
            color: 'none',
            moved: false,
            destination: ''
        };
        if (j == 0 || j == 1) {
            piece.color = 'black'
        }
        if (j == 6 || j == 7) {
            piece.color = 'white'
        }
        if (j == 1 || j == 6) {
            piece.id = 1;
            piece.name = 'pawn';
            piece.doubleTurn = 0;
        }
        if ((j == 0 || j == 7)) {
            if (i == 0 || i == 7) {
                piece.id = 4;
                piece.name = 'rook'
            }
            if (i == 1 || i == 6) {
                piece.id = 2;
                piece.name = 'knight'
            }
            if (i == 2 || i == 5) {
                piece.id = 3;
                piece.name = 'bishop'
            }

            if (i == 3) {
                piece.id = 5
                piece.name = 'queen'
            }
            if (i == 4) {
                piece.id = 6;
                piece.name = 'king'
            }

        }
        piece.x = i;
        piece.y = j;
        let light = ((i % 2 == 0) && (j % 2 == 0)) || ((i % 2 != 0) && (j % 2 != 0))
        row.push({ x: i, y: j, selected: false, highlighted: false, top: false, theme: light ? 'light' : 'dark', piece: piece })
    }
    DEFAULT_BOARD.push(row);
}



export const BoardContext = createContext<BoardContextType | null>(null);

export default function BoardContextProvider({
    children,
}: BoardContextProviderProps) {
    const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
    const [board, setBoard] = useState<BoardType>(DEFAULT_BOARD);
    const [turn, setTurn] = useState(1);
    const [flipped, setFlipped] = useState(false);

    const handleFlip = () => {
        setFlipped(!flipped)
    }

    const updateSelectedSquare = (newSquareX: number, newSquareY: number) => {
        if (selectedSquare === null) {
            //clicking an empty square when no piece is selected does nothing
            if (board[newSquareX][newSquareY].piece.name == 'none') {
                return
            }
            //clicking a piece when no piece is selected will select it
            setSelectedSquare(() => [newSquareX, newSquareY])
            setBoard((prevBoard) => {
                const newBoard = structuredClone(prevBoard)
                newBoard[newSquareX][newSquareY].selected = true
                return newBoard
            })
        } else {
            //clicking a piece that is selected will deselect it
            if (selectedSquare[0] === newSquareX && selectedSquare[1] === newSquareY) {
                setSelectedSquare(null)
                setBoard((prevBoard) => {
                    const newBoard = structuredClone(prevBoard)
                    newBoard[selectedSquare[0]][selectedSquare[1]].selected = false
                    return newBoard
                })
            } else {
                //clicking a non-selected square when a piece is selected will attempt to move the piece there
                const wasMoved = movePiece(newSquareX, newSquareY, selectedSquare[0], selectedSquare[1]);
                setSelectedSquare(null);
                if (wasMoved) {
                    setBoard((prevBoard) =>
                        prevBoard.map((row, i) =>
                            row.map((square, j) => {
                                if (i == selectedSquare[0] && j == selectedSquare[1]) {
                                    return { ...square, selected: false, highlighted: true, top: true }
                                } else if (newSquareX == i && newSquareY == j) {
                                    return { ...square, selected: false, highlighted: true, top: false }
                                } else {
                                    return { ...square, selected: false, highlighted: false, top: false }
                                }
                            })
                        )
                    )
                } else {
                    setBoard((prevBoard) => {
                        const newBoard = structuredClone(prevBoard)
                        newBoard[selectedSquare[0]][selectedSquare[1]].selected = false
                        return newBoard
                    })
                }

            }
        }

    }

    const checkValidMove = (newX: number, newY: number, oldX: number, oldY: number) => {
        let valid = false;
        let enpassant = false;
        let doubleMove = false;
        let promotion = false;
        let castle = false;

        const newSquare = board[newX][newY]
        const oldSquare = board[oldX][oldY]
        const newPiece = newSquare.piece
        const oldPiece = oldSquare.piece

        const deltaX = Math.abs(newX - oldX);
        const deltaY = Math.abs(newY - oldY);

        if (newPiece.color == oldPiece.color) {
            return [valid, enpassant, doubleMove, promotion, castle]
        }
        if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
            return [valid, enpassant, doubleMove, promotion, castle]
        }

        const checkRookValid = () => {
            let sign = 1;
            if (newX == oldX) {
                if (newY < oldY) {
                    sign = -1
                }
                for (let i = 1; i < deltaY; i++) {
                    if (board[oldX][oldY + (i * sign)].piece.name != 'none') {
                        return false;
                    }
                }
                return true;

            }
            if (newY == oldY) {
                if (newX < oldX) {
                    sign = -1
                }
                for (let i = 1; i < deltaX; i++) {
                    if (board[oldX + (i * sign)][oldY].piece.name != 'none') {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }

        const checkBishopValid = () => {
            if (deltaX == deltaY) {
                let signX = 1;
                let signY = 1;
                if (newX > oldX && newY < oldY) {
                    signY = -1;
                }
                if (newX < oldX && newY > oldY) {
                    signX = -1;
                }
                if (newX < oldX && newY < oldY) {
                    signX = -1;
                    signY = -1;
                }

                for (let i = 1; i < deltaX; i++) {
                    if (board[oldX + (i * signX)][oldY + (i * signY)].piece.name != 'none') {
                        return false
                    }
                }
                return true;
            } else {
                return false;
            }
        }

        // const evaluateCheck = ()=>{
        //     let whiteKingX = 0;
        //     let whiteKingY = 0;
        //     let blackKingX = 0;
        //     let blackKingY = 0;

        //     for (let i = 0; i < 8; i++){
        //         for (let j = 0; j < 8; j++){
        //             if (board[i][j].piece.name == 'king' && board[i][j].piece.color == 'black'){
        //                 blackKingX = i;
        //                 blackKingY = j;
        //             }
        //             if (board[i][j].piece.name == 'king' && board[i][j].piece.color == 'white'){
        //                 whiteKingX = i;
        //                 whiteKingY = j;
        //             }
        //         }
        //     }

        //     for (let i = 0; i < 8; i++){
        //         for (let j = 0; j < 8; j++){
        //             let attackingPiece = board[i][j].piece;
        //             if (attackingPiece.color == 'white'){

        //             }
        //         }
        //     }

        // }
        // evaluateCheck()

        switch (oldPiece.name) {
            case 'pawn':
                let relativeNewY = newY
                let relativeOldY = oldY

                if (oldPiece.color == "black") {
                    relativeNewY = oldY;
                    relativeOldY = newY;
                }

                if (relativeOldY - relativeNewY == 1) {
                    if (newX == oldX && newPiece.name == 'none') {
                        valid = true;
                        break;
                    }
                    if (Math.abs(newX - oldX) == 1) {
                        if (newPiece.name != 'none') {
                            valid = true;
                            break;
                        }
                        if (oldX != 7) {
                            if (board[oldX + 1][oldY].piece.name == 'pawn') {
                                if (board[oldX + 1][oldY].piece.doubleTurn == turn - 1 && board[oldX + 1][oldY].piece.color != oldPiece.color) {
                                    valid = true;
                                    enpassant = true;
                                    break;
                                }
                            }
                        }
                        if (oldX != 0) {
                            if (board[oldX - 1][oldY].piece.name == 'pawn') {
                                if (board[oldX - 1][oldY].piece.doubleTurn == turn - 1 && board[oldX - 1][oldY].piece.color != oldPiece.color) {
                                    valid = true;
                                    enpassant = true;
                                    break;
                                }
                            }
                        }
                    }

                } else if (relativeOldY - relativeNewY == 2 && oldPiece.moved == false && newPiece.name == 'none') {
                    if (oldPiece.color == 'white' && board[oldX][oldY - 1].piece.name != 'none') {
                        return [valid, enpassant, doubleMove, promotion, castle];
                    } else if (oldPiece.color == 'black' && board[oldX][oldY + 1].piece.name != 'none') {
                        return [valid, enpassant, doubleMove, promotion, castle];
                    }
                    valid = true;
                    doubleMove = true;
                    break;
                }

                return [valid, enpassant, doubleMove, promotion, castle];
            case 'knight':
                if ((deltaX == 2 && deltaY == 1) || (deltaY == 2 && deltaX == 1)) {
                    valid = true;
                    break;
                } else {
                    return [valid, enpassant, doubleMove, promotion, castle];
                }
            case 'bishop':
                if (checkBishopValid()) {
                    valid = true;
                    break;
                } else {
                    return [valid, enpassant, doubleMove, promotion, castle]
                }

            case 'rook':
                if (checkRookValid()) {
                    valid = true;
                    break;
                } else {
                    return [valid, enpassant, doubleMove, promotion, castle]
                }

            case 'queen':
                if (checkBishopValid() || checkRookValid()) {
                    valid = true;
                    break;
                } else {
                    return [valid, enpassant, doubleMove, promotion, castle];
                }

            case 'king':
                if (deltaX < 2 && deltaY < 2) {
                    valid = true;
                    break;
                } else {
                    if (deltaX == 2 && deltaY == 0) {
                        if (!oldPiece.moved) {
                            if (newX == 6 && !board[7][oldY].piece.moved && board[5][oldY].piece.name == 'none') {
                                valid = true;
                                castle = true;
                                break;
                            }
                            if (newX == 2 && !board[0][oldY].piece.moved && board[3][oldY].piece.name == 'none' && board[1][oldY].piece.name == 'none') {
                                valid = true;
                                castle = true;
                                break;
                            }
                        }
                    }
                    return [valid, enpassant, doubleMove, promotion, castle];
                }
            default:
                return [valid, enpassant, doubleMove, promotion, castle];
        }


        if (oldPiece.color == 'white' && oldPiece.name == 'pawn' && newY == 0) {
            promotion = true
        }
        if (oldPiece.color == 'black' && oldPiece.name == 'pawn' && newY == 7) {
            promotion = true
        }
        return [valid, enpassant, doubleMove, promotion, castle];
    }

    const movePiece = (newX: number, newY: number, oldX: number, oldY: number) => {
        const [valid, enpassant, doubleMove, promotion, castle] = checkValidMove(newX, newY, oldX, oldY)
        if (!valid) {
            return false
        }


        setBoard((prevBoard) => {
            const newBoard = structuredClone(prevBoard);
            newBoard[oldX][oldY].piece.destination = `s${newX},${newY}`

            if (castle) {
                if (newX == 6) {
                    newBoard[7][oldY].piece.destination = `s5,${newY}`
                } else {
                    newBoard[0][oldY].piece.destination = `s3,${newY}`
                }
            }
            return newBoard;
        })
        setTimeout(() => {
            setBoard(prevBoard => {
                const newBoard = structuredClone(prevBoard)
                newBoard[newX][newY].piece = { ...prevBoard[oldX][oldY].piece, x: newX, y: newY, moved: true, destination: '' };
                newBoard[oldX][oldY].piece = { x: 0, y: 0, id: 0, name: 'none', color: 'none', moved: false, destination: '' };

                if (castle) {
                    if (newX == 6) {
                        newBoard[5][oldY].piece = { ...prevBoard[7][oldY].piece, x: 5, y: newY, moved: true, destination: '' };
                        newBoard[7][oldY].piece = { x: 0, y: 0, id: 0, name: 'none', color: 'none', moved: false, destination: '' };
                    } else {
                        newBoard[3][oldY].piece = { ...prevBoard[0][oldY].piece, x: 3, y: newY, moved: true, destination: '' };
                        newBoard[0][oldY].piece = { x: 0, y: 0, id: 0, name: 'none', color: 'none', moved: false, destination: '' };
                    }
                }
                if (doubleMove) {
                    newBoard[newX][newY].piece.doubleTurn = turn;
                }
                if (enpassant) {
                    if (newBoard[newX][newY].piece.color == 'white') {
                        newBoard[newX][newY + 1].piece = { x: 0, y: 0, id: 0, name: 'none', color: 'none', moved: false, destination: '' };
                    } else {
                        newBoard[newX][newY - 1].piece = { x: 0, y: 0, id: 0, name: 'none', color: 'none', moved: false, destination: '' };
                    }
                }
                if (promotion) {
                    newBoard[newX][newY].piece.name = 'queen';
                    newBoard[newX][newY].piece.id = 5;
                }
                return newBoard;
            })

            setTurn((oldTurn) => oldTurn + 1);

        }, 150)

        return true;

    }

    return (
        <BoardContext.Provider
            value={{
                board,
                selectedSquare,
                flipped,
                movePiece,
                updateSelectedSquare,
                handleFlip,
            }}
        >
            {children}
        </BoardContext.Provider>
    )
}