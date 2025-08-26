import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createNewPiece, type BoardRow, type BoardType, type MoveType, type MovesType, type PieceType } from "../types/boardTypes";

type BoardContextProviderProps = {
    children: ReactNode;
}

export type BoardContextType = {
    board: BoardType;
    movePiece: (newMove: MoveType, oldX: number, oldY: number) => void;
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
    const [moves, setMoves] = useState<MovesType>({})
    const [lastMove, setLastMove] = useState<MoveType>({ x: 0, y: 0, type: "", piece: createNewPiece(), double: false, enpassant: false, promotion: false, castle: false, confirmed: false })
    const [check, setCheck] = useState(false)
    const [whiteKing, setWhiteKing] = useState({ x: 4, y: 7, check: false, checks: [] })
    const [blackKing, setBlackKing] = useState({ x: 4, y: 0, check: false, checks: [] })
    const [turn, setTurn] = useState(1);
    const [flipped, setFlipped] = useState(false);

    const handleFlip = () => {
        setFlipped(!flipped)
    }

    const potentialBishopMove = (x1: number, y1: number, x2: number, y2: number) => {
        if (Math.abs(x2 - x1) == Math.abs(y2 - y1)) {
            let signX = 1;
            let signY = 1;
            if (x2 > x1 && y2 < y1) {
                signY = -1;
            }
            if (x2 < x1 && y2 > y1) {
                signX = -1;
            }
            if (x2 < x1 && y2 < y1) {
                signX = -1;
                signY = -1;
            }

            for (let i = 1; i < Math.abs(x2 - x1); i++) {
                if (board[x1 + (i * signX)][y1 + (i * signY)].piece.name != "") {
                    return 0; //piece in the way
                }
            }
            if (board[x2][y2].piece.name == "") {
                return 1;
            } else {
                return 2;
            }

        } else {
            return 0;
        }
    }

    const potentialRookMove = (x1: number, y1: number, x2: number, y2: number) => {
        let sign = 1;
        if (x2 == x1) {
            if (y2 < y1) {
                sign = -1
            }
            for (let i = 1; i < Math.abs(y2 - y1); i++) {
                if (board[x1][y1 + (i * sign)].piece.name != "") {
                    return 0;
                }
            }
            if (board[x2][y2].piece.name == "") {
                return 1;
            } else {
                return 2;
            }

        }
        if (y2 == y1) {
            if (x2 < x1) {
                sign = -1
            }
            for (let i = 1; i < Math.abs(x2 - x1); i++) {
                if (board[x1 + (i * sign)][y1].piece.name != "") {
                    return 0;
                }
            }
            if (board[x2][y2].piece.name == "") {
                return 1;
            } else {
                return 2
            }
        }
        return 0;
    }

    const potentialQueenMove = (x1: number, y1: number, x2: number, y2: number) => {
        let moveType = 0;
        moveType = potentialBishopMove(x1, y1, x2, y2);
        if (!moveType) {
            moveType = potentialRookMove(x1, y1, x2, y2);
        }
        return moveType;
    }

    const potentialKnightMove = (x1: number, y1: number, x2: number, y2: number) => {
        if (Math.abs(x2 - x1) == 2 && Math.abs(y2 - y1) == 1 || Math.abs(y2 - y1) == 2 && Math.abs(x2 - x1) == 1) {
            if (board[x2][y2].piece.name == "") {
                return 1;
            } else {
                return 2;
            }
        } else {
            return 0
        }
    }

    const potentialKingMove = (x1: number, y1: number, x2: number, y2: number) => {
        if (Math.abs(x2 - x1) < 2 && Math.abs(y2 - y1) < 2) {
            if (board[x2][y2].piece.name == "") {
                return 1
            } else {
                return 2;
            }
        } else {
            if (Math.abs(x2 - x1) == 2 && Math.abs(y2 - y1) == 0) {
                if (!board[x1][y1].piece.moved) {
                    if (x2 == 6 && !board[7][y1].piece.moved && board[5][y1].piece.name == "") {
                        return 7;
                    }
                    if (x2 == 2 && !board[0][y1].piece.moved && board[3][y1].piece.name == "" && board[1][y1].piece.name == "") {
                        return 7;
                    }
                }
            }
        }
        return 0
    }

    const potentialPawnMove = (x1: number, y1: number, x2: number, y2: number) => {
        let relativeNewY = y2
        let relativeOldY = y1
        let promotion = 0;
        if (board[x1][y1].piece.color == "black") {
            relativeNewY = y1;
            relativeOldY = y2;
            promotion = 7;
        }
        if (relativeOldY - relativeNewY == 1) {

            if (x2 == x1 && board[x2][y2].piece.name == "") {
                if (y2 == promotion) {
                    return 5;
                } else {
                    return 1;
                }
            }
            if (Math.abs(x2 - x1) == 1) {

                if (board[x2][y2].piece.name != "") {

                    if (y2 == promotion) {
                        return 6;
                    } else {
                        return 2;
                    }
                }
                if (x1 != 7) {
                    if (board[x1 + 1][y1].piece.name == 'pawn' && x2 - x1 == 1) {

                        if (board[x1 + 1][y1].piece.doubleTurn == turn - 1 && board[x1 + 1][y1].piece.color != board[x1][y1].piece.color) {

                            return 4;
                        }
                    }
                }
                if (x1 != 0) {
                    if (board[x1 - 1][y1].piece.name == 'pawn' && x2 - x1 == -1) {

                        if (board[x1 - 1][y1].piece.doubleTurn == turn - 1 && board[x1 - 1][y1].piece.color != board[x1][y1].piece.color) {
                            return 4;
                        }
                    }
                }
            }

        } else if ((relativeOldY - relativeNewY == 2 && Math.abs(x2 - x1) == 0) && board[x1][y1].piece.moved == false && board[x2][y2].piece.name == "") {
            if (board[x1][y1].piece.color == 'white' && board[x1][y1 - 1].piece.name != "") {
                return 0
            } else if (board[x1][y1].piece.color == 'black' && board[x1][y1 + 1].piece.name != "") {
                return 0
            }
            return 3;
        }
        return 0;
    }

    const calculatePotentialMoves = (startX: number, startY: number) => {
        const piece = board[startX][startY].piece;
        let potentialMoves: MovesType = {};
        let playerColor = "white"
        if (turn %2 == 0){
            playerColor = "black"
        }
        if (piece.color != playerColor){
            return potentialMoves;
        }

        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                let moveType = 0

                if (board[x][y].piece.color == piece.color) {
                    continue;
                }

                switch (piece.name) {
                    case "pawn":
                        moveType = potentialPawnMove(startX, startY, x, y)
                        break;
                    case "bishop":
                        moveType = potentialBishopMove(startX, startY, x, y)
                        break;
                    case "rook":
                        moveType = potentialRookMove(startX, startY, x, y)
                        break;
                    case "queen":
                        moveType = potentialQueenMove(startX, startY, x, y);

                        break;
                    case "knight":
                        moveType = potentialKnightMove(startX, startY, x, y);
                        break;
                    case "king":
                        moveType = potentialKingMove(startX, startY, x, y)
                        break;

                    default:
                        break;

                }
                if (moveType == 0) {
                    continue;
                }
                const key = `${x},${y}`;
                let newMove = { x: x, y: y, type: "regular_move", piece: piece, double: false, enpassant: false, promotion: false, castle: false, confirmed: false }
                switch (moveType) {
                    case 1:
                        break;
                    case 2:
                        newMove.type = "capture_move"
                        break;
                    case 3:
                        newMove.double = true
                        break;
                    case 4:
                        newMove.type = "capture_move"
                        newMove.enpassant = true
                        break;
                    case 5:
                        newMove.promotion = true;
                        break;
                    case 6:
                        newMove.type = "capture_move"
                        newMove.promotion = true;
                        break;
                    case 7:
                        newMove.castle = true;
                        break;
                    default:
                        break;
                }
                let causesFriendlyCheck = evaluateCheck(newMove)
                let castleCheck = false
                if (newMove.castle) {

                    if (newMove.x == 6) {
                        castleCheck = evaluateCheck({ ...newMove, x: 5 })
                    } else {
                        castleCheck = evaluateCheck({ ...newMove, x: 3 })
                    }
                    if (check){
                        castleCheck = true;
                    }
                }

                if (!causesFriendlyCheck && !castleCheck) {

                    potentialMoves[key] = newMove
                }

            }
        }
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
                setMoves({})
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
                setMoves(potentialMoves)
                setBoard((prevBoard) =>
                    prevBoard.map((row) =>
                        row.map((square) => {
                            const newSquare = { ...square, selected: false, moveIndicator: "" }
                            if (square.x == newSquareX && square.y == newSquareY) {
                                return { ...square, selected: true }
                            }
                            Object.values(potentialMoves).forEach((move) => {
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
            const key = `${newSquareX},${newSquareY}`;
            const newMove = moves[key]
            if (newMove !== undefined) {
                //clicking a valid move when a piece is selected will move the piece
                setMoves({})
                movePiece(newMove, selectedSquare.x, selectedSquare.y);
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
                setMoves({})
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

    // const checkValidMove = (newX: number, newY: number, oldX: number, oldY: number) => {
    //     let valid = false;
    //     let enpassant = false;
    //     let doubleMove = false;
    //     let promotion = false;
    //     let castle = false;

    //     const newSquare = board[newX][newY]
    //     const oldSquare = board[oldX][oldY]
    //     const newPiece = newSquare.piece
    //     const oldPiece = oldSquare.piece

    //     const deltaX = Math.abs(newX - oldX);
    //     const deltaY = Math.abs(newY - oldY);

    //     if (newPiece.color == oldPiece.color) {
    //         return [valid, enpassant, doubleMove, promotion, castle]
    //     }
    //     if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
    //         return [valid, enpassant, doubleMove, promotion, castle]
    //     }

    //     const checkRookValid = () => {
    //         let sign = 1;
    //         if (newX == oldX) {
    //             if (newY < oldY) {
    //                 sign = -1
    //             }
    //             for (let i = 1; i < deltaY; i++) {
    //                 if (board[oldX][oldY + (i * sign)].piece.name != "") {
    //                     return false;
    //                 }
    //             }
    //             return true;

    //         }
    //         if (newY == oldY) {
    //             if (newX < oldX) {
    //                 sign = -1
    //             }
    //             for (let i = 1; i < deltaX; i++) {
    //                 if (board[oldX + (i * sign)][oldY].piece.name != "") {
    //                     return false;
    //                 }
    //             }
    //             return true;
    //         }
    //         return false;
    //     }

    //     const checkBishopValid = () => {
    //         if (deltaX == deltaY) {
    //             let signX = 1;
    //             let signY = 1;
    //             if (newX > oldX && newY < oldY) {
    //                 signY = -1;
    //             }
    //             if (newX < oldX && newY > oldY) {
    //                 signX = -1;
    //             }
    //             if (newX < oldX && newY < oldY) {
    //                 signX = -1;
    //                 signY = -1;
    //             }

    //             for (let i = 1; i < deltaX; i++) {
    //                 if (board[oldX + (i * signX)][oldY + (i * signY)].piece.name != "") {
    //                     return false
    //                 }
    //             }
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     }

    //     switch (oldPiece.name) {
    //         case 'pawn':
    //             let relativeNewY = newY
    //             let relativeOldY = oldY

    //             if (oldPiece.color == "black") {
    //                 relativeNewY = oldY;
    //                 relativeOldY = newY;
    //             }

    //             if (relativeOldY - relativeNewY == 1) {
    //                 if (newX == oldX && newPiece.name == "") {
    //                     valid = true;
    //                     break;
    //                 }
    //                 if (Math.abs(newX - oldX) == 1) {
    //                     if (newPiece.name != "") {
    //                         valid = true;
    //                         break;
    //                     }
    //                     if (oldX != 7) {
    //                         if (board[oldX + 1][oldY].piece.name == 'pawn') {
    //                             if (board[oldX + 1][oldY].piece.doubleTurn == turn - 1 && board[oldX + 1][oldY].piece.color != oldPiece.color) {
    //                                 valid = true;
    //                                 enpassant = true;
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                     if (oldX != 0) {
    //                         if (board[oldX - 1][oldY].piece.name == 'pawn') {
    //                             if (board[oldX - 1][oldY].piece.doubleTurn == turn - 1 && board[oldX - 1][oldY].piece.color != oldPiece.color) {
    //                                 valid = true;
    //                                 enpassant = true;
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                 }

    //             } else if (relativeOldY - relativeNewY == 2 && oldPiece.moved == false && newPiece.name == "") {
    //                 if (oldPiece.color == 'white' && board[oldX][oldY - 1].piece.name != "") {
    //                     return [valid, enpassant, doubleMove, promotion, castle];
    //                 } else if (oldPiece.color == 'black' && board[oldX][oldY + 1].piece.name != "") {
    //                     return [valid, enpassant, doubleMove, promotion, castle];
    //                 }
    //                 valid = true;
    //                 doubleMove = true;
    //                 break;
    //             }

    //             return [valid, enpassant, doubleMove, promotion, castle];
    //         case 'knight':
    //             if ((deltaX == 2 && deltaY == 1) || (deltaY == 2 && deltaX == 1)) {
    //                 valid = true;
    //                 break;
    //             } else {
    //                 return [valid, enpassant, doubleMove, promotion, castle];
    //             }
    //         case 'bishop':
    //             if (checkBishopValid()) {
    //                 valid = true;
    //                 break;
    //             } else {
    //                 return [valid, enpassant, doubleMove, promotion, castle]
    //             }

    //         case 'rook':
    //             if (checkRookValid()) {
    //                 valid = true;
    //                 break;
    //             } else {
    //                 return [valid, enpassant, doubleMove, promotion, castle]
    //             }

    //         case 'queen':
    //             if (checkBishopValid() || checkRookValid()) {
    //                 valid = true;
    //                 break;
    //             } else {
    //                 return [valid, enpassant, doubleMove, promotion, castle];
    //             }

    //         case 'king':
    //             if (deltaX < 2 && deltaY < 2) {
    //                 valid = true;
    //                 break;
    //             } else {
    //                 if (deltaX == 2 && deltaY == 0) {
    //                     if (!oldPiece.moved) {
    //                         if (newX == 6 && !board[7][oldY].piece.moved && board[5][oldY].piece.name == "") {
    //                             valid = true;
    //                             castle = true;
    //                             break;
    //                         }
    //                         if (newX == 2 && !board[0][oldY].piece.moved && board[3][oldY].piece.name == "" && board[1][oldY].piece.name == "") {
    //                             valid = true;
    //                             castle = true;
    //                             break;
    //                         }
    //                     }
    //                 }
    //                 return [valid, enpassant, doubleMove, promotion, castle];
    //             }
    //         default:
    //             return [valid, enpassant, doubleMove, promotion, castle];
    //     }


    //     if (oldPiece.color == 'white' && oldPiece.name == 'pawn' && newY == 0) {
    //         promotion = true
    //     }
    //     if (oldPiece.color == 'black' && oldPiece.name == 'pawn' && newY == 7) {
    //         promotion = true
    //     }
    //     return [valid, enpassant, doubleMove, promotion, castle];
    // }

    const evaluateCheck = (move: MoveType) => {
        let kingX = whiteKing.x;
        let kingY = whiteKing.y;
        let kingColor = "white"
        let check = false;
        const boardState = structuredClone(board)
        const attackers: PieceType[] = []

        if ((move.piece.color == "black" && !move.confirmed) || (move.piece.color == "white" && move.confirmed)) {
            kingX = blackKing.x;
            kingY = blackKing.y;
            kingColor = "black"
        }
        if (move.piece.name == "king") {
            kingX = move.x;
            kingY = move.y;
        }

        if (!move.confirmed) {
            boardState[move.x][move.y].piece = move.piece;
            boardState[move.piece.x][move.piece.y].piece = createNewPiece()
        }

        // check for rooks or queens to the right
        for (let x = kingX; x < 7; x++) {
            if (kingX == 7) break;
            const potentialAttacker = boardState[x + 1][kingY].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") continue;

            if (potentialAttacker.name == "rook" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
        }
        //check for rooks or queens to the left
        for (let x = kingX; x > 0; x--) {
            if (kingX == 0) break;
            const potentialAttacker = boardState[x - 1][kingY].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") continue;

            if (potentialAttacker.name == "rook" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
        }
        //check for rooks or queens above
        for (let y = kingY; y > 0; y--) {
            if (kingY == 0) break;
            const potentialAttacker = boardState[kingX][y - 1].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") continue;

            if (potentialAttacker.name == "rook" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
        }
        //check for rooks or queens below
        for (let y = kingY; y < 7; y++) {
            if (y == 7) break;
            const potentialAttacker = boardState[kingX][y + 1].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") continue;

            if (potentialAttacker.name == "rook" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
        }

        //check down/right diagonal
        let i = 1;
        while (kingX + i < 8 && kingY + i < 8) {
            const potentialAttacker = boardState[kingX + i][kingY + i].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") {
                i++
                continue;
            }
            if (potentialAttacker.name == "bishop" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
            i++
        }
        i = 1;
        //check up/right diagonal
        while (kingX + i < 8 && kingY - i >= 0) {
            const potentialAttacker = boardState[kingX + i][kingY - i].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") {
                i++
                continue;
            }
            if (potentialAttacker.name == "bishop" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
            i++
        }
        i = 1;
        //check up/left diagonal
        while (kingX - i >= 0 && kingY - i >= 0) {
            const potentialAttacker = boardState[kingX - i][kingY - i].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") {
                i++
                continue;
            }
            if (potentialAttacker.name == "bishop" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
            i++
        }
        i = 1;
        //check up/left diagonal
        while (kingX - i >= 0 && kingY + i < 8) {
            const potentialAttacker = boardState[kingX - i][kingY + i].piece;
            if (potentialAttacker.color == kingColor) break;
            if (potentialAttacker.name == "") {
                i++
                continue;
            }
            if (potentialAttacker.name == "bishop" || potentialAttacker.name == "queen") {
                check = true;
                attackers.push(potentialAttacker)
            } else {
                break;
            }
            i++
        }
        //check for knights
        for (let i = -2; i <= 2; i += 4) {
            for (let j = -1; j <= 1; j += 2) {
                let x = kingX + i;
                let y = kingY + j;
                let a = kingX - j;
                let b = kingY - i;
                let potentialAttacker = createNewPiece()
                if (!((x > 7 || x < 0) || (y > 7 || y < 0))) {
                    potentialAttacker = boardState[x][y].piece;
                    if (potentialAttacker.color != kingColor && potentialAttacker.name == "knight") {
                        check = true;
                        attackers.push(potentialAttacker);
                        break;
                    }
                }
                if (!((a > 7 || a < 0) || (b > 7 || b < 0))) {
                    potentialAttacker = boardState[a][b].piece;
                    if (potentialAttacker.color != kingColor && potentialAttacker.name == "knight") {
                        check = true;
                        attackers.push(potentialAttacker);
                        break;
                    }
                }
            }
        }

        //check for pawns
        const x1 = kingX + 1;
        const x2 = kingX - 1
        let y = kingY + 1;
        if (kingColor == "white") {
            y = kingY - 1
        }
        if (x1 <= 7 && (y >= 0 && y <= 7)) {
            const potentialAttacker = boardState[x1][y].piece;
            if (potentialAttacker.name == "pawn" && potentialAttacker.color != kingColor) {
                check = true;
                attackers.push(potentialAttacker)
            }
        }
        if (x2 >= 0 && (y >= 0 && y <= 7)) {
            const potentialAttacker = boardState[x2][y].piece;
            if (potentialAttacker.name == "pawn" && potentialAttacker.color != kingColor) {
                check = true;
                attackers.push(potentialAttacker)
            }
        }

        if (check) {
            if (move.confirmed) {
                setCheck(true)
            }
            return true;

        }
        if (move.confirmed){
            setCheck(false)
        }

        return false;
    }

    const movePiece = (newMove: MoveType, oldX: number, oldY: number) => {
        const newX = newMove.x;
        const newY = newMove.y;
        newMove.confirmed = true;
        setLastMove(newMove);
        setBoard((prevBoard) => {
            const newBoard = structuredClone(prevBoard);
            const movedPiece = board[oldX][oldY].piece

            newBoard[newX][newY].piece = { ...prevBoard[oldX][oldY].piece, x: newX, y: newY, moved: true, destination: '' };
            newBoard[oldX][oldY].piece = createNewPiece();

            if (movedPiece.name == "king") {
                if (movedPiece.color == "white") {
                    setWhiteKing((oldKing) => {
                        return { ...oldKing, x: newX, y: newY, check: false, checks: [] }
                    })
                } else {
                    setBlackKing((oldKing) => {

                        return { ...oldKing, x: newX, y: newY, check: false, checks: [] }
                    })
                }
            }
            if (newMove.castle) {
                if (newX == 6) {
                    newBoard[5][oldY].piece = { ...prevBoard[7][oldY].piece, x: 5, y: newY, moved: true, destination: '' };
                    newBoard[7][oldY].piece = createNewPiece();
                } else {
                    newBoard[3][oldY].piece = { ...prevBoard[0][oldY].piece, x: 3, y: newY, moved: true, destination: '' };
                    newBoard[0][oldY].piece = createNewPiece();
                }
            }
            if (newMove.double) {
                newBoard[newX][newY].piece.doubleTurn = turn;
            }
            if (newMove.enpassant) {
                if (newBoard[newX][newY].piece.color == 'white') {
                    newBoard[newX][newY + 1].piece = createNewPiece();
                } else {
                    newBoard[newX][newY - 1].piece = createNewPiece();
                }
            }
            if (newMove.promotion) {

                newBoard[newX][newY].piece.name = 'queen';
                newBoard[newX][newY].piece.id = 5;
            }
            return newBoard;
        })

        // evaluateCheck(newMove);

        setTurn((oldTurn) => oldTurn + 1);
    }

    useEffect(() => {
        const inCheck = evaluateCheck(lastMove)
        if (inCheck) {
            let color = "white"
            if (lastMove.piece.color == "white") {
                color = "black"
            }
            let checkmate = true
            board.forEach((row) => {
                if (!checkmate) return;
                row.forEach((square) => {
                    if (!checkmate) return;
                    if (square.piece.color == color) {
                        let potentialMoves = calculatePotentialMoves(square.x, square.y)
                        if (Object.keys(potentialMoves).length > 0) {
                            checkmate = false
                        }
                    }
                })
            })
            if (checkmate) {
                console.log("Checkmate!!!")
            }
        }
    }, [turn])

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