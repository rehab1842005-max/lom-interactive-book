"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookStore, Game } from '@/app/store/bookStore';
import { motion } from 'framer-motion';
import { FaGamepad, FaHome, FaStar, FaCar, FaMoneyBillWave } from 'react-icons/fa';

import StarChallengeGame from '@/app/components/games/StarChallengeGame';
import MillionaireGame from '@/app/components/games/MillionaireGame';
import RacingGame from '@/app/components/games/RacingGame';

export default function GamesPage() {
  const games = useBookStore(state => state.games || []);
  const curriculum = useBookStore(state => state.curriculum || {});
  const [playingGame, setPlayingGame] = useState<Game | null>(null);

  if (playingGame) {
    const handleExit = () => setPlayingGame(null);

    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a', overflow: 'hidden' }}>
        <button 
          onClick={handleExit}
          style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
        >
          <i className="fa-solid fa-arrow-right"></i> خروج من اللعبة
        </button>

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

        {games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <FaGamepad style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '20px' }} />
            <h2 style={{ color: '#475569' }}>لا توجد ألعاب متاحة حالياً</h2>
            <p style={{ color: '#94a3b8' }}>سيتم إضافة ألعاب ممتعة قريباً من قبل المعلمة.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {games.map(game => {
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

              // Try to find lesson name
              let lessonName = '';
              if (game.lessonId) {
                Object.values(curriculum).forEach((units: any) => {
                  units.forEach((u: any) => {
                    const l = u.lessons.find((x: any) => x.id === game.lessonId);
                    if (l) lessonName = `${u.title} - ${l.title}`;
                  });
                });
              }

              return (
                <motion.div 
                  key={game.id}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ background: bgGradient, padding: '30px', color: 'white', textAlign: 'center', fontSize: '3rem' }}>
                    {icon}
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{game.title}</h3>
                    {lessonName && <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '0.9rem' }}><i className="fa-solid fa-book"></i> {lessonName}</p>}
                    <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.85rem' }}>{game.questions.length} أسئلة تحدي</p>
                    
                    <button 
                      onClick={() => setPlayingGame(game)}
                      style={{ marginTop: 'auto', background: '#ec4899', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                    >
                      العب الآن 🚀
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
