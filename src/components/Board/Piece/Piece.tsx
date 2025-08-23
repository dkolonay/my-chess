import { useEffect, useContext, useState } from 'react'
import type { PieceType } from '../../../types/boardTypes'
import { BoardContext } from '../../../contexts/BoardContext'
import './Piece.css'


function Piece(props: { piece: PieceType, flipped: boolean, id: string, x: number, y: number }) {
    let imgSrc = ""
    if (props.piece.name != ""){
        imgSrc= `/piece_images/${props.piece.color}_${props.piece.name}.png`
    }

    const context = useContext(BoardContext);
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState([0, 0]);
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    if (context == null) {
        throw new Error("No context provided")
    }

    const pieceData = context.board[props.x][props.y].piece;

    useEffect(() => {
        if (pieceData.destination == '') {
            return;
        }
        let pieceElement = document.getElementById(props.id)
        let destinationPiece = document.getElementById(pieceData.destination)

        const startRect = pieceElement?.getBoundingClientRect()
        const destRect = destinationPiece?.getBoundingClientRect()


        let startTime: number | null = null;
        const duration = 150;
        let deltaX = 0;
        let deltaY = 0;

        if (startRect && destRect) {
            deltaX = destRect.x - startRect.x
            deltaY = destRect.y - startRect.y
            if (props.flipped) {
                deltaX *= -1;
                deltaY *= -1;
            }
        }

        function animatePiece(currentTime: number) {
            if (pieceData.destination == '') {
                return;
            }
            if (!startTime) {
                startTime = currentTime;
            }
            if (pieceElement == null) {
                return;
            }

            const progress = (currentTime - startTime) / duration;
            if (progress < 1) {
                const newX = progress * deltaX;
                const newY = progress * deltaY;

                pieceElement.style.transform = `translate(${newX}px, ${newY}px)`;

                requestAnimationFrame(animatePiece)

            } else {
                pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`
            }
        }

        requestAnimationFrame(animatePiece);

    }, [pieceData.destination])

    function toggleDrag(e: React.MouseEvent<HTMLInputElement>) {
        return
        if (!dragging) {
            setDragStart([e.clientX, e.clientY])
            setDragging(true)
        } else {
            setDragging(false);
        }
    }

    function handleDrag(e: React.MouseEvent<HTMLInputElement>) {
        return
        if (dragging) {
            let deltaX = e.clientX - dragStart[0]
            let deltaY = e.clientY - dragStart[1]
            if (props.flipped) {
                deltaX *= -1;
                deltaY *= -1;
            }
            setOffset({ x: deltaX, y: deltaY })
        }
    }

    return (
        <div style={{ left: offset.x, top: offset.y }} id={props.id} className={`piece-container`} onMouseUp={toggleDrag} onMouseDown={toggleDrag} onMouseMove={handleDrag}>
            {imgSrc != "" &&
                <img className={`piece ${props.flipped ? 'flipped' : ''}`} src={imgSrc} alt={`${props.piece.color}_${props.piece.name}`} />
            }
            
        </div>

    )
}

export default Piece