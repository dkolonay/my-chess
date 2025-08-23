import './Square.css'
import { useContext } from 'react'
import { BoardContext } from '../../../contexts/BoardContext'

import Piece from '../Piece/Piece'



function Square(props: { x: number, y: number }) {

  const context = useContext(BoardContext)


  if (context == null) {
    throw new Error("useContext returned null value");
  }

  const squareData = context.board[props.x][props.y]

  const handleMouseDown = () => {
    context.updateSelectedSquare(props.x, props.y)
  }

  return (
    <div id={`s${props.x},${props.y}`} className={`square ${squareData.theme} ${squareData.top ? 'top-square' : ''}`} onMouseDown={handleMouseDown}>
      {(squareData.selected || squareData.highlighted) &&
      <div className={'select-highlight'}></div>
      }
      
      {squareData.moveIndicator &&
          <div className={squareData.moveIndicator}></div>
      }

      {squareData.piece.name != "" &&
        <Piece flipped={context.flipped} piece={squareData.piece} x={props.x} y={props.y} id={`p${props.x},${props.y}`}></Piece>
      }

    </div>

  )
}

export default Square