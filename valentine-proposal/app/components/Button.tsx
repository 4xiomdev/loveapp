"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type: "yes" | "no"
}

const Button: React.FC<ButtonProps> = ({ children, onClick, type }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (type === "no") {
      const interval = setInterval(() => {
        setPosition({
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 40),
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [type])

  if (type === "yes") {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold text-lg shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300"
      >
        {children}
      </motion.button>
    )
  }

  return (
    <motion.button
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="px-8 py-3 bg-gray-300 text-gray-600 rounded-full font-bold text-lg cursor-not-allowed"
    >
      {children}
    </motion.button>
  )
}

export default Button

