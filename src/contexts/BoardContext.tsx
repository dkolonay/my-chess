import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { createNewPiece, type BoardRow, type BoardType } from "../types/boardTypes";

type BoardContextProviderProps = {
    children: ReactNode;
}

export type BoardContextType = {
    board: BoardType;
    movePiece: (newX: number, newY: number, oldX: number, oldY: number) => boolean;
    flipped: boolean;
    selectedSquare: { x: number | null, y: number | null };
    updateSelectedSquare: (newSquareX: number, newSquareY: number) => void;
    handleFlip: () => void;
}

const DEFAULT_BOARD: BoardType = []

for (let i = 0; i < 8; i++) {
    const row: BoardRow = [];
    for (let j = 0; j < 8; j++) {
        let piece = createNewPiece()
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
    const [selectedSquare, setSelectedSquare] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
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
                    if (board[startX + (i * signX)][startY + (i * signY)].piece.name != "") {
                        return 0; //piece in the way
                    }
                }
                if (board[x][y].piece.name == "") {
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
                    if (board[startX][startY + (i * sign)].piece.name != "") {
                        return 0;
                    }
                }
                if (board[x][y].piece.name == "") {
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
                    if (board[startX + (i * sign)][startY].piece.name != "") {
                        return 0;
                    }
                }
                if (board[x][y].piece.name == "") {
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
                if (board[x][y].piece.name == "") {
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

        const potentialKingMove = (x: number, y: number, deltaX: number, deltaY: number) => {
            if (deltaX < 2 && deltaY < 2) {
                if (board[x][y].piece.name == "") {
                    return 1
                } else {
                    if (board[x][y].piece.color == board[startX][startY].piece.color) {
                        return 0
                    } else {
                        return 2
                    }
                }

                potentialMoves.push({ x: x, y: y, type: "regular_move" })
            }
            return 0
        }

        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {

                const deltaX = Math.abs(x - startX);
                const deltaY = Math.abs(y - startY);
                let moveType = 0

                switch (piece.name) {
                    case "pawn":
                        moveType = 1;
                        break;
                    case "bishop":
                        moveType = potentialBishopMove(x, y, deltaX, deltaY)
                        break;
                    case "rook":
                        moveType = potentialRookMove(x, y, deltaX, deltaY)
                        break;
                    case "queen":
                        moveType = potentialBishopMove(x, y, deltaX, deltaY);
                        if (!moveType) {
                            moveType = potentialRookMove(x, y, deltaX, deltaY);
                        }
                        break;
                    case "knight":
                        moveType = potentialKnightMove(x, y, deltaX, deltaY);
                        break;
                    case "king":
                        moveType = potentialKingMove(x, y, deltaX, deltaY)
                        break;

                    default:
                        break;

                }

                if (moveType == 1) {
                    potentialMoves.push({ x: x, y: y, type: "regular_move" })
                } else if (moveType == 2) {
                    potentialMoves.push({ x: x, y: y, type: "capture_move" })
                }
            }
        }
        // potentialMoves = potentialMoves.filter(square => square.x == startX && square.y == startY)
        return potentialMoves;
    }

    const updateSelectedSquare = (newSquareX: number, newSquareY: number) => {
        let selectedColor = ""
        if (selectedSquare.x !== null && selectedSquare.y !== null) {
            selectedColor = board[selectedSquare.x][selectedSquare.y].piece.color
        }
        if ((selectedSquare.x === null || selectedSquare.y === null) || board[newSquareX][newSquareY].piece.color == selectedColor) {
            //clicking an empty square when no piece is selected does nothing
            if (board[newSquareX][newSquareY].piece.name == "") {
                return
            } else if (newSquareX == selectedSquare.x && newSquareY == selectedSquare.y) {
                //clicking the selected square will deselect it
                setSelectedSquare({ x: null, y: null })
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {
                            return { ...square, selected: false, moveIndicator: "" }
                        }))
                )
            } else {
                //clicking a piece when no piece is selected or the same color will select it
                //the square will be highlighted and potential moves will be shown and set to the state
                setSelectedSquare(() => { return { x: newSquareX, y: newSquareY } })
                const potentialMoves = calculatePotentialMoves(newSquareX, newSquareY);
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {
                            const newSquare = { ...square, selected: false, moveIndicator: "" }
                            if (square.x == newSquareX && square.y == newSquareY) {
                                return { ...square, selected: true }
                            }
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
            }

        } else {

            //clicking a non-selected square when a piece is selected will attempt to move the piece there
            const wasMoved = movePiece(newSquareX, newSquareY, selectedSquare.x, selectedSquare.y);
            if (wasMoved) {
                //clicking a valid move when a piece is selected will move the piece
                setBoard((prevBoard) =>
                    prevBoard.map((row, i) =>
                        row.map((square, j) => {
                            if (i == selectedSquare.x && j == selectedSquare.y) {
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
                //clicking an invalid move when a piece is selected will deselect it
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {
                            return { ...square, selected: false, moveIndicator: "" }
                        }))
                )
            }
            setSelectedSquare({ x: null, y: null });

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
                    if (board[oldX][oldY + (i * sign)].piece.name != "") {
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
                    if (board[oldX + (i * sign)][oldY].piece.name != "") {
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
                    if (board[oldX + (i * signX)][oldY + (i * signY)].piece.name != "") {
                        return false
                    }
                }
                return true;
            } else {
                return false;
            }
        }

        switch (oldPiece.name) {
            case 'pawn':
                let relativeNewY = newY
                let relativeOldY = oldY

                if (oldPiece.color == "black") {
                    relativeNewY = oldY;
                    relativeOldY = newY;
                }

                if (relativeOldY - relativeNewY == 1) {
                    if (newX == oldX && newPiece.name == "") {
                        valid = true;
                        break;
                    }
                    if (Math.abs(newX - oldX) == 1) {
                        if (newPiece.name != "") {
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

                } else if (relativeOldY - relativeNewY == 2 && oldPiece.moved == false && newPiece.name == "") {
                    if (oldPiece.color == 'white' && board[oldX][oldY - 1].piece.name != "") {
                        return [valid, enpassant, doubleMove, promotion, castle];
                    } else if (oldPiece.color == 'black' && board[oldX][oldY + 1].piece.name != "") {
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
                            if (newX == 6 && !board[7][oldY].piece.moved && board[5][oldY].piece.name == "") {
                                valid = true;
                                castle = true;
                                break;
                            }
                            if (newX == 2 && !board[0][oldY].piece.moved && board[3][oldY].piece.name == "" && board[1][oldY].piece.name == "") {
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
            // newBoard[oldX][oldY].piece.destination = `s${newX},${newY}`

            newBoard[newX][newY].piece = { ...prevBoard[oldX][oldY].piece, x: newX, y: newY, moved: true, destination: '' };
            newBoard[oldX][oldY].piece = createNewPiece();

            if (castle) {
                if (newX == 6) {
                    newBoard[5][oldY].piece = { ...prevBoard[7][oldY].piece, x: 5, y: newY, moved: true, destination: '' };
                    newBoard[7][oldY].piece = createNewPiece();
                } else {
                    newBoard[3][oldY].piece = { ...prevBoard[0][oldY].piece, x: 3, y: newY, moved: true, destination: '' };
                    newBoard[0][oldY].piece = createNewPiece();
                }
            }
            if (doubleMove) {
                newBoard[newX][newY].piece.doubleTurn = turn;
            }
            if (enpassant) {
                if (newBoard[newX][newY].piece.color == 'white') {
                    newBoard[newX][newY + 1].piece = createNewPiece();
                } else {
                    newBoard[newX][newY - 1].piece = createNewPiece();
                }
            }
            if (promotion) {
                newBoard[newX][newY].piece.name = 'queen';
                newBoard[newX][newY].piece.id = 5;
            }
            return newBoard;
        })

        setTurn((oldTurn) => oldTurn + 1);
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