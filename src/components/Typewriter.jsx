import React, { useState, useEffect } from 'react'

const Typewriter = ({ text, speed = 50, delay = 0, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTyping, setIsTyping] = useState(false)

    useEffect(() => {
        // Reset when text changes
        setDisplayedText('')
        setCurrentIndex(0)
        setIsTyping(true)
    }, [text])

    useEffect(() => {
        let timeout

        if (currentIndex < text.length && isTyping) {
            timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex])
                setCurrentIndex(prev => prev + 1)
            }, speed)
        } else if (currentIndex >= text.length && isTyping) {
            setIsTyping(false)
            if (onComplete) onComplete()
        }

        return () => clearTimeout(timeout)
    }, [currentIndex, text, speed, isTyping, onComplete])

    return <span>{displayedText}</span>
}

export default Typewriter
