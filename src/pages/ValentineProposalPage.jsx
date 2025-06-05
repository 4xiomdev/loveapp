import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  alpha,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import Confetti from 'react-confetti';

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
    question: "Ready to see what I've been working on? 🎁",
    options: ["Yes, I'm so excited! 💝", "Of course! 💖", "Can't wait! 💓", "Show me! 💗"],
    correctAnswer: 0,
    isEnvelope: true,
  },
];

const RunAwayButton = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotateZ, setRotateZ] = useState(0);
  
  const handleHover = () => {
    const newX = (Math.random() - 0.5) * 300;
    const newY = (Math.random() - 0.5) * 200;
    
    setPosition({ x: newX, y: newY });
    setOpacity(opacity => Math.max(opacity * 0.9, 0.5));
    setScale(scale => Math.max(scale * 0.95, 0.7));
    setRotateZ(Math.random() * 360);
  };

  return (
    <motion.div
      animate={{ 
        x: position.x, 
        y: position.y,
        opacity: opacity,
        scale: scale,
        rotateZ: rotateZ
      }}
      transition={{ type: "spring", duration: 0.7 }}
      style={{ 
        position: 'absolute',
        left: '65%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
      onHoverStart={handleHover}
    >
      <Button
        variant="outlined"
        sx={{
          borderColor: '#ff6b6b',
          color: '#ff6b6b',
          fontSize: '2rem',
          py: 2,
          px: 8,
          borderRadius: '16px',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha('#fff', 0.1),
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          '&:hover': {
            borderColor: '#ff8585',
            bgcolor: alpha('#ff6b6b', 0.1),
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        لا 😢
      </Button>
    </motion.div>
  );
};

const Quiz = ({ questions, currentQuestion, setCurrentQuestion, onComplete }) => {
  const handleAnswer = (index) => {
    if (currentQuestion === questions.length - 1) {
      onComplete();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const question = questions[currentQuestion];

  return (
    <motion.div
      key={currentQuestion}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        width: '100%',
        maxWidth: '500px',
        background: alpha('#fff', 0.7),
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#ff6b6b',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          {question.question}
        </Typography>
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={question.isEnvelope ? "contained" : "outlined"}
              onClick={() => handleAnswer(index)}
              sx={{
                width: '100%',
                p: 2,
                textAlign: 'left',
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                bgcolor: question.isEnvelope ? '#ff6b6b' : 'transparent',
                color: question.isEnvelope ? '#fff' : '#ff6b6b',
                borderColor: '#ff6b6b',
                '&:hover': {
                  bgcolor: question.isEnvelope ? '#ff8585' : alpha('#ff6b6b', 0.1),
                  borderColor: '#ff6b6b',
                },
              }}
            >
              {option}
            </Button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default function ValentineProposalPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showProposal, setShowProposal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowDimensions();
    window.addEventListener("resize", updateWindowDimensions);
    return () => window.removeEventListener("resize", updateWindowDimensions);
  }, []);

  const handleQuizComplete = () => {
    setShowProposal(true);
  };

  const handleAccept = () => {
    setShowConfetti(true);
    setTimeout(() => {
      navigate('/login');
    }, 5000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #ffd1d1 0%, #ff9ecd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ textAlign: 'center', marginBottom: '32px', zIndex: 10 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
            }}
            style={{ fontSize: '5rem', marginBottom: '24px', display: 'inline-block' }}
          >
            ❤️
          </motion.div>
          
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Typography variant="h2" sx={{ 
              fontWeight: 700,
              color: '#ff6b6b',
              mb: 2,
              fontSize: { xs: '2rem', sm: '3rem' }
            }}>
              hi لمى
            </Typography>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Typography variant="h5" sx={{ 
              color: '#ff6b6b',
              maxWidth: '600px',
              mx: 'auto',
              mb: 4,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: 1.8
            }}>
              I have been working on a little thing for the last weeks that I know you'll love... 
              but before you see it, I need to confirm if you've been a شَطُورَة and studied well for your exam! 
              let's see how you do 🧐
            </Typography>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showProposal ? (
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
          ) : (
            <motion.div
              key="proposal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{
                position: 'relative',
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha('#fff', 0.95)} 0%, ${alpha('#fff', 0.85)} 100%)`,
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                maxWidth: '500px',
                margin: '0 auto',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                    }}
                  >
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#ff6b6b',
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                        direction: 'rtl',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      !ما شاء الله
                    </Typography>
                  </motion.div>

                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#ff6b6b',
                      mb: 4,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      direction: 'rtl',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    !انتي شطورة ⭐️
                  </Typography>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#ff6b6b',
                        fontSize: { xs: '2.5rem', sm: '3.5rem' },
                        direction: 'rtl',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative',
                        mb: 6,
                      }}
                    >
                      بتكونين فالنتايني؟ 💝
                    </Typography>
                  </motion.div>
                </motion.div>
              </Box>

              <Box sx={{ 
                position: 'relative',
                height: '150px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
                overflow: 'visible',
              }}>
                <Button
                  variant="contained"
                  onClick={handleAccept}
                  sx={{
                    position: 'relative',
                    left: '-60px',
                    bgcolor: '#ff6b6b',
                    color: '#fff',
                    fontSize: '2rem',
                    py: 2,
                    px: 8,
                    borderRadius: '16px',
                    fontFamily: 'inherit',
                    boxShadow: '0 8px 20px rgba(255,107,107,0.3)',
                    '&:hover': {
                      bgcolor: '#ff8585',
                      transform: 'scale(1.05) translateY(-5px)',
                      boxShadow: '0 12px 25px rgba(255,107,107,0.4)',
                    },
                    transition: 'all 0.3s ease',
                    zIndex: 3,
                  }}
                >
                  نعم! 🥰
                </Button>

                <RunAwayButton />
              </Box>

              {/* Decorative elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                  overflow: 'hidden',
                  borderRadius: '24px',
                }}
              >
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle at 50% 50%, ${alpha('#ff6b6b', 0.05)} 0%, transparent 70%)`,
                  }}
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: 'linear',
                  }}
                />
                
                {/* Add floating hearts background */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      fontSize: '1.5rem',
                      opacity: 0.2,
                    }}
                    animate={{
                      y: [-20, 20],
                      x: [-10, 10],
                      rotate: [0, 360],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3 + i,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                      yoyo: true,
                    }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </Box>
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
            colors={['#ff6b6b', '#ff8585', '#ffb6b6', '#ffd1d1']}
          />
        )}

        <motion.div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
          }}
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          <Heart color="#ff6b6b" size={40} />
        </motion.div>
      </Container>
    </Box>
  );
} 