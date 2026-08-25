"use client";

import React, { useState, useEffect } from 'react';
import { Game } from '@/app/store/bookStore';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function MillionaireGame({ game, onComplete }: { game: Game, onComplete: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [earned, setEarned] = useState(0);

  const question = game.questions[currentQuestionIndex];
  
  // Money tree
  const moneyLevels = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
  const currentMoney = moneyLevels[currentQuestionIndex] || (currentQuestionIndex * 1000);

  useEffect(() => {
    if (question) {
      const answers = [question.correctAnswer, ...question.wrongAnswers.filter(a => a.trim() !== '')];
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
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>لا توجد أسئلة.</div>;
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    
    // Fake suspense
    setTimeout(() => {
      const correct = answer === question.correctAnswer;
      setIsCorrect(correct);

      if (correct) {
        setEarned(currentMoney);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
        
        setTimeout(() => {
          if (currentQuestionIndex < game.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
          } else {
            setGameOver(true);
            confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 } });
          }
        }, 2000);
      } else {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
        
        setTimeout(() => {
          setGameOver(true);
        }, 2000);
      }
    }, 1500); // 1.5s suspense
  };

  if (gameOver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontFamily: 'var(--font-cairo)', background: 'radial-gradient(circle at center, #1e3a8a 0%, #020617 100%)' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#60a5fa' }}>انتهت اللعبة!</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>الرصيد النهائي: {earned} 💰</h2>
        <button 
          onClick={onComplete}
          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '30px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          خروج
        </button>
      </div>
    );
  }

  const letters = ['أ', 'ب', 'ج', 'د'];

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cairo)', background: 'radial-gradient(circle at center, #1e40af 0%, #020617 100%)', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '30px', right: '30px', color: '#fcd34d', fontSize: '1.5rem', fontWeight: 'bold' }}>
        💰 الرصيد الحالي: {earned}
      </div>
      
      <div style={{ position: 'absolute', top: '30px', left: '30px', color: '#93c5fd', fontSize: '1.5rem', fontWeight: 'bold' }}>
        السؤال لـ {currentMoney} 💰
      </div>

      <motion.div 
        key={question.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '90%', maxWidth: '800px', zIndex: 10, marginTop: '50px' }}
      >
        {/* Question Box */}
        <div style={{ 
          background: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)', 
          border: '2px solid #3b82f6', 
          padding: '30px', 
          borderRadius: '50px', 
          textAlign: 'center', 
          marginBottom: '50px',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          position: 'relative'
        }}>
          {/* Hexagon connecting lines would go here, simulated by borderRadius 50px */}
          <h2 style={{ color: 'white', fontSize: '1.8rem', margin: 0 }}>{question.questionText}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {shuffledAnswers.map((ans, idx) => {
            let bg = 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)';
            let borderColor = '#3b82f6';
            let textColor = 'white';
            
            if (selectedAnswer === ans) {
              if (isCorrect === null) {
                bg = 'linear-gradient(180deg, #d97706 0%, #b45309 100%)'; // Orange waiting
                borderColor = '#fcd34d';
              } else if (isCorrect) {
                bg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)'; // Green correct
                borderColor = '#4ade80';
              } else {
                bg = 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)'; // Red wrong
                borderColor = '#f87171';
              }
            } else if (isCorrect !== null && ans === question.correctAnswer) {
              // Highlight correct answer if user got it wrong
              bg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)'; 
              borderColor = '#4ade80';
            }

            return (
              <motion.button
                key={idx}
                whileHover={selectedAnswer === null ? { scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)' } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(ans)}
                disabled={selectedAnswer !== null}
                style={{
                  background: bg,
                  border: `2px solid ${borderColor}`,
                  color: textColor,
                  padding: '15px 25px',
                  borderRadius: '40px',
                  fontSize: '1.3rem',
                  cursor: selectedAnswer === null ? 'pointer' : 'default',
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: '80px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ color: '#fbbf24', fontWeight: 'bold', marginRight: '15px', paddingLeft: '15px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  {letters[idx]}:
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>{ans}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
