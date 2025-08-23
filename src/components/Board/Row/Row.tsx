import Square from '../Square/Square.tsx'
import type { BoardRow, BoardSquare } from '../../../types/boardTypes.tsx'



function Row(props: { row: BoardRow, rowNum: number }) {

  return (
    <div className={`row`}>
      {props.row.map((square: BoardSquare, index) => (
        <Square
          key={`square_${props.rowNum}_${index}`}
          x={square.x}
          y={square.y}
        />
      ))
      }
    </div>

  )
}

export default Row