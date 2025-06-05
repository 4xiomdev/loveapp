"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type React from "react" // Added import for React

interface EnvelopeProps {
  onOpen: () => void
  isDarkMode: boolean
}

const Envelope: React.FC<EnvelopeProps> = ({ onOpen, isDarkMode }) => {
  const [isOpening, setIsOpening] = useState(false)

  const handleClick = () => {
    setIsOpening(true)
    setTimeout(onOpen, 1000)
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotateY: isOpening ? 180 : 0 }}
      transition={{ duration: 1 }}
      className={`w-64 h-48 relative cursor-pointer perspective-1000`}
      onClick={handleClick}
    >
      <motion.div
        className={`absolute inset-0 backface-hidden ${isDarkMode ? "bg-gray-700" : "bg-pink-300"}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isOpening ? 0 : 1, y: isOpening ? -20 : 0 }}
            className={`font-valentine text-xl ${isDarkMode ? "text-pink-200" : "text-pink-600"}`}
          >
            Click to open
          </motion.span>
        </div>
      </motion.div>
      <motion.div
        className={`absolute inset-0 backface-hidden ${isDarkMode ? "bg-gray-800" : "bg-pink-100"}`}
        style={{ transform: "rotateY(180deg)", transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: isOpening ? 1 : 0, scale: isOpening ? 1 : 0.5 }}
            transition={{ delay: 0.5 }}
            className={`font-valentine text-2xl ${isDarkMode ? "text-pink-300" : "text-pink-600"}`}
          >
            ❤️
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Envelope

