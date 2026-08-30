"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookStore, Game } from '@/app/store/bookStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGamepad, FaHome, FaStar, FaCar, FaMoneyBillWave, FaChevronDown } from 'react-icons/fa';

import StarChallengeGame from '@/app/components/games/StarChallengeGame';
import MillionaireGame from '@/app/components/games/MillionaireGame';
import RacingGame from '@/app/components/games/RacingGame';
import SpinningWheel from '@/app/components/games/SpinningWheel';

export default function GamesPage() {
  const games = useBookStore(state => state.games || []);
  const curriculum = useBookStore(state => state.curriculum || {});
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  if (playingGame) {
    const handleExit = () => setPlayingGame(null);

    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a', overflow: 'hidden' }}>
        {playingGame.template !== 'millionaire' && (
          <button 
            onClick={handleExit}
            className="game-exit-btn"
            style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
          >
            <i className="fa-solid fa-arrow-right"></i> خروج من اللعبة
          </button>
        )}

        {playingGame.template === 'stars' && <StarChallengeGame game={playingGame} onComplete={handleExit} />}
        {playingGame.template === 'millionaire' && <MillionaireGame game={playingGame} onComplete={handleExit} />}
        {playingGame.template === 'racing' && <RacingGame game={playingGame} onComplete={handleExit} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: 'var(--font-cairo)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaGamepad style={{ fontSize: '2rem' }} /> بوابة الألعاب التفاعلية
          </h1>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <FaHome /> الرئيسية
            </button>
          </Link>
        </header>

        {games.filter(g => g.isPublished !== false).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <FaGamepad style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '20px' }} />
            <h2 style={{ color: '#475569' }}>لا توجد ألعاب متاحة حالياً</h2>
            <p style={{ color: '#94a3b8' }}>سيتم إضافة ألعاب ممتعة قريباً من قبل المعلمة.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[4, 5, 6].map(grade => {
              // Find units for this grade
              const units = curriculum[grade] || [];
              // Find lessons in this grade that have AT LEAST one game
              const lessonsWithGames: { id: string, title: string, games: Game[] }[] = [];
              
              units.forEach((u: any) => {
                const publishedLessons = u.lessons.filter((l: any) => l.isPublished !== false);
                publishedLessons.forEach((l: any) => {
                  const lessonGames = games.filter(g => g.lessonId === l.id && g.isPublished !== false);
                  if (lessonGames.length > 0) {
                    lessonsWithGames.push({
                      id: l.id,
                      title: `${u.title} - ${l.title}`,
                      games: lessonGames
                    });
                  }
                });
              });

              return (
                <div key={grade} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setExpandedGrade(expandedGrade === grade ? null : grade)}
                    style={{ width: '100%', padding: '20px', background: expandedGrade === grade ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white', color: expandedGrade === grade ? 'white' : '#1e293b', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', transition: 'all 0.3s' }}
                  >
                    <span>الصف {grade === 4 ? "الرابع" : grade === 5 ? "الخامس" : "السادس"} الابتدائي</span>
                    <motion.div animate={{ rotate: expandedGrade === grade ? 180 : 0 }}>
                      <FaChevronDown />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedGrade === grade && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '20px', background: '#f8fafc' }}>
                          {lessonsWithGames.length === 0 ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>لا توجد ألعاب مضافة لهذا الصف بعد.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              {lessonsWithGames.map(lesson => (
                                <div key={lesson.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                  <button
                                    onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                    style={{ width: '100%', padding: '15px 20px', background: '#f1f5f9', color: '#334155', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                                  >
                                    <span><i className="fa-solid fa-book-open"></i> {lesson.title}</span>
                                    <motion.div animate={{ rotate: expandedLesson === lesson.id ? 180 : 0 }}>
                                      <FaChevronDown />
                                    </motion.div>
                                  </button>

                                  <AnimatePresence>
                                    {expandedLesson === lesson.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                      >
                                        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                          {lesson.games.map(game => {
                                            let icon = <FaGamepad />;
                                            let bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                                            
                                            if (game.template === 'stars') {
                                              icon = <FaStar />;
                                              bgGradient = 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
                                            } else if (game.template === 'millionaire') {
                                              icon = <FaMoneyBillWave />;
                                              bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                            } else if (game.template === 'racing') {
                                              icon = <FaCar />;
                                              bgGradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                                            }

                                            return (
                                              <motion.div 
                                                key={game.id}
                                                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                                style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                              >
                                                <div style={{ background: bgGradient, padding: '20px', color: 'white', textAlign: 'center', fontSize: '2rem' }}>
                                                  {icon}
                                                </div>
                                                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                                                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{game.title}</h4>
                                                  <p style={{ margin: '0 0 15px 0', color: '#94a3b8', fontSize: '0.85rem' }}>{game.questions.length} أسئلة تحدي</p>
                                                  
                                                  <button 
                                                    onClick={() => setPlayingGame(game)}
                                                    style={{ marginTop: 'auto', background: '#ec4899', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                  >
                                                    العب الآن 🚀
                                                  </button>
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= SPINNING WHEEL SECTION ================= */}
        <SpinningWheel />

      </div>
    </div>
  );
}
