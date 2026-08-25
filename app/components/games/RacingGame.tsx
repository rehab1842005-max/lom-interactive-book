"use client";

import React, { useState, useEffect } from 'react';
import { Game } from '@/app/store/bookStore';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function RacingGame({ game, onComplete }: { game: Game, onComplete: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Track car progress (0 to 100%)
  const [progress, setProgress] = useState(0);

  const question = game.questions[currentQuestionIndex];
  const step = 100 / game.questions.length;

  useEffect(() => {
    if (question) {
      const answers = [question.correctAnswer, ...question.wrongAnswers.filter(a => a.trim() !== '')];
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      setShuffledAnswers(answers);
      setSelectedAnswer(null);
    }
  }, [currentQuestionIndex, question]);

  if (!question && !gameOver) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>لا توجد أسئلة.</div>;
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    const correct = answer === question.correctAnswer;

    if (correct) {
      setProgress(prev => Math.min(prev + step, 100));
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      
      setTimeout(() => {
        if (currentQuestionIndex < game.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          setGameOver(true);
          confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 } });
        }
      }, 1500);
    } else {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      
      // Just wait a bit and move to next question, but no progress
      setTimeout(() => {
        if (currentQuestionIndex < game.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          setGameOver(true);
          confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
        }
      }, 1500);
    }
  };

  if (gameOver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontFamily: 'var(--font-cairo)', background: '#1f2937' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#4ade80' }}>خط النهاية! 🏁</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>لقد قطعت {Math.round(progress)}% من المسافة!</h2>
        <button 
          onClick={onComplete}
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '30px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          خروج
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-cairo)', background: '#86efac', position: 'relative', overflow: 'hidden' }}>
      
      {/* Sky */}
      <div style={{ height: '30%', background: '#38bdf8', width: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* Road */}
      <div style={{ position: 'absolute', top: '30%', left: 0, width: '100%', height: '120px', background: '#334155', display: 'flex', alignItems: 'center' }}>
        {/* Road lines */}
        <div style={{ width: '100%', height: '4px', borderTop: '4px dashed white', opacity: 0.5 }}></div>
        
        {/* Finish Line */}
        <div style={{ position: 'absolute', right: '10%', height: '100%', width: '20px', background: 'repeating-linear-gradient(45deg, white, white 10px, black 10px, black 20px)' }}></div>
        
        {/* Car */}
        <motion.div 
          animate={{ left: `${10 + (progress * 0.8)}%` }} // Move from 10% to 90%
          transition={{ type: 'spring', stiffness: 50 }}
          style={{ position: 'absolute', fontSize: '4rem', zIndex: 10, y: '-50%' }}
        >
          🏎️
        </motion.div>
      </div>

      {/* Quiz Area (Bottom Half) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(70% - 120px)', background: '#1f2937', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', boxShadow: '0 -10px 30px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '30px', textAlign: 'center' }}>
          {question.questionText}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', maxWidth: '800px' }}>
          {shuffledAnswers.map((ans, idx) => {
            let bg = '#374151';
            let borderColor = '#4b5563';
            
            if (selectedAnswer !== null) {
              if (ans === question.correctAnswer) {
                bg = '#16a34a'; 
                borderColor = '#22c55e';
              } else if (ans === selectedAnswer) {
                bg = '#dc2626'; 
                borderColor = '#ef4444';
              }
            }

            return (
              <motion.button
                key={idx}
                whileHover={selectedAnswer === null ? { scale: 1.02, background: '#4b5563' } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(ans)}
                disabled={selectedAnswer !== null}
                style={{
                  background: bg,
                  border: `2px solid ${borderColor}`,
                  color: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  cursor: selectedAnswer === null ? 'pointer' : 'default',
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '80px'
                }}
              >
                {ans}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
