import { useContext } from 'react'
import './Board.css'
// import Row from './Row/Row.tsx'
import { BoardContext } from '../../contexts/BoardContext.tsx'
import Square from './Square/Square.tsx'

function Board() {

    const context = useContext(BoardContext)

    if (context === null) {
        throw new Error("useContext returned null value");
    }
    const flipped = context.flipped;
    const board = context.board
    return (
        <div className={`board ${flipped ? 'flipped' : ''}`}>

            {board.map((row) =>
                row.map((square)=>
                    <Square key={square.idx} idx={square.idx} x={square.x} y={square.y}/>
                )
                
            )}
        </div>

    )
}

export default Board