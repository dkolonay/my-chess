import styles from './Square.module.css'
import { useContext } from 'react'
import { BoardContext } from '../../../contexts/BoardContext'

import Piece from '../Piece/Piece'



function Square(props: { idx: string, x: number, y: number }) {

  const context = useContext(BoardContext)


  if (context == null) {
    throw new Error("useContext returned null value");
  }

  const squareData = context.board[props.x][props.y]
  // console.log(squareData)

  const handleMouseDown = () => {
    context.updateSelectedSquare(props.x, props.y)
  }

  return (
    <div style={{gridArea: props.idx}} id={`s${props.x},${props.y}`} className={`${styles.square} ${styles[squareData.theme]} ${squareData.top ? styles.topSquare : ''}`} onMouseDown={handleMouseDown}>
      {(squareData.selected || squareData.highlighted) &&
      <div className={styles.selectHighlight}></div>
      }
      
      {squareData.moveIndicator &&
          <div className={styles[squareData.moveIndicator]}></div>
      }

      {squareData.piece.name != "" &&
        <Piece flipped={context.flipped} piece={squareData.piece} x={props.x} y={props.y} id={`p${props.x},${props.y}`}></Piece>
      }

    </div>

  )
}

export default Square