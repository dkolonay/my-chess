// import { useState } from 'react'
import './App.css'
import Board from './components/Board/Board'
import Clock from './components/Clock/Clock'
import { useContext } from 'react'
import { BoardContext } from './contexts/BoardContext'

const GAME_TIME = 60000;
function App() {

  const context = useContext(BoardContext);

  if (context == null) {
    throw new Error("No context provided")
  }

  return (
    <>
      <button onClick={context.handleFlip} className={'rotate-button'}>Rotate Board</button>
      <Clock color={"b"} totalTime={GAME_TIME}/>
      <Board />
      <Clock color={"w"} totalTime={GAME_TIME}/>
    </>
  )
}

export default App
