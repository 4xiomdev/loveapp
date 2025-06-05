import type React from "react"
import { motion } from "framer-motion"

const BackgroundHearts: React.FC = () => {
  const heartColors = ["#FFC0CB", "#FFB6C1", "#FF69B4", "#FF1493", "#DB7093"]

  const hearts = Array.from({ length: 30 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute text-pink-300"
      style={{
        fontSize: Math.random() * 30 + 10,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        y: [0, -20, 0],
        opacity: [0, 1, 0],
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
        ease: "easeInOut",
        delay: Math.random() * 2,
      }}
    >
      ❤️
    </motion.div>
  ))

  return <div className="fixed inset-0 overflow-hidden pointer-events-none">{hearts}</div>
}

export default BackgroundHearts

