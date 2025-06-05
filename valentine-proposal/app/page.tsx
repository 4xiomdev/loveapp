"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { Heart } from "lucide-react"
import BackgroundHearts from "./components/BackgroundHearts"
import Quiz from "./components/Quiz"
import Button from "./components/Button"

const Confetti = dynamic(() => import("react-confetti"), { ssr: false })

const questions = [
  {
    question: "What is the normal range for fasting blood glucose?",
    options: ["70-100 mg/dL", "100-140 mg/dL", "140-200 mg/dL", "200-300 mg/dL"],
    correctAnswer: 0,
  },
  {
    question: "Which of these is a common symptom of diabetes?",
    options: ["Increased appetite", "Weight gain", "Decreased thirst", "Slow healing of wounds"],
    correctAnswer: 3,
  },
  {
    question: "What is the HbA1c test used for?",
    options: [
      "Measuring blood pressure",
      "Checking cholesterol levels",
      "Monitoring average blood glucose levels",
      "Testing for insulin resistance",
    ],
    correctAnswer: 2,
  },
  {
    question: "Will you open this special message for you?",
    options: ["Yes, I'm excited!", "Of course!", "Can't wait!", "Absolutely!"],
    correctAnswer: 0,
    isEnvelope: true,
  },
]

export default function ValentineProposal() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [showProposal, setShowProposal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateWindowDimensions()
    window.addEventListener("resize", updateWindowDimensions)
    return () => window.removeEventListener("resize", updateWindowDimensions)
  }, [])

  const handleQuizComplete = () => {
    setShowProposal(true)
  }

  const handleAccept = () => {
    setShowConfetti(true)
    setTimeout(() => {
      window.location.href = "https://your-next-page-url.com"
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 flex flex-col items-center justify-center p-4 overflow-hidden">
      <BackgroundHearts />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="text-center mb-8 z-10"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 3,
            times: [0, 0.2, 0.5, 0.8, 1],
          }}
          className="text-8xl mb-6 inline-block"
        >
          ❤️
        </motion.div>
        <motion.h1
          className="text-4xl font-bold text-pink-600 font-valentine mb-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Hi لمى
        </motion.h1>
        <motion.p
          className="text-xl text-pink-500 max-w-md mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          I have been working so hard on a little thing I know you'll love for the last weeks... and I guess it's about
          time for you to see it. But before... you need to solve a quiz.
        </motion.p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showProposal && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Quiz
              questions={questions}
              currentQuestion={currentQuestion}
              setCurrentQuestion={setCurrentQuestion}
              onComplete={handleQuizComplete}
            />
          </motion.div>
        )}

        {showProposal && (
          <motion.div
            key="proposal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-center bg-white bg-opacity-70 backdrop-blur-md rounded-xl p-8 shadow-xl"
          >
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold font-valentine mb-6 text-pink-600"
            >
              Would you be my Valentine?
            </motion.h2>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleAccept} type="yes">
                Yes
              </Button>
              <Button type="no">No</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && windowDimensions.width > 0 && windowDimensions.height > 0 && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
          colors={["#F472B6", "#FCA5A5", "#FECACA", "#FFF1F2"]}
        />
      )}

      <motion.div
        className="fixed bottom-4 right-4"
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 2,
        }}
      >
        <Heart className="text-pink-500" size={40} />
      </motion.div>
    </div>
  )
}

