import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createNewMove, createNewPiece, type BoardRow, type BoardType, type MoveType, type MovesType} from "../types/boardTypes";

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
// const DEFAULT_FEN_STRING = "1nb2bnr/r1qpp1pp/1pp2k2/pB6/P3R3/1P2P1Q1/N1PP2PP/2B1K2R w - K 10 21"
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

const parseFenToBoard = (FenString: string) => {

    const [boardString, newActiveColor, newCastleRights, newPassantSquare, newHalfTurn, newTurn] = FenString.split(" ")

    const rankStrings = boardString.split("/")
    const newBoard: BoardType = structuredClone(DEFAULT_BOARD);
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
                        newPiece.fenChar = newPiece.color == "w" ? "P" : "p"
                        newPiece.value = 1
                        break;
                    case "n":
                        newPiece.name = "knight";
                        newPiece.fenChar = newPiece.color == "w" ? "N" : "n"
                        newPiece.value = 3
                        break;
                    case "b":
                        newPiece.name = "bishop";
                        newPiece.fenChar = newPiece.color == "w" ? "B" : "b"
                        newPiece.value = 3
                        break;
                    case "r":
                        newPiece.name = "rook";
                        newPiece.fenChar = newPiece.color == "w" ? "R" : "r"
                        newPiece.value = 5
                        break;
                    case "q":
                        newPiece.name = "queen";
                        newPiece.fenChar = newPiece.color == "w" ? "Q" : "q"
                        newPiece.value = 9
                        break;
                    case "k":
                        newPiece.name = "king";
                        newPiece.fenChar = newPiece.color == "w" ? "K" : "k"
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

    return [newBoard, newActiveColor, newCastleRights, newPassantSquare, newHalfTurn, newTurn]
}

const parseFenFromBoardState = (newBoard: BoardType, newActiveColor: string, newCastleRights: string, newPassantSquare: string, newHalfTurn: number, newTurn: number) => {
    let fenString = ""
    const empties = [0, 0, 0, 0, 0, 0, 0, 0]
    const rowStrings = ["", "", "", "", "", "", "", ""]
    for (let i = 0; i < 8; i++) {
        for (let j = 7; j >= 0; j--) {
            if (newBoard[i][j].piece.fenChar != "") {
                if (empties[j] > 0) {
                    rowStrings[j] += empties[j].toString()
                    empties[j] = 0
                }
                rowStrings[j] += newBoard[i][j].piece.fenChar
            } else {
                empties[j] += 1
            }
        }
    }
    for (let i = 0; i < 8; i++) {
        if (empties[i] > 0) {
            rowStrings[i] += empties[i].toString()
        }
    }

    for (let i = 7; i >= 0; i--) {
        fenString += rowStrings[i];
        if (i > 0) {
            fenString += "/"
        }
    }
    fenString += ` ${newActiveColor}`
    fenString += ` ${newCastleRights}`
    fenString += ` ${newPassantSquare}`
    fenString += ` ${newHalfTurn}`
    fenString += ` ${newTurn}`

    return fenString;
}

export const BoardContext = createContext<BoardContextType | null>(null);

export default function BoardContextProvider({
    children,
}: BoardContextProviderProps) {
    // const [isFirstRender, setFirstRender] = useState(true)

    const [initialBoard, initialActiveColor, initialCastleRights, initialPassantSquare, initialHalfTurn, initialTurn] = parseFenToBoard(DEFAULT_FEN_STRING)

    if (typeof initialBoard === "string" || typeof initialHalfTurn != "string" || typeof initialTurn != "string" || typeof initialCastleRights != "string") {
        return
    }

    const [selectedSquare, setSelectedSquare] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });
    const [moves, setMoves] = useState<MovesType>({})
    const [lastMove, setLastMove] = useState<MoveType>({
        x: 0, y: 0, type: "", piece: {
            x: 0,
            y: 0,
            name: "",
            fenChar: "",
            value: 0,
            color: "",
            moved: false,
            doubleTurn: 0,
            destination: ""
        }, passantSquare: "-", enpassant: false, promotion: false, castle: false, confirmed: true
    })
    const [check, setCheck] = useState(false)
    const [flipped, setFlipped] = useState(false);

    const [board, setBoard] = useState<BoardType>(initialBoard);
    const [activeColor, setActiveColor] = useState(initialActiveColor);
    const [castleRights, setCastleRights] = useState(initialCastleRights);
    const [passantSquare, setPassantSquare] = useState(initialPassantSquare)
    const [halfTurn, setHalfTurn] = useState(parseInt(initialHalfTurn));
    const [turn, setTurn] = useState(parseInt(initialTurn));

    const [fenString, setFenString] = useState(DEFAULT_FEN_STRING)
    const [moveHistory, setMoveHistory] = useState([DEFAULT_FEN_STRING])



    const handleFlip = () => {
        setFlipped(!flipped)
    }



    const findPotentialRookMoves = (startX: number, startY: number, boardState: BoardType, checkTest: boolean): MovesType => {
        const potentialMoves: MovesType = {};
        let x = startX;
        let y = startY;

        const createRookMove = (newX: number, newY: number) => {
            let piece = structuredClone(boardState[startX][startY].piece)
            let potentialMove = createNewMove(newX, newY, "", piece);

            if (boardState[newX][newY].piece.color == boardState[startX][startY].piece.color) {
                return potentialMove
            } else {
                let causesCheck = false;
                if (!checkTest) {
                    causesCheck = evaluateCheck(potentialMove);
                }

                if (causesCheck) return potentialMove;
                potentialMove.type = "regular_move"
                if (boardState[newX][newY].piece.name != "") {
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

    const findPotentialKnightMoves = (startX: number, startY: number, boardState: BoardType, checkTest: boolean): MovesType => {
        const potentialMoves: MovesType = {}
        const createKnightMove = (x: number, y: number) => {
            let piece = structuredClone(boardState[startX][startY].piece)

            let knightMove = createNewMove(x, y, "", piece)
            if (!((x > 7 || x < 0) || (y > 7 || y < 0))) {
                if (boardState[x][y].piece.color != boardState[startX][startY].piece.color) {
                    let causesCheck = false
                    if (!checkTest) {
                        causesCheck = evaluateCheck(knightMove)
                    }
                    if (causesCheck) return knightMove;
                    if (boardState[x][y].piece.name == "") {
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

    const findPotentialBishopMoves = (startX: number, startY: number, boardState: BoardType, checkTest: boolean): MovesType => {
        const potentialMoves: MovesType = {}
        let x = startX
        let y = startY

        const createBishopMove = (newX: number, newY: number) => {
            let piece = structuredClone(boardState[startX][startY].piece)

            let potentialMove = createNewMove(newX, newY, "", piece);

            if (boardState[newX][newY].piece.color == boardState[startX][startY].piece.color) {
                return potentialMove
            } else {
                let causesCheck = false
                if (!checkTest) {
                    causesCheck = evaluateCheck(potentialMove)
                }
                if (causesCheck) return potentialMove;
                potentialMove.type = "regular_move"
                if (boardState[newX][newY].piece.name != "") {
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

    const findPotentialKingMoves = (startX: number, startY: number, boardState: BoardType, checkTest: boolean): MovesType => {
        const potentialMoves: MovesType = {}
        const createKingMove = (x: number, y: number) => {
            let piece = structuredClone(boardState[startX][startY].piece)

            let potentialMove = createNewMove(x, y, "", piece)
            let causesCheck = false;
            if (!checkTest) {
                causesCheck = evaluateCheck(potentialMove)
            }
            if (causesCheck) return potentialMove;

            if (boardState[x][y].piece.color != boardState[startX][startY].piece.color) {
                if (boardState[x][y].piece.name == "") {
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
        if (boardState[startX][startY].piece.color == "b") {
            potentialCastleRights = potentialCastleRights.toLowerCase()
        }
        if (!checkTest && !check) {
            if (castleRights.includes(potentialCastleRights[0])) {
                if (boardState[startX + 1][startY].piece.name == "" && boardState[startX + 2][startY].piece.name == "") {
                    const newMove = createNewMove(startX + 2, startY, "", structuredClone(boardState[startX][startY].piece))
                    const intermediateMove = createNewMove(startX + 1, startY, "", structuredClone(boardState[startX][startY].piece))
                    if (!(evaluateCheck(newMove) || evaluateCheck(intermediateMove))) {
                        newMove.type = "regular_move"
                        newMove.castle = true
                        potentialMoves[`${startX + 2},${startY}`] = newMove
                    }
                }
            }
            if (castleRights.includes(potentialCastleRights[1])) {
                if (boardState[startX - 1][startY].piece.name == "" && boardState[startX - 2][startY].piece.name == "" && boardState[startX - 3][startY].piece.name == "") {
                    const newMove = createNewMove(startX - 2, startY, "", structuredClone(boardState[startX][startY].piece))
                    const intermediateMove = createNewMove(startX - 1, startY, "", structuredClone(boardState[startX][startY].piece))

                    if (!(evaluateCheck(newMove) || evaluateCheck(intermediateMove))) {
                        newMove.type = "regular_move"
                        newMove.castle = true
                        potentialMoves[`${startX - 2},${startY}`] = newMove
                    }

                }
            }
        }

        return potentialMoves
    }

    const findPotentialPawnMoves = (startX: number, startY: number, boardState: BoardType): MovesType => {
        const potentialMoves: MovesType = {}
        let piece = structuredClone(boardState[startX][startY].piece)

        const moveColor = boardState[startX][startY].piece.color;
        let x = startX
        let y = startY + 1

        let offset = 1
        let requiredStart = 1
        if (moveColor == "b") {
            offset = -1
            requiredStart = 6
        }

        const handlePawnCapture = (x: number, y: number) => {
            const newMove = createNewMove(x, y, "", piece)
            if (boardState[x][y].piece.color != moveColor && boardState[x][y].piece.name != "") {
                newMove.type = "capture_move"
                if (y == 0 || y == 7) {
                    newMove.promotion = true;
                }
                potentialMoves[`${x},${y}`] = newMove
            }

            if (`${LETTER_KEY[x]}${y + 1}` === passantSquare) {
                newMove.type = "capture_move";
                newMove.enpassant = true;
                potentialMoves[`${x},${y}`] = newMove
            }
        }

        if (moveColor == "b") {
            y = startY - 1;
        }

        if (boardState[x][y].piece.name == "") {
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

        offset *= 2;
        if (startY == requiredStart && boardState[startX][startY + (offset / 2)].piece.name == "" && boardState[startX][startY + offset].piece.name == "") {
            const newMove = createNewMove(startX, startY + offset, "regular_move", piece)
            newMove.passantSquare = `${LETTER_KEY[startX]}${[startY + (offset == 2 ? offset : 0)]}`;
            potentialMoves[`${startX},${startY + offset}`] = newMove;
        }

        for (const [key, move] of Object.entries(potentialMoves)) {
            if (evaluateCheck(move)) {
                delete potentialMoves[key]
            }
        }




        return potentialMoves;
    }

    const calculatePotentialMoves = (startX: number, startY: number) => {

        const piece = board[startX][startY].piece;
        let potentialMoves: MovesType = {};

        if (piece.color != activeColor) {
            return potentialMoves;
        }
        switch (piece.name) {
            case "pawn":
                potentialMoves = findPotentialPawnMoves(startX, startY, board);
                break;
            case "knight":
                potentialMoves = findPotentialKnightMoves(startX, startY, board, false);
                break;
            case "bishop":
                potentialMoves = findPotentialBishopMoves(startX, startY, board, false);
                break;
            case "rook":
                potentialMoves = findPotentialRookMoves(startX, startY, board, false)
                break;
            case "queen":
                potentialMoves = findPotentialRookMoves(startX, startY, board, false)
                potentialMoves = { ...potentialMoves, ...findPotentialBishopMoves(startX, startY, board, false) }
                break;
            case "king":
                potentialMoves = findPotentialKingMoves(startX, startY, board, false);
                break;
            default:
                break;

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

    const evaluateCheck = (move: MoveType) => {

        let kingX = 0
        let kingY = 0
        let kingColor = activeColor
        let check = false;
        const boardState = structuredClone(board)

        //This is broken beyond comprehension. wff???
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardState[i][j].piece.name === "king" && boardState[i][j].piece.color === kingColor) {

                    kingX = i
                    kingY = j
                }
            }
        }

        if (move.piece.name == "king" && !move.confirmed) {
            kingX = move.x;
            kingY = move.y;
        }

        if (!move.confirmed) {
            boardState[move.x][move.y].piece = move.piece;
            boardState[move.piece.x][move.piece.y].piece = createNewPiece()
        }


        const potentialRookAttacks = findPotentialRookMoves(kingX, kingY, boardState, true)
        Object.values(potentialRookAttacks).forEach((rookMove) => {
            if (boardState[rookMove.x][rookMove.y].piece.name == "rook" || boardState[rookMove.x][rookMove.y].piece.name == "queen") {
                check = true
            }
        })
        const potentialBishopAttacks = findPotentialBishopMoves(kingX, kingY, boardState, true)
        Object.values(potentialBishopAttacks).forEach((bishopMove) => {
            if (boardState[bishopMove.x][bishopMove.y].piece.name == "bishop" || boardState[bishopMove.x][bishopMove.y].piece.name == "queen") {

                check = true
            }
        })
        const potentialKnightAttacks = findPotentialKnightMoves(kingX, kingY, boardState, true)
        Object.values(potentialKnightAttacks).forEach((knightMove) => {
            if (boardState[knightMove.x][knightMove.y].piece.name == "knight") {

                check = true
            }
        })
        const potentialKingAttacks = findPotentialKingMoves(kingX, kingY, boardState, true)
        Object.values(potentialKingAttacks).forEach((kingMove) => {
            if (boardState[kingMove.x][kingMove.y].piece.name == "king") {

                check = true
            }
        })

        let offset = 1;
        let boardEnd = 7;

        if (kingColor == "b") {
            offset = -1;
            boardEnd = 0
        }

        if (kingY != boardEnd) {
            if (kingX < 7) {

                if (boardState[kingX + 1][kingY + offset].piece.name == "pawn" && boardState[kingX + 1][kingY + offset].piece.color != kingColor) {

                    check = true

                }
            }
            if (kingX > 0) {
                if (boardState[kingX - 1][kingY + offset].piece.name == "pawn" && boardState[kingX - 1][kingY + offset].piece.color != kingColor) {
                    check = true
                }
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
        const movedPiece = board[oldX][oldY].piece

        let newBoard: BoardType = structuredClone(board)
        let newActiveColor = activeColor
        let newCastleRights = castleRights
        let newPassantSquare = newMove.passantSquare
        let newHalfTurn = halfTurn
        let newTurn = turn

        newMove.confirmed = true;

        if (activeColor == "b") {
            newTurn = turn + 1;
            newActiveColor = "w"
        } else {
            newActiveColor = "b"
        }


        if (newMove.piece.name == "pawn" || newMove.type == "capture_move") {
            newHalfTurn = 0;
        } else {
            newHalfTurn = halfTurn + 1
        }

        if (movedPiece.name == "king") {
            if (movedPiece.color == "w") {
                newCastleRights = castleRights.replace(/[KQ]/g, "")
                if (newCastleRights == "") {
                    newCastleRights = "-"
                }
            } else {

                newCastleRights = castleRights.replace(/[kq]/g, "")
                if (newCastleRights == "") {
                    newCastleRights = "-"
                }

            }
        }
        if (movedPiece.name == "rook") {
            if (movedPiece.x == 7) {

                if (movedPiece.color == "w") {

                    newCastleRights = castleRights.replace("K", "")
                    if (newCastleRights == "") {
                        newCastleRights = "-"
                    }

                } else {

                    newCastleRights = castleRights.replace("k", "")
                    if (newCastleRights == "") {
                        newCastleRights = "-"
                    }

                }
            }
            if (movedPiece.x == 0) {
                if (movedPiece.color == "w") {

                    newCastleRights = castleRights.replace("Q", "")
                    if (newCastleRights == "") {
                        newCastleRights = "-"
                    }

                } else {

                    newCastleRights = castleRights.replace("q", "")
                    if (newCastleRights == "") {
                        newCastleRights = "-"
                    }

                }
            }
        }

        newBoard[newX][newY].piece = { ...newBoard[oldX][oldY].piece, x: newX, y: newY, moved: true, destination: '' };
        newBoard[oldX][oldY].piece = createNewPiece();

        if (newMove.castle) {
            if (newX == 6) {
                newBoard[5][oldY].piece = { ...newBoard[7][oldY].piece, x: 5, y: newY, moved: true, destination: '' };
                newBoard[7][oldY].piece = createNewPiece();
            } else {
                newBoard[3][oldY].piece = { ...newBoard[0][oldY].piece, x: 3, y: newY, moved: true, destination: '' };
                newBoard[0][oldY].piece = createNewPiece();
            }
        }

        if (newMove.enpassant) {
            if (newBoard[newX][newY].piece.color == "w") {
                newBoard[newX][newY - 1].piece = createNewPiece();
            } else {
                newBoard[newX][newY + 1].piece = createNewPiece();
            }
            newPassantSquare = "-"

        }
        if (newMove.promotion) {

            newBoard[newX][newY].piece.name = 'queen';
            newBoard[newX][newY].piece.value = 9;
        }

        const newFenString = parseFenFromBoardState(newBoard, newActiveColor, newCastleRights, newPassantSquare, newHalfTurn, newTurn);

        setBoard(newBoard)
        setActiveColor(newActiveColor)
        setCastleRights(newCastleRights)
        setPassantSquare(newPassantSquare)
        setHalfTurn(newHalfTurn)
        setTurn(newTurn)

        setFenString(newFenString);

        setLastMove(newMove);
        setMoveHistory((prevHistory)=>{
            return [...prevHistory, newFenString]
        })

    }

    useEffect(() => {
        parseFenToBoard(DEFAULT_FEN_STRING)
    }, [])

    useEffect(() => {
        if (halfTurn == 100) {
            console.log("Draw by 50 turn rule :(")
        }

        const inCheck = evaluateCheck(lastMove)
        console.log(inCheck)
        if (inCheck) {
            let checkmate = true
            board.forEach((row) => {
                if (!checkmate) return;
                row.forEach((square) => {
                    if (!checkmate) return;
                    if (square.piece.color == activeColor) {

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

        const newMoveTester = fenString.split(" ").slice(0, 4).join(" ")

        const repeatedMoves = moveHistory.filter((oldMove) => {
            let oldMoveTester = oldMove.split(" ").slice(0, 4).join(" ")
            return oldMoveTester === newMoveTester;
        })

        if(repeatedMoves.length > 2){
            console.log("Draw by 3-fold repetition")
        }

        // if (isFirstRender) {
        //     setFirstRender(false)
        //     return
        // }

    }, [activeColor])





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
//Castled rook doesn't cause check
//En passant square is wrong notationally but functional
//Functions for setting new pieces in potential moves are inconsistent

//FEN state needs to be updated on move
//FEN state history (for 3 move repetition and potential to go back to older moves)
//reimplement animations