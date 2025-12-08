'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function WaitlistCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 hidden md:block"
        >
          <div className="relative">
            <Button
              asChild
              size="lg"
              className="h-auto gap-3 rounded-full px-6 py-4 text-base font-semibold shadow-lg shadow-primary/25 transition-transform hover:scale-105"
            >
              <Link href="/waitlist">
                Join Waitlist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 rounded-full bg-background border p-1 text-muted-foreground shadow-sm hover:text-foreground"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
