"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function CustomCursor() {
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Motion values for raw mouse input
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth physics for the cursor itself - Optimized for minimal lag
  // Mass: 0.1 (very light), Stiffness: 800 (very snappy), Damping: 35 (no bounce)
  const smoothOptions = { damping: 35, stiffness: 800, mass: 0.1 }
  const x = useSpring(mouseX, smoothOptions)
  const y = useSpring(mouseY, smoothOptions)

  useEffect(() => {
    const manageMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      mouseX.set(clientX)
      mouseY.set(clientY)
      
      if (!isVisible) setIsVisible(true)
    }

    const manageMouseDown = () => setIsClicking(true)
    const manageMouseUp = () => setIsClicking(false)
    const manageMouseLeave = () => setIsVisible(false)
    const manageMouseEnter = () => setIsVisible(true)

    window.addEventListener("mousemove", manageMouseMove)
    window.addEventListener("mousedown", manageMouseDown)
    window.addEventListener("mouseup", manageMouseUp)
    document.addEventListener("mouseleave", manageMouseLeave)
    document.addEventListener("mouseenter", manageMouseEnter)

    return () => {
      window.removeEventListener("mousemove", manageMouseMove)
      window.removeEventListener("mousedown", manageMouseDown)
      window.removeEventListener("mouseup", manageMouseUp)
      document.removeEventListener("mouseleave", manageMouseLeave)
      document.removeEventListener("mouseenter", manageMouseEnter)
    }
  }, [mouseX, mouseY, isVisible])

  // Circular Ring Cursor (Minimalist)
  const size = 24 // Significantly smaller

  return (
    <motion.div
      style={{
        x,
        y,
        opacity: isVisible ? 1 : 0, // Toggle opacity instead of unmounting
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999999, // Ensure it's above everything including Modals
        pointerEvents: "none",
        willChange: "transform", // Hardware acceleration hint
      }}
      className="z-[9999999] transition-opacity duration-150 ease-out" // Add smooth fade
    >
      <motion.div 
        className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
        style={{ width: size, height: size }}
        animate={{ scale: isClicking ? 0.8 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
         {/* Main Ring - Theme Aware */}
         {/* Light Mode: border-black (high contrast). Dark Mode: border-blue-400 (softer blue) */}
         <div className="absolute inset-0 rounded-full border-[2px] border-black dark:border-blue-400 shadow-sm dark:shadow-[0_0_10px_rgba(96,165,250,0.3)]" 
              style={{ width: '100%', height: '100%' }} />
         
         {/* Rotating Indicator (Segment) */}
         <motion.div 
            className="absolute inset-0 rounded-full border-t-[2px] border-transparent border-t-blue-600 dark:border-t-white/80"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
         />
         
         {/* Microscope Handle - Thicker for visibility */}
         <div className="absolute top-full left-full w-3.5 h-[3px] bg-black dark:bg-blue-400 origin-top-left rotate-45 -translate-x-1 -translate-y-1 rounded-full" />
      </motion.div>
    </motion.div>
  )
}
