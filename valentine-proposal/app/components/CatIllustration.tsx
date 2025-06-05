import { motion } from "framer-motion"
import type React from "react" // Added import for React

interface CatIllustrationProps {
  isDarkMode: boolean
  isHappy?: boolean
}

const CatIllustration: React.FC<CatIllustrationProps> = ({ isDarkMode, isHappy = false }) => {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: isHappy ? [0, -10, 10, -10, 10, 0] : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, duration: isHappy ? 0.5 : 0 }}
    >
      <motion.path
        d="M100 180c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z"
        fill={isDarkMode ? "#4A5568" : "#FFF"}
      />
      <motion.path
        d="M60 80c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zM120 80c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z"
        fill={isDarkMode ? "#E2E8F0" : "#4A5568"}
      />
      <motion.circle cx="80" cy="80" r="10" fill={isDarkMode ? "#1A202C" : "#000"} />
      <motion.circle cx="140" cy="80" r="10" fill={isDarkMode ? "#1A202C" : "#000"} />
      <motion.path
        d="M90 120c10 10 30 10 40 0"
        stroke={isDarkMode ? "#E2E8F0" : "#4A5568"}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={isHappy ? { d: "M90 110c10 20 30 20 40 0" } : { d: "M90 120c10 10 30 10 40 0" }}
      />
      <motion.path
        d="M70 50L50 30M150 50L170 30"
        stroke={isDarkMode ? "#E2E8F0" : "#4A5568"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <motion.path
        d="M100 140v20M90 150h20"
        stroke={isDarkMode ? "#FEB2B2" : "#FEB2B2"}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </motion.svg>
  )
}

export default CatIllustration

