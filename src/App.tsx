// import { useState } from 'react'
import './App.css'
import Board from './components/Board/Board'
import { useContext } from 'react'
import { BoardContext } from './contexts/BoardContext'


function App() {
  const context = useContext(BoardContext);

  if (context == null){
    throw new Error("No context provided")
  }

  return (
    <>
   
    <button onClick = {context.handleFlip} className = {'rotate-button'}>Rotate Board</button>
        <Board/>
    </>
  )
}

export default App
