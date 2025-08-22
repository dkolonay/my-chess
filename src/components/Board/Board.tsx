import { useContext} from 'react'
import './Board.css'
import Row from './Row/Row.tsx'
import {BoardContext} from '../../contexts/BoardContext.tsx'

function Board() {
    const context = useContext(BoardContext)

    if (context === null){
        throw new Error("useContext returned null value");
    }
    const flipped = context.flipped;
    const board = context.board
  return (
      <div className={`board ${flipped ? 'flipped' : ''}`}>
        
        {board.map((row, index)=>
                <Row key={`row_${index}`} row = {row} rowNum={index}/>
        )}
      </div>
    
  )
}

export default Board