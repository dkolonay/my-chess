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
        row.push({
            x: i,
            y: j,
            selected: false,
            highlighted: false,
            top: false,
            moveIndicator: "",
            theme: light ? 'light' : 'dark',
            piece: piece
        })
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

    const calculatePotentialMoves = (startX: number, startY: number) => {
        const piece = board[startX][startY].piece;
        let potentialMoves = [];

        const potentialBishopMove = (x: number, y: number, deltaX: number, deltaY: number) => {
            if (deltaX == deltaY) {
                let signX = 1;
                let signY = 1;
                if (x > startX && y < startY) {
                    signY = -1;
                }
                if (x < startX && y > startY) {
                    signX = -1;
                }
                if (x < startX && y < startY) {
                    signX = -1;
                    signY = -1;
                }

                for (let i = 1; i < deltaX; i++) {
                    if (board[startX + (i * signX)][startY + (i * signY)].piece.name != "none") {
                        return 0; //piece in the way
                    }
                }
                if (board[x][y].piece.name == "none") {
                    return 1;
                } else if (board[x][y].piece.color != board[startX][startY].piece.color) {
                    return 2;
                } else {
                    return 0;
                }

            } else {
                return 0;
            }
        }

        const potentialRookMove = (x: number, y: number, deltaX: number, deltaY: number) => {
            let sign = 1;
            if (x == startX) {
                if (y < startY) {
                    sign = -1
                }
                for (let i = 1; i < deltaY; i++) {
                    if (board[startX][startY + (i * sign)].piece.name != 'none') {
                        return 0;
                    }
                }
                if (board[x][y].piece.name == "none") {
                    return 1;
                } else if (board[x][y].piece.color != board[startX][startY].piece.color) {
                    return 2;
                } else {
                    return 0;
                }

            }
            if (y == startY) {
                if (x < startX) {
                    sign = -1
                }
                for (let i = 1; i < deltaX; i++) {
                    if (board[startX + (i * sign)][startY].piece.name != 'none') {
                        return 0;
                    }
                }
                if (board[x][y].piece.name == "none") {
                    return 1;
                } else if (board[x][y].piece.color != board[startX][startY].piece.color) {
                    return 2;
                } else {
                    return 0;
                }
            }
            return 0;
        }

        const potentialKnightMove = (x: number, y: number, deltaX: number, deltaY: number) => {
            if (deltaX == 2 && deltaY == 1 || deltaY == 2 && deltaX == 1) {
                if (board[x][y].piece.name == "none") {
                    return 1;
                } else {
                    if (board[x][y].piece.color == board[startX][startY].piece.color) {
                        return 0
                    } else {
                        return 2;
                    }
                }
            } else {
                return 0
            }
        }

        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {

                const deltaX = Math.abs(x - startX);
                const deltaY = Math.abs(y - startY);
                let moveType = 0

                switch (piece.name) {
                    case "bishop":
                        moveType = potentialBishopMove(x, y, deltaX, deltaY)
                        if (moveType) {
                            if (moveType == 1) {
                                potentialMoves.push({ x: x, y: y, type: "regular_move" })
                            } else if (moveType == 2) {
                                potentialMoves.push({ x: x, y: y, type: "capture_move" })
                            }

                        }
                        break;
                    case "rook":
                        moveType = potentialRookMove(x, y, deltaX, deltaY)
                        if (moveType == 1) {
                            potentialMoves.push({ x: x, y: y, type: "regular_move" })
                        } else if (moveType == 2) {
                            potentialMoves.push({ x: x, y: y, type: "capture_move" })
                        }
                        break;
                    case "queen":
                        moveType = potentialBishopMove(x, y, deltaX, deltaY);
                        if (!moveType) {
                            moveType = potentialRookMove(x, y, deltaX, deltaY);
                        }
                        if (moveType == 1) {
                            potentialMoves.push({ x: x, y: y, type: "regular_move" })
                        } else if (moveType == 2) {
                            potentialMoves.push({ x: x, y: y, type: "capture_move" })
                        }
                        break;
                    case "knight":
                        moveType = potentialKnightMove(x, y, deltaX, deltaY);
                        if (moveType == 1) {
                            potentialMoves.push({ x: x, y: y, type: "regular_move" })
                        } else if (moveType == 2) {
                            potentialMoves.push({ x: x, y: y, type: "capture_move" })
                        }
                        break;
                    case "king":
                        if (Math.abs(startX - x) < 2 && Math.abs(startY - y) < 2) {
                            potentialMoves.push({ x: x, y: y, type: "regular_move" })
                        }
                        break;
                    default:
                        break;

                }

            }
        }
        // potentialMoves = potentialMoves.filter(square => square.x == startX && square.y == startY)
        return potentialMoves;
    }

    const updateSelectedSquare = (newSquareX: number, newSquareY: number) => {

        if (selectedSquare === null) {
            //clicking an empty square when no piece is selected does nothing
            if (board[newSquareX][newSquareY].piece.name == 'none') {
                return
            }
            //clicking a piece when no piece is selected or the same color will select it
            setSelectedSquare(() => [newSquareX, newSquareY])
            const potentialMoves = calculatePotentialMoves(newSquareX, newSquareY);
            setBoard((prevBoard) =>
                prevBoard.map((row) =>
                    row.map((square) => {
                        if (square.x == newSquareX && square.y == newSquareY) {
                            return { ...square, selected: true }
                        }
                        const newSquare = { ...square }
                        potentialMoves.forEach((move) => {
                            if (move.x == square.x && move.y == square.y) {

                                if (move.type == "regular_move") {
                                    newSquare.moveIndicator = "regular_move"
                                } else if (move.type == "capture_move") {
                                    newSquare.moveIndicator = "capture_move"
                                }
                            }
                        })

                        return newSquare;

                    })
                )
            )


        } else {
            //clicking a piece that is selected will deselect it
            if (selectedSquare[0] === newSquareX && selectedSquare[1] === newSquareY) {
                setSelectedSquare(null)
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {
                            return { ...square, selected: false, moveIndicator: "" }
                        }))
                )
            } else if (board[newSquareX][newSquareY].piece.color == board[selectedSquare[0]][selectedSquare[1]].piece.color) {
                //clicking piece of same color selects that piece and deselects selected piece
                const potentialMoves = calculatePotentialMoves(newSquareX, newSquareY);
                console.log(potentialMoves)
                setSelectedSquare(() => [newSquareX, newSquareY])
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {

                            if (square.x == newSquareX && square.y == newSquareY) {
                                return { ...square, selected: true }
                            }
                            if (square.x == selectedSquare[0] && square.y == selectedSquare[1]) {
                                return { ...square, selected: false }
                            }
                            const newSquare = { ...square, selected: false, moveIndicator: "" };
                            potentialMoves.forEach((move) => {
                                if (move.x == square.x && move.y == square.y) {
                                    if (move.type == "regular_move") {
                                        newSquare.moveIndicator = "regular_move"
                                    } else if (move.type == "capture_move") {
                                        newSquare.moveIndicator = "capture_move"
                                    }
                                }
                            })
                            return newSquare;
                        })
                    )
                )
            } else {
                //clicking a non-selected square when a piece is selected will attempt to move the piece there
                const wasMoved = movePiece(newSquareX, newSquareY, selectedSquare[0], selectedSquare[1]);
                if (wasMoved) {
                    setBoard((prevBoard) =>
                        prevBoard.map((row, i) =>
                            row.map((square, j) => {
                                if (i == selectedSquare[0] && j == selectedSquare[1]) {
                                    return { ...square, selected: false, highlighted: true, top: true, moveIndicator: "" }
                                } else if (newSquareX == i && newSquareY == j) {
                                    return { ...square, selected: false, highlighted: true, top: false, moveIndicator: "" }
                                } else {
                                    return { ...square, selected: false, highlighted: false, top: false, moveIndicator: "" }
                                }
                            })
                        )
                    )
                } else {
                    setBoard((prevBoard) =>
                        prevBoard.map((row) =>
                            row.map((square) => {
                                return { ...square, selected: false, moveIndicator: "" }
                            }))
                    )
                }
                setSelectedSquare(null);

            }
        }

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