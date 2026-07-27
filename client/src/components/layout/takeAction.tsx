'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, KeyRound, X } from 'lucide-react'
import { TypingText } from '../ui/TypingText'

type TakeActionContent = {
  message: string
  buttonLable: string
  urlOnButton: string
}

export function TakeAction({
  message,
  buttonLable,
  urlOnButton,
}: TakeActionContent) {
  const [showButton, setShowButton] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          key="take-action"
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 overflow-hidden"
        >
          <div className="px-4 pt-4 pb-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-xl"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(105deg, rgba(91,106,240,0.22) 0%, rgba(255,122,69,0.14) 55%, rgba(22,23,26,0.4) 100%)',
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-brand/30 blur-2xl"
                animate={{ opacity: [0.35, 0.7, 0.35], x: [0, 18, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-6 top-0 h-20 w-20 rounded-full bg-pulse/25 blur-2xl"
                animate={{ opacity: [0.25, 0.55, 0.25], y: [0, 10, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="glass-card relative flex items-center gap-3 px-3.5 py-3 !rounded-xl">
                <motion.div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <KeyRound size={15} strokeWidth={1.8} />
                </motion.div>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                  <p className="min-w-0 text-[13px] leading-snug tracking-[0.1px] text-text-primary">
                    <TypingText
                      text={message}
                      speed={28}
                      onComplete={() => setShowButton(true)}
                    />
                  </p>

                  <AnimatePresence>
                    {showButton && (
                      <motion.div
                        initial={{ opacity: 0, x: -6, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                      >
                        <Link href={urlOnButton}>
                          <motion.span
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-white shadow-[0_0_20px_rgba(91,106,240,0.35)] transition-colors hover:bg-brand-hover"
                          >
                            {buttonLable}
                            <ArrowRight size={12} strokeWidth={2.2} />
                          </motion.span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  aria-label="Dismiss"
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setIsDismissed(true)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-raised hover:text-text-primary"
                >
                  <X size={14} strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
