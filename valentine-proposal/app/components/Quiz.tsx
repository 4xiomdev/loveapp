import type React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  isEnvelope?: boolean
}

interface QuizProps {
  questions: Question[]
  currentQuestion: number
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>
  onComplete: () => void
}

const Quiz: React.FC<QuizProps> = ({ questions, currentQuestion, setCurrentQuestion, onComplete }) => {
  const handleAnswer = (index: number) => {
    if (currentQuestion === questions.length - 1) {
      onComplete()
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const question = questions[currentQuestion]

  return (
    <motion.div
      key={currentQuestion}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="w-full max-w-md bg-white bg-opacity-70 backdrop-blur-md rounded-xl p-6 shadow-xl"
    >
      <motion.h2
        className="text-2xl font-bold mb-6 text-pink-600 font-valentine"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {question.question}
      </motion.h2>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          className="space-y-3"
        >
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full p-3 rounded-md text-left transition-colors ${
                question.isEnvelope
                  ? "bg-pink-400 text-white hover:bg-pink-500"
                  : "bg-white text-pink-600 hover:bg-pink-100"
              } shadow-md`}
              onClick={() => handleAnswer(index)}
            >
              {option}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default Quiz

