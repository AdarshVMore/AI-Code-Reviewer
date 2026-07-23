'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

type TypingTextProps = {
  text: string
  speed?: number
  onComplete?: () => void
}

export function TypingText({
  text,
  speed = 50,
  onComplete,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let currentIndex = 0
    setDisplayedText('')
    setDone(false)

    const interval = setInterval(() => {
      currentIndex += 1
      setDisplayedText(text.slice(0, currentIndex))

      if (currentIndex >= text.length) {
        clearInterval(interval)
        setDone(true)
        onCompleteRef.current?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className="inline">
      {displayedText}
      {!done && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] rounded-full bg-brand align-middle"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  )
}
