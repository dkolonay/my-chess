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

            {board.map((row, rowIDX) =>
                row.map((square, squareIDX)=>
                    <Square key={`s${rowIDX},${squareIDX}`} x={square.x} y={square.y}/>
                )
                
            )}
        </div>

    )
}

export default Board