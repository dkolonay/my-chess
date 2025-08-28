import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createNewMove, createNewPiece, type BoardRow, type BoardType, type MoveType, type MovesType, type PieceType } from "../types/boardTypes";

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
const DEFAULT_FEN_STRING = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const LETTER_KEY = "abcdefgh"

for (let i = 0; i < 8; i++) {
    const row: BoardRow = [];
    for (let j = 0; j < 8; j++) {
        let dark = ((i % 2 == 0) && (j % 2 == 0)) || ((i % 2 != 0) && (j % 2 != 0))
        row.push({
            idx: `${LETTER_KEY[i]}${j + 1}`,
            x: i,
            y: j,
            selected: false,
            highlighted: false,
            top: false,
            moveIndicator: "",
            theme: dark ? 'dark' : 'light',
            piece: createNewPiece()
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
    const [lastMove, setLastMove] = useState<MoveType>({ x: 0, y: 0, type: "", piece: createNewPiece(), passantSquare: "-", enpassant: false, promotion: false, castle: false, confirmed: false })
    const [check, setCheck] = useState(false)
    const [whiteKing, setWhiteKing] = useState({ x: 4, y: 7, check: false, checks: [] })
    const [blackKing, setBlackKing] = useState({ x: 4, y: 0, check: false, checks: [] })
    const [flipped, setFlipped] = useState(false);

    const [activeColor, setActiveColor] = useState("w");
    const [castleRights, setCastleRights] = useState("KQkq");
    const [passantSquare, setPassantSquare] = useState("-")
    // const [halfTurn, setHalfTurn] = useState(0);
    const [turn, setTurn] = useState(1);

    const parseFenToBoard = (FenString: string) => {
        const [boardString, newActiveColor, newCastleRights, newPassantSquare, newHalfTurn, newTurn] = FenString.split(" ")
        const rankStrings = boardString.split("/")
        const newBoard = structuredClone(DEFAULT_BOARD);
        for (let rank = 0; rank < 8; rank++) {
            let rowLength = rankStrings[7 - rank].length;
            let file = 0
            for (let j = 0; j < rowLength; j++) {

                let char = rankStrings[7 - rank][j]

                if (/\d/.test(char)) {
                    file += parseInt(char)
                    continue;
                } else {
                    const newPiece = createNewPiece()
                    newPiece.x = file
                    newPiece.y = rank
                    if (char.toLowerCase() === char) {
                        newPiece.color = "b"
                    } else {
                        newPiece.color = "w"
                    }

                    switch (char.toLowerCase()) {
                        case "p":
                            newPiece.name = "pawn";
                            newPiece.value = 1
                            break;
                        case "n":
                            newPiece.name = "knight";
                            newPiece.value = 3
                            break;
                        case "b":
                            newPiece.name = "bishop";
                            newPiece.value = 3
                            break;
                        case "r":
                            newPiece.name = "rook";
                            newPiece.value = 5
                            break;
                        case "q":
                            newPiece.name = "queen";
                            newPiece.value = 9
                            break;
                        case "k":
                            newPiece.name = "king";
                            newPiece.value = 100
                            break;
                        default:
                            break;
                    }
                    newBoard[file][rank].piece = newPiece
                    file++
                }

            }
        }
        setBoard(newBoard);
        setActiveColor(newActiveColor);
        setCastleRights(newCastleRights);
        setPassantSquare(newPassantSquare);
        // setHalfTurn(parseInt(newHalfTurn));
        setTurn(parseInt(newTurn));
    }

    const handleFlip = () => {
        setFlipped(!flipped)
    }

    const findPotentialRookMoves = (startX: number, startY: number): MovesType => {
        const potentialMoves: MovesType = {};
        let x = startX;
        let y = startY;

        const createRookMove = (newX: number, newY: number) => {
            let piece = structuredClone(board[startX][startY].piece)
            let potentialMove = createNewMove(newX, newY, "", piece);

            if (board[newX][newY].piece.color == board[startX][startY].piece.color) {
                return potentialMove
            } else {
                potentialMove.type = "regular_move"
                // if (!evaluateCheck(potentialMove)) potentialMoves[key] = potentialMove
                if (board[newX][newY].piece.name != "") {
                    potentialMove.type = "capture_move"
                }
                return potentialMove
            }

        }

        x = startX
        while (x < 7 && startX < 7) {
            x++
            let key = `${x},${startY}`
            let newRookMove = createRookMove(x, startY)
            if (newRookMove.type == "") break;
            potentialMoves[key] = newRookMove;
            if (newRookMove.type != "regular_move") break;
        }

        x = startX
        while (x > 0 && startX > 0) {
            x--
            let key = `${x},${startY}`
            let newRookMove = createRookMove(x, startY)
            if (newRookMove.type == "") break;
            potentialMoves[key] = newRookMove;
            if (newRookMove.type != "regular_move") break;
        }

        y = startY
        while (y < 7 && startY < 7) {
            y++
            let key = `${startX},${y}`
            let newRookMove = createRookMove(startX, y)
            if (newRookMove.type == "") break;
            potentialMoves[key] = newRookMove;
            if (newRookMove.type != "regular_move") break;
        }

        y = startY
        while (y > 0 && startY > 0) {
            y--
            let key = `${startX},${y}`
            let newRookMove = createRookMove(startX, y)
            if (newRookMove.type == "") break;
            potentialMoves[key] = newRookMove;
            if (newRookMove.type != "regular_move") break;
        }
        return potentialMoves
    }

    const findPotentialKnightMoves = (startX: number, startY: number): MovesType => {
        const potentialMoves: MovesType = {}
        const createKnightMove = (x: number, y: number) => {
            let piece = structuredClone(board[startX][startY].piece)

            let knightMove = createNewMove(x, y, "", piece)
            if (!((x > 7 || x < 0) || (y > 7 || y < 0))) {
                if (board[x][y].piece.color != board[startX][startY].piece.color) {
                    if (board[x][y].piece.name == "") {
                        knightMove.type = "regular_move"
                    } else {
                        knightMove.type = "capture_move"
                    }
                }
            }
            return knightMove;
        }
        for (let i = -2; i <= 2; i += 4) {
            for (let j = -1; j <= 1; j += 2) {
                let x = startX + i;
                let y = startY + j;
                let key = `${x},${y}`
                let potentialMove1 = createKnightMove(x, y)
                if (potentialMove1.type != "") {
                    potentialMoves[key] = potentialMove1
                }

                x = startX - j;
                y = startY - i;
                key = `${x},${y}`
                let potentialMove2 = createKnightMove(x, y)
                if (potentialMove2.type != "") {
                    potentialMoves[key] = potentialMove2
                }

            }
        }
        return potentialMoves;
    }

    const findPotentialBishopMoves = (startX: number, startY: number): MovesType => {
        const potentialMoves: MovesType = {}
        let x = startX
        let y = startY

        const createBishopMove = (newX: number, newY: number) => {
            let piece = structuredClone(board[startX][startY].piece)

            let potentialMove = createNewMove(newX, newY, "", piece);

            if (board[newX][newY].piece.color == board[startX][startY].piece.color) {
                return potentialMove
            } else {
                potentialMove.type = "regular_move"
                if (board[newX][newY].piece.name != "") {
                    potentialMove.type = "capture_move"
                }
                return potentialMove
            }

        }
        x = startX
        y = startY
        while (x < 7 && y < 7 && startX < 7 && startY < 7) {
            x++
            y++
            let key = `${x},${y}`
            let newBishopMove = createBishopMove(x, y)
            if (newBishopMove.type == "") break;
            potentialMoves[key] = newBishopMove;
            if (newBishopMove.type != "regular_move") break;
        }
        x = startX
        y = startY
        while (x < 7 && y > 0 && startX < 7 && startY > 0) {
            x++
            y--
            let key = `${x},${y}`
            let newBishopMove = createBishopMove(x, y)
            if (newBishopMove.type == "") break;
            potentialMoves[key] = newBishopMove;
            if (newBishopMove.type != "regular_move") break;
        }
        x = startX
        y = startY
        while (x > 0 && y > 0 && startX > 0 && startY > 0) {
            x--
            y--
            let key = `${x},${y}`
            let newBishopMove = createBishopMove(x, y)
            if (newBishopMove.type == "") break;
            potentialMoves[key] = newBishopMove;
            if (newBishopMove.type != "regular_move") break;
        }
        x = startX
        y = startY
        while (x > 0 && y < 7 && startX > 0 && startY < 7) {
            x--
            y++
            let key = `${x},${y}`
            let newBishopMove = createBishopMove(x, y)
            if (newBishopMove.type == "") break;
            potentialMoves[key] = newBishopMove;
            if (newBishopMove.type != "regular_move") break;
        }
        return potentialMoves
    }

    const findPotentialKingMoves = (startX: number, startY: number): MovesType => {
        const potentialMoves: MovesType = {}
        const createKingMove = (x: number, y: number) => {
            let piece = structuredClone(board[startX][startY].piece)

            let potentialMove = createNewMove(x, y, "", piece)
            if (board[x][y].piece.color != board[startX][startY].piece.color) {
                if (board[x][y].piece.name == "") {
                    potentialMove.type = "regular_move"
                } else {
                    potentialMove.type = "capture_move"
                }
            }

            return potentialMove;
        }

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let x = startX + i
                let y = startY + j
                if (x > 7 || y > 7 || x < 0 || y < 0) {
                    continue;
                }
                let kingMove = createKingMove(x, y)
                if (kingMove.type != "") {
                    let key = `${x},${y}`
                    potentialMoves[key] = kingMove
                }
            }
        }
        let potentialCastleRights = "KQ"
        if (board[startX][startY].piece.color == "b") {
            potentialCastleRights = potentialCastleRights.toLowerCase()
        }
        if (castleRights.includes(potentialCastleRights[0])) {
            if (board[startX + 1][startY].piece.name == "" && board[startX + 2][startY].piece.name == "") {
                const newMove = createNewMove(startX + 2, startY, "regular_move", structuredClone(board[startX][startY].piece))
                newMove.castle = true
                potentialMoves[`${startX + 2},${startY}`] = newMove
            }
        }
        if (castleRights.includes(potentialCastleRights[1])) {
            if (board[startX - 1][startY].piece.name == "" && board[startX - 2][startY].piece.name == "" && board[startX - 3][startY].piece.name == "") {
                const newMove = createNewMove(startX - 2, startY, "regular_move", structuredClone(board[startX][startY].piece))
                newMove.castle = true
                potentialMoves[`${startX - 2},${startY}`] = newMove
            }
        }


        return potentialMoves
    }

    const findPotentialPawnMoves = (startX: number, startY: number): MovesType => {
        const potentialMoves: MovesType = {}
        let piece = structuredClone(board[startX][startY].piece)

        const moveColor = board[startX][startY].piece.color;
        let x = startX
        let y = startY + 1

        const handlePawnCapture = (x: number, y: number) => {
            const newMove = createNewMove(x, y, "", piece)
            if (board[x][y].piece.color != moveColor && board[x][y].piece.name != "") {
                newMove.type = "capture_move"
                if (y == 0 || y == 7) {
                    newMove.promotion = true;
                }
                potentialMoves[`${x},${y}`] = newMove
            }

            if (`${LETTER_KEY[x]}${y}` === passantSquare) {
                newMove.type = "capture_move";
                newMove.enpassant = true;
                potentialMoves[`${x},${y}`] = newMove
            }
        }

        if (moveColor == "b") {
            y = startY - 1;
        }
        if (board[x][y].piece.name == "") {
            const newMove = createNewMove(x, y, "regular_move", piece)
            if (y == 0 || y == 7) {
                newMove.promotion = true;
            }
            potentialMoves[`${x},${y}`] = newMove;
        }
        x = startX + 1
        if (x < 8) {
            handlePawnCapture(x, y)
        }
        x = startX - 1
        if (x >= 0) {
            handlePawnCapture(x, y)
        }
        let offset = 2
        let requiredStart = 1
        if (moveColor == "b") {
            offset = -2
            requiredStart = 6
        }
        if (startY == requiredStart && board[startX][startY + (offset / 2)].piece.name == "" && board[startX][startY + offset].piece.name == "") {
            const newMove = createNewMove(startX, startY + offset, "regular_move", piece)
            newMove.passantSquare = `${LETTER_KEY[startX]}${[startY + (offset / 2)]}`;
            potentialMoves[`${startX},${startY + offset}`] = newMove;
        }


        return potentialMoves;
    }

    const calculatePotentialMoves = (startX: number, startY: number) => {
        const piece = board[startX][startY].piece;
        let potentialMoves: MovesType = {};

        // if (piece.color != activeColor) {
        //     return potentialMoves;
        // }
        switch (piece.name) {
            case "pawn":
                potentialMoves = findPotentialPawnMoves(startX, startY);
                return potentialMoves;
            case "knight":
                potentialMoves = findPotentialKnightMoves(startX, startY);
                return potentialMoves;
            case "bishop":
                potentialMoves = findPotentialBishopMoves(startX, startY);
                return potentialMoves;
            case "rook":
                potentialMoves = findPotentialRookMoves(startX, startY)
                return potentialMoves;
            case "queen":
                potentialMoves = findPotentialRookMoves(startX, startY)
                potentialMoves = { ...potentialMoves, ...findPotentialBishopMoves(startX, startY) }
                return potentialMoves;
            case "king":
                potentialMoves = findPotentialKingMoves(startX, startY);
                return potentialMoves;
            default:
                return potentialMoves;

        }
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

    const evaluateCheck = (move: MoveType) => {
        let kingX = whiteKing.x;
        let kingY = whiteKing.y;
        let kingColor = "w"
        let check = false;
        const boardState = structuredClone(board)
        const attackers: PieceType[] = []

        if ((move.piece.color == "b" && !move.confirmed) || (move.piece.color == "w" && move.confirmed)) {
            kingX = blackKing.x;
            kingY = blackKing.y;
            kingColor = "b"
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
        if (kingColor == "w") {
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
        if (move.confirmed) {
            setCheck(false)
        }

        return false;
    }

    const movePiece = (newMove: MoveType, oldX: number, oldY: number) => {
        const newX = newMove.x;
        const newY = newMove.y;
        newMove.confirmed = true;
        setPassantSquare(newMove.passantSquare)
        setLastMove(newMove);
        setBoard((prevBoard) => {
            const newBoard = structuredClone(prevBoard);
            const movedPiece = board[oldX][oldY].piece

            newBoard[newX][newY].piece = { ...prevBoard[oldX][oldY].piece, x: newX, y: newY, moved: true, destination: '' };
            newBoard[oldX][oldY].piece = createNewPiece();

            if (movedPiece.name == "king") {
                if (movedPiece.color == "w") {
                    setCastleRights((prevRights) => {
                        return prevRights.replace(/[KQ]/g, "")
                    })
                    setWhiteKing((oldKing) => {
                        return { ...oldKing, x: newX, y: newY, check: false, checks: [] }
                    })
                } else {
                    setCastleRights((prevRights) => {
                        return prevRights.replace(/[kq]/g, "")
                    })
                    setBlackKing((oldKing) => {

                        return { ...oldKing, x: newX, y: newY, check: false, checks: [] }
                    })
                }
            }
            if (movedPiece.name == "rook") {
                if (movedPiece.x == 7) {

                    if (movedPiece.color == "w") {
                        setCastleRights((prevRights) => {
                            return prevRights.replace("K", "")
                        })
                    } else {
                        setCastleRights((prevRights) => {
                            return prevRights.replace("k", "")
                        })
                    }
                }
                if (movedPiece.x == 0) {
                    if (movedPiece.color == "w") {
                        setCastleRights((prevRights) => {
                            return prevRights.replace("Q", "")
                        })
                    } else {
                        setCastleRights((prevRights) => {
                            return prevRights.replace("q", "")
                        })
                    }
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
            
            if (newMove.enpassant) {
                if (newBoard[newX][newY].piece.color == "w") {
                    newBoard[newX][newY - 1].piece = createNewPiece();
                } else {
                    newBoard[newX][newY + 1].piece = createNewPiece();
                }
                setPassantSquare("-")
            }
            if (newMove.promotion) {

                newBoard[newX][newY].piece.name = 'queen';
                newBoard[newX][newY].piece.value = 9;
            }
            return newBoard;
        })

        // evaluateCheck(newMove);

        setTurn((oldTurn) => oldTurn + 1);
    }

    useEffect(() => {
        parseFenToBoard(DEFAULT_FEN_STRING)
    }, [])

    useEffect(() => {
        console.log(passantSquare)
        // const inCheck = evaluateCheck(lastMove)
        // if (inCheck) {
        //     let color = "w"
        //     if (lastMove.piece.color == "w") {
        //         color = "b"
        //     }
        //     let checkmate = true
        //     board.forEach((row) => {
        //         if (!checkmate) return;
        //         row.forEach((square) => {
        //             if (!checkmate) return;
        //             if (square.piece.color == color) {
        //                 let potentialMoves = calculatePotentialMoves(square.x, square.y)
        //                 if (Object.keys(potentialMoves).length > 0) {
        //                     checkmate = false
        //                 }
        //             }
        //         })
        //     })
        //     if (checkmate) {
        //     }
        // }
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

//En passant square is wrong notationally but functional
//Functions for setting new pieces in potential moves are inconsistent
//Check needs to be rewritten and implemented with new logic
//FEN state needs to be updated on move
//FEN state history (for 3 move repetition and potential to go back to older moves)
//reimplement animations
//Only active color should be able to select pieces and move