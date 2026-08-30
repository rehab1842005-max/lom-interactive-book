"use client";

import React, { useState, useEffect } from 'react';
import { Game, GameQuestion } from '@/app/store/bookStore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function StarChallengeGame({ game, onComplete }: { game: Game, onComplete: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = game.questions[currentQuestionIndex];

  useEffect(() => {
    if (question) {
      const answers = [question.correctAnswer, ...question.wrongAnswers.filter(a => a.trim() !== '')];
      // Shuffle answers
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      setShuffledAnswers(answers);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [currentQuestionIndex, question]);

  if (!question && !gameOver) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>لا توجد أسئلة في هذه اللعبة.</div>;
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent double clicking
    
    setSelectedAnswer(answer);
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 100);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fde047', '#eab308', '#ca8a04'] // Gold/Star colors
      });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } else {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    setTimeout(() => {
      if (currentQuestionIndex < game.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameOver(true);
        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.5 },
        });
      }
    }, 2000);
  };

  if (gameOver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontFamily: 'var(--font-cairo)', background: 'radial-gradient(circle at center, #2e1065 0%, #0f172a 100%)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '6rem', marginBottom: '20px' }}>🏆</motion.div>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#fde047' }}>نهاية التحدي!</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>نقاطك: {score} / {game.questions.length * 100}</h2>
        <button 
          onClick={onComplete}
          style={{ background: '#ec4899', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '30px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          العودة للألعاب
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cairo)', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', position: 'relative' }}>
      
      {/* Decorative Stars */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '2rem', opacity: 0.5 }}>⭐</div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', fontSize: '3rem', opacity: 0.3 }}>✨</div>
      <div style={{ position: 'absolute', bottom: '15%', left: '20%', fontSize: '2.5rem', opacity: 0.4 }}>🌟</div>
      <div style={{ position: 'absolute', bottom: '25%', right: '10%', fontSize: '1.5rem', opacity: 0.6 }}>⭐</div>

      <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '20px', color: '#fde047', fontSize: '1.5rem', fontWeight: 'bold' }}>
        ⭐ {score}
      </div>
      <div style={{ position: 'absolute', top: '20px', right: '50%', transform: 'translateX(50%)', color: 'white', fontSize: '1.2rem', opacity: 0.8 }}>
        السؤال {currentQuestionIndex + 1} من {game.questions.length}
      </div>

      <motion.div 
        key={question.id}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '90%', maxWidth: '800px', zIndex: 10 }}
      >
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.2)', padding: '40px', borderRadius: '24px', textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', margin: 0, lineHeight: 1.5 }}>{question.questionText}</h2>
        </div>

        <div className="game-answers-grid">
          {shuffledAnswers.map((ans, idx) => {
            let bg = 'rgba(255,255,255,0.1)';
            let borderColor = 'rgba(255,255,255,0.3)';
            
            if (selectedAnswer !== null) {
              if (ans === question.correctAnswer) {
                bg = '#22c55e'; // Green
                borderColor = '#16a34a';
              } else if (ans === selectedAnswer) {
                bg = '#ef4444'; // Red
                borderColor = '#dc2626';
              }
            }

            return (
              <motion.button
                key={idx}
                whileHover={selectedAnswer === null ? { scale: 1.05, background: 'rgba(255,255,255,0.2)' } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(ans)}
                disabled={selectedAnswer !== null}
                style={{
                  background: bg,
                  border: `2px solid ${borderColor}`,
                  color: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  fontSize: '1.5rem',
                  cursor: selectedAnswer === null ? 'pointer' : 'default',
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '100px'
                }}
              >
                {ans}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
