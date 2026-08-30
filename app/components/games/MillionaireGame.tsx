"use client";

import React, { useState, useEffect } from 'react';
import { Game } from '@/app/store/bookStore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FaPhoneAlt, FaUsers, FaStarHalfAlt, FaStar } from 'react-icons/fa';
import { playSuccessSound, playWrongSound } from '@/app/utils/audio';

export default function MillionaireGame({ game, onComplete }: { game: Game, onComplete: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [earned, setEarned] = useState(0);
  const [wonMillion, setWonMillion] = useState(false);
  const timerSetting = game.settings?.timer || 45;
  const [timeLeft, setTimeLeft] = useState(timerSetting); 

  // Lifelines state
  const [used5050, setUsed5050] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [hiddenAnswers, setHiddenAnswers] = useState<string[]>([]);
  const [showAudienceVote, setShowAudienceVote] = useState(false);
  const [audienceVotes, setAudienceVotes] = useState<{ans: string, pct: number}[]>([]);
  const [walkedAway, setWalkedAway] = useState(false);

  const question = game.questions[currentQuestionIndex];
  
  // Custom Money Tree or standard
  const moneyLevels = game.settings?.customMoneyLadder || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const safeLevels = [moneyLevels[4] || 5, moneyLevels[9] || 10, moneyLevels[14] || 15];

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
      setHiddenAnswers([]);
      setShowAudienceVote(false);
      setTimeLeft(timerSetting);
    }
  }, [currentQuestionIndex, question, timerSetting]);

  if (!question && !gameOver && !wonMillion) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>لا توجد أسئلة.</div>;
  }

  useEffect(() => {
    if (gameOver || wonMillion || selectedAnswer !== null || timeLeft <= 0) {
      if (timeLeft === 0 && selectedAnswer === null && !gameOver && !wonMillion) {
        // Time's up!
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
        
        let fallbackMoney = 0;
        for (let safe of safeLevels) {
          if (earned >= safe) fallbackMoney = safe;
        }
        setEarned(fallbackMoney);
        setGameOver(true);
      }
      return;
    }

    const playTick = (time: number) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Sine wave for a soft, marimba-like tone
        oscillator.type = 'sine';
        
        // Alternating pitch (Tick-Tock), and higher pitch when time is running out (<10s)
        let freq = time % 2 === 0 ? 1046.50 : 880.00; 
        if (time <= 10) {
          freq = time % 2 === 0 ? 1567.98 : 1318.51; // Urgent higher pitch
        }
        
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); 
        
        // Pluck envelope: fast attack, quick decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(time <= 10 ? 0.4 : 0.2, audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } catch (e) {
        console.log("Audio error:", e);
      }
    };

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev > 1 && selectedAnswer === null && !gameOver && !wonMillion) {
          playTick(prev);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver, wonMillion, selectedAnswer, earned, safeLevels]);

  const handle5050 = () => {
    if (used5050 || selectedAnswer) return;
    setUsed5050(true);
    
    const wrongAns = shuffledAnswers.filter(a => a !== question.correctAnswer);
    // Shuffle wrong answers and pick 2 to hide
    const toHide = wrongAns.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenAnswers(toHide);
  };

  const handleAudience = () => {
    if (usedAudience || selectedAnswer) return;
    setUsedAudience(true);
    
    // Generate fake percentages favoring the correct answer
    let remainingPct = 100;
    const correctPct = Math.floor(Math.random() * 30) + 50; // 50% to 80%
    remainingPct -= correctPct;
    
    const otherPcts: number[] = [];
    for (let i = 0; i < 2; i++) {
      const p = Math.floor(Math.random() * remainingPct);
      otherPcts.push(p);
      remainingPct -= p;
    }
    otherPcts.push(remainingPct);
    
    // Shuffle otherPcts so wrong answers get random small percentages
    let wrongIdx = 0;
    const votes = shuffledAnswers.map(ans => {
      if (ans === question.correctAnswer) {
        return { ans, pct: correctPct };
      } else {
        return { ans, pct: otherPcts[wrongIdx++] || 0 };
      }
    });
    
    setAudienceVotes(votes);
    setShowAudienceVote(true);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setShowAudienceVote(false);
    
    // Fake suspense (longer for higher stakes)
    const suspenseTime = currentQuestionIndex > 10 ? 3000 : 1500;
    
    setTimeout(() => {
      const correct = answer === question.correctAnswer;
      setIsCorrect(correct);

      if (correct) {
        const currentMoney = moneyLevels[currentQuestionIndex] || (currentQuestionIndex * 1000);
        setEarned(currentMoney);
        
        playSuccessSound();
        
        setTimeout(() => {
          if (currentQuestionIndex < Math.min(game.questions.length - 1, 14)) { // Max 15 questions
            setCurrentQuestionIndex((prev: number) => prev + 1);
          } else {
            setWonMillion(true);
            confetti({ particleCount: 500, spread: 120, origin: { y: 0.3 }, colors: ['#fbbf24', '#f59e0b', '#fff'] });
            
            // Extra confetti waves
            setTimeout(() => confetti({ particleCount: 300, spread: 100, origin: { y: 0.4, x: 0.2 } }), 500);
            setTimeout(() => confetti({ particleCount: 300, spread: 100, origin: { y: 0.4, x: 0.8 } }), 1000);
          }
        }, 2000);
      } else {
        playWrongSound();
        
        // Calculate fall back money (last safe level reached)
        let fallbackMoney = 0;
        for (let safe of safeLevels) {
          if (earned >= safe) fallbackMoney = safe;
        }
        setEarned(fallbackMoney);
        
        setTimeout(() => {
          setGameOver(true);
        }, 2000);
      }
    }, suspenseTime);
  };

  const handleWalkAway = () => {
    // Player gets the money of the LAST question they successfully answered
    const walkAwayMoney = currentQuestionIndex > 0 ? moneyLevels[currentQuestionIndex - 1] : 0;
    setEarned(walkAwayMoney);
    setWalkedAway(true);
    setGameOver(true);
  };

  if (gameOver || wonMillion) {
    let title = 'حظ أوفر المرة القادمة!';
    let titleColor = '#f87171';
    
    if (wonMillion) {
      title = '🎉 مبرووووك! أنت بطل! 🎉';
      titleColor = '#fbbf24';
    } else if (walkedAway) {
      title = 'قررت الانسحاب بذكاء! 👏';
      titleColor = '#60a5fa';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontFamily: 'var(--font-cairo)', background: 'radial-gradient(circle at center, #1e0b35 0%, #000000 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          style={{ textAlign: 'center', background: 'rgba(30, 11, 53, 0.8)', padding: '50px', borderRadius: '30px', border: '2px solid #fbbf24', boxShadow: '0 0 50px rgba(251, 191, 36, 0.3)' }}
        >
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '20px', color: titleColor, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {title}
          </h1>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', color: '#e2e8f0' }}>الجائزة الحالية: <span style={{ color: '#fbbf24', fontSize: '3rem' }}>{earned.toLocaleString('en-US')}</span> 💰</h2>
          <button 
            onClick={onComplete}
            style={{ background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)', border: 'none', padding: '15px 50px', borderRadius: '30px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
          >
            خروج من اللعبة
          </button>
        </motion.div>
      </div>
    );
  }

  const letters = ['أ', 'ب', 'ج', 'د'];
  const currentLevelValue = moneyLevels[currentQuestionIndex] || (currentQuestionIndex * 1000);

  // The iconic hexagon style for buttons
  const hexagonStyle = {
    clipPath: 'polygon(5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%, 0 50%)',
  };

  return (
    <div className="millionaire-wrapper">
      
      {/* Background Rings / Lights */}
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', top: '50%', left: '50%', width: '150vh', height: '150vh', marginLeft: '-75vh', marginTop: '-75vh', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', borderTop: '2px solid rgba(139, 92, 246, 0.3)', borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pointerEvents: 'none' }}
      />
      
      {/* LEFT AREA: Lifelines & Main Game */}
      <div className="millionaire-main">
        
        {/* Game Title & Timer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '15px' }}>
          <h2 style={{ color: '#fbbf24', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaStar /> {game.title}
          </h2>
          {/* Timer Circle */}
          <div className="millionaire-timer" style={{ marginBottom: 0 }}>
            <div style={{ 
              width: '70px', height: '70px', 
              borderRadius: '50%', 
              border: `4px solid ${timeLeft > 10 ? '#4ade80' : '#ef4444'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 'bold',
              color: timeLeft > 10 ? '#4ade80' : '#ef4444',
              background: 'rgba(0,0,0,0.6)',
              boxShadow: `0 0 20px ${timeLeft > 10 ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.8)'}`,
              transition: 'all 0.5s ease'
            }}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* Lifelines Bar */}
        <div className="millionaire-lifelines">
          <motion.button 
            onClick={handle5050}
            disabled={used5050 || selectedAnswer !== null}
            animate={used5050 || selectedAnswer !== null ? {} : { 
              scale: [1, 1.05, 1],
              boxShadow: ['0 0 15px rgba(251, 191, 36, 0.3)', '0 0 30px rgba(251, 191, 36, 0.8)', '0 0 15px rgba(251, 191, 36, 0.3)']
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              background: used5050 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)',
              border: `2px solid ${used5050 ? '#475569' : '#fbbf24'}`,
              color: used5050 ? '#475569' : '#fbbf24',
              padding: '15px 30px', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: used5050 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <FaStarHalfAlt /> 50:50
          </motion.button>
          <motion.button 
            onClick={handleAudience}
            disabled={usedAudience || selectedAnswer !== null}
            animate={usedAudience || selectedAnswer !== null ? {} : { 
              scale: [1, 1.05, 1],
              boxShadow: ['0 0 15px rgba(251, 191, 36, 0.3)', '0 0 30px rgba(251, 191, 36, 0.8)', '0 0 15px rgba(251, 191, 36, 0.3)']
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              background: usedAudience ? 'rgba(255,255,255,0.1)' : 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)',
              border: `2px solid ${usedAudience ? '#475569' : '#fbbf24'}`,
              color: usedAudience ? '#475569' : '#fbbf24',
              padding: '15px 30px', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: usedAudience ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <FaUsers /> رأي الجمهور
          </motion.button>
          <motion.button 
            onClick={handleWalkAway}
            disabled={selectedAnswer !== null}
            animate={selectedAnswer !== null ? {} : { 
              scale: [1, 1.05, 1],
              boxShadow: ['0 0 15px rgba(239, 68, 68, 0.3)', '0 0 30px rgba(239, 68, 68, 0.8)', '0 0 15px rgba(239, 68, 68, 0.3)']
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              background: 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)',
              border: `2px solid #ef4444`,
              color: 'white',
              padding: '15px 30px', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: selectedAnswer !== null ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> انسحاب
          </motion.button>
        </div>

        <motion.div 
          key={`q-${question.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: '800px', zIndex: 10 }}
        >
          {/* Question Box */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '-50px', right: '-50px', height: '4px', background: '#fbbf24', zIndex: 0, boxShadow: '0 0 10px #fbbf24' }}></div>
            <div className="millionaire-question-box">
              <h2 className="millionaire-question-text">{question.questionText}</h2>
            </div>
          </div>

          {/* Answers Grid */}
          <div className="millionaire-answers">
            {shuffledAnswers.map((ans, idx) => {
              const isHidden = hiddenAnswers.includes(ans);
              
              let bg = 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)';
              let borderColor = '#fbbf24';
              let glow = 'none';
              
              if (selectedAnswer === ans) {
                if (isCorrect === null) {
                  bg = 'linear-gradient(180deg, #d97706 0%, #b45309 100%)'; // Orange waiting
                  glow = '0 0 20px rgba(245, 158, 11, 0.8)';
                } else if (isCorrect) {
                  bg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)'; // Green correct
                  glow = '0 0 20px rgba(34, 197, 94, 0.8)';
                } else {
                  bg = 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)'; // Red wrong
                  glow = '0 0 20px rgba(239, 68, 68, 0.8)';
                }
              } else if (isCorrect !== null && ans === question.correctAnswer) {
                // Blink correct answer if user got it wrong
                bg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)'; 
                glow = '0 0 20px rgba(34, 197, 94, 0.8)';
              }

              return (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Connecting line */}
                  <div style={{ position: 'absolute', top: '50%', left: idx % 2 === 0 ? '-20px' : 'auto', right: idx % 2 !== 0 ? '-20px' : 'auto', width: '20px', height: '4px', background: '#fbbf24', zIndex: 0 }}></div>
                  
                  <motion.button
                    whileHover={selectedAnswer === null && !isHidden ? { scale: 1.05 } : {}}
                    whileTap={selectedAnswer === null && !isHidden ? { scale: 0.95 } : {}}
                    onClick={() => !isHidden && handleAnswer(ans)}
                    disabled={selectedAnswer !== null || isHidden}
                    className="millionaire-answer-btn"
                    style={{
                      background: bg,
                      border: `2px solid ${borderColor}`,
                      cursor: (selectedAnswer !== null || isHidden) ? 'default' : 'pointer',
                      boxShadow: glow,
                      opacity: isHidden ? 0 : 1,
                    }}
                  >
                    <span style={{ color: '#fbbf24', fontWeight: 'bold', marginRight: '10px', fontSize: '1.5rem' }}>{letters[idx]}: </span>
                    <span style={{ flex: 1, textAlign: 'center' }}>{ans}</span>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Audience Vote Modal */}
        <AnimatePresence>
          {showAudienceVote && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{ position: 'absolute', top: '20%', background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #3b82f6', borderRadius: '20px', padding: '30px', width: '90%', maxWidth: '400px', zIndex: 50, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
              <h3 style={{ textAlign: 'center', color: '#fbbf24', marginBottom: '20px', marginTop: 0 }}>تصويت الجمهور 📊</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', borderBottom: '2px solid #475569', paddingBottom: '10px' }}>
                {letters.map((letter, i) => {
                  const ans = shuffledAnswers[i];
                  const vote = audienceVotes.find(v => v.ans === ans)?.pct || 0;
                  return (
                    <div key={letter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '20%' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem' }}>{vote}%</span>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(vote / 100) * 150}px` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        style={{ width: '100%', maxWidth: '40px', background: 'linear-gradient(0deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '5px 5px 0 0' }}
                      />
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{letter}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowAudienceVote(false)} style={{ width: '100%', marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>إغلاق</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT AREA: Money Ladder */}
      <div className="millionaire-ladder">
        {moneyLevels.map((amount: number, idx: number) => {
          // Limit to 15 questions maximum for the UI ladder
          if (idx >= 15) return null;
          
          const isCurrent = idx === currentQuestionIndex;
          const isPassed = idx < currentQuestionIndex;
          const isSafe = safeLevels.includes(amount);
          
          return (
            <motion.div 
              key={idx} 
              className="millionaire-ladder-item"
              animate={isCurrent ? {
                scale: [1, 1.05, 1],
                boxShadow: ['0 0 15px rgba(251, 191, 36, 0.4)', '0 0 25px rgba(251, 191, 36, 1)', '0 0 15px rgba(251, 191, 36, 0.4)']
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ 
                background: isCurrent ? '#fbbf24' : 'transparent',
                color: isCurrent ? 'black' : (isSafe ? 'white' : '#fbbf24'),
                fontWeight: isCurrent || isSafe ? 'bold' : 'normal',
                opacity: isPassed ? 0.5 : 1,
                border: isCurrent ? '2px solid white' : 'none',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 15px', marginBottom: '5px'
              }}
            >
              <span>{idx + 1}</span>
              <span>
                <span style={{ opacity: 0.8, marginRight: '5px' }}>💰</span>
                {amount.toLocaleString('en-US')}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
