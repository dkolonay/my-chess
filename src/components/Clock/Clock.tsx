import { useContext, useEffect, useState } from 'react'
import styles from './Clock.module.css'
// import Row from './Row/Row.tsx'
import { BoardContext } from '../../contexts/BoardContext.tsx'

function Clock(props: { color: string, totalTime: number }) {
    const [timeRemaining, setTimeRemaining] = useState(props.totalTime);
    const [currentIntervalStart, setCurrentIntervalStart] = useState<Date>(new Date())
    const [pauseTime, setPauseTime] = useState<Date | null>(new Date())
    const [initialTime, setInitialTime] = useState<Date | null>(null)
    const [active, setActive] = useState(false)

    const context = useContext(BoardContext)

    if (context === null) {
        throw new Error("useContext returned null value");
    }

    const activeColor = context.activeColor

    const toggleActive = (timeToggled: Date) => {
        setActive(props.color == activeColor)
        if (activeColor == props.color) {
            setCurrentIntervalStart(timeToggled)
            if (initialTime == null) {
                setInitialTime(timeToggled)
            }
        } else {
            setPauseTime(timeToggled)
        }

    }

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const passed = now.getTime() - currentIntervalStart.getTime();
            if (!active) {
                clearInterval(interval)
                if (pauseTime != null) {
                    const timeElapsed = currentIntervalStart.getTime() - pauseTime.getTime()
                    setTimeRemaining((prevTime) => {
                        return prevTime - timeElapsed
                    })
                    setPauseTime(null)
                }
            } else {
                if (timeRemaining <= 0) {
                    clearInterval(interval)
                    setTimeRemaining(0)
                } else {
                    setTimeRemaining((prevTime) => {
                        return prevTime - passed
                    })
                    setCurrentIntervalStart(now)
                }
            }
        }, 10)

        return () => clearInterval(interval)
    }, [timeRemaining, active])

    useEffect(() => {
        const changeTime = new Date()
        toggleActive(changeTime)
    }, [activeColor])



    let m = Math.floor(timeRemaining / (1000 * 60));
    const remainingMillisecondsAfterMinutes = timeRemaining % (1000 * 60);

    // Calculate seconds
    let s = Math.floor(remainingMillisecondsAfterMinutes / 1000);
    const remainingMillisecondsAfterSeconds = remainingMillisecondsAfterMinutes % 1000;

    // Milliseconds are simply the remainder
    let ms = Math.floor((remainingMillisecondsAfterSeconds % 1000) / 100);
    if(m < 0){
        m = 0
    }
    if (s < 0){
        s = 0
    }
    if(ms < 0){
        ms = 0
    }

    let minutes = m.toString()
    let seconds = s.toString()
    if(m > 0){
        seconds = seconds.padStart(2,'0')
    }
    let tenths = ms.toString()




    return (
        <div className={styles.clock}>{`${m > 0 ? minutes + ":" : ""}${seconds}.${tenths}`}</div>

    )
}

export default Clock