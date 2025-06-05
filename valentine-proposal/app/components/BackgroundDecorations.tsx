import { motion } from "framer-motion"
import type React from "react" // Added import for React

interface BackgroundDecorationsProps {
  isDarkMode: boolean
}

const BackgroundDecorations: React.FC<BackgroundDecorationsProps> = ({ isDarkMode }) => {
  const decorations = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full ${isDarkMode ? "bg-pink-500" : "bg-pink-300"}`}
      style={{
        width: Math.random() * 20 + 5,
        height: Math.random() * 20 + 5,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: Math.random() * 2 + 1,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  ))

  return <div className="fixed inset-0 overflow-hidden pointer-events-none">{decorations}</div>
}

export default BackgroundDecorations

