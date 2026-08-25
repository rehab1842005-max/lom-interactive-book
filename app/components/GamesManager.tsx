"use client";

import React, { useState } from 'react';
import { useBookStore, Game } from '@/app/store/bookStore';
import { v4 as uuidv4 } from 'uuid';
import { FaGamepad, FaPlus, FaTrash, FaEdit, FaStar, FaCar, FaMoneyBillWave } from 'react-icons/fa';

export default function GamesManager() {
  const games = useBookStore(state => state.games || []);
  const addGame = useBookStore(state => state.addGame);
  const updateGame = useBookStore(state => state.updateGame);
  const deleteGame = useBookStore(state => state.deleteGame);
  const activeLessonId = useBookStore(state => state.activeLessonId);

  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const handleCreateGame = (template: Game['template']) => {
    const newGame: Game = {
      id: uuidv4(),
      title: 'لعبة جديدة',
      template,
      lessonId: activeLessonId || undefined,
      questions: []
    };
    addGame(newGame);
    setEditingGame(newGame);
  };

  if (editingGame) {
    return (
      <div className="tab-panel active" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="panel-header">
          <h3>
            <button onClick={() => setEditingGame(null)} style={{ background: 'none', border: 'none', color: '#ff4fa3', cursor: 'pointer', fontSize: '16px' }}>
              <i className="fa-solid fa-arrow-right"></i>
            </button> 
            تعديل اللعبة
          </h3>
        </div>
        
        <input 
          type="text" 
          value={editingGame.title}
          onChange={e => setEditingGame({ ...editingGame, title: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
          placeholder="عنوان اللعبة"
        />

        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4>أسئلة اللعبة ({editingGame.questions.length})</h4>
          {editingGame.questions.map((q, idx) => (
            <div key={q.id} style={{ background: '#fff', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <input 
                type="text" 
                value={q.questionText}
                onChange={e => {
                  const newQs = [...editingGame.questions];
                  newQs[idx].questionText = e.target.value;
                  setEditingGame({ ...editingGame, questions: newQs });
                }}
                placeholder="نص السؤال"
                style={{ width: '100%', marginBottom: '4px', padding: '4px' }}
              />
              <input 
                type="text" 
                value={q.correctAnswer}
                onChange={e => {
                  const newQs = [...editingGame.questions];
                  newQs[idx].correctAnswer = e.target.value;
                  setEditingGame({ ...editingGame, questions: newQs });
                }}
                placeholder="الإجابة الصحيحة"
                style={{ width: '100%', marginBottom: '4px', padding: '4px', border: '1px solid #4ade80' }}
              />
              {q.wrongAnswers.map((wrong, wIdx) => (
                <input 
                  key={wIdx}
                  type="text" 
                  value={wrong}
                  onChange={e => {
                    const newQs = [...editingGame.questions];
                    newQs[idx].wrongAnswers[wIdx] = e.target.value;
                    setEditingGame({ ...editingGame, questions: newQs });
                  }}
                  placeholder={`إجابة خاطئة ${wIdx + 1}`}
                  style={{ width: '100%', marginBottom: '4px', padding: '4px', border: '1px solid #f87171' }}
                />
              ))}
              <button onClick={() => {
                const newQs = editingGame.questions.filter((_, i) => i !== idx);
                setEditingGame({ ...editingGame, questions: newQs });
              }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                حذف السؤال
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              setEditingGame({
                ...editingGame, 
                questions: [...editingGame.questions, { id: uuidv4(), questionText: '', correctAnswer: '', wrongAnswers: ['', '', ''] }]
              })
            }}
            style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + إضافة سؤال جديد
          </button>
        </div>

        <button 
          onClick={() => {
            updateGame(editingGame.id, editingGame);
            setEditingGame(null);
          }}
          style={{ width: '100%', padding: '10px', background: '#4ade80', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          حفظ اللعبة
        </button>
      </div>
    );
  }

  return (
    <div className="tab-panel active">
      <div className="panel-header">
        <h3><FaGamepad /> الألعاب التفاعلية</h3>
      </div>
      
      {!activeLessonId ? (
        <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center', marginTop: '15px' }}>
          يرجى اختيار درس من "المنهج" لربط الألعاب به.
        </div>
      ) : (
        <div style={{ marginTop: '15px' }}>
          <h4>ألعاب الدرس الحالي:</h4>
          {games.filter(g => g.lessonId === activeLessonId).map(game => (
            <div key={game.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ display: 'block', color: '#334155' }}>{game.title}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {game.template === 'stars' ? 'تحدي النجوم' : game.template === 'millionaire' ? 'المليونير' : 'سباق السيارات'} 
                  ({game.questions.length} أسئلة)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setEditingGame(game)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><FaEdit /></button>
                <button onClick={() => deleteGame(game.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><FaTrash /></button>
              </div>
            </div>
          ))}
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#64748b' }}>إضافة لعبة جديدة:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button 
              onClick={() => handleCreateGame('stars')}
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaStar /> تحدي النجوم
            </button>
            <button 
              onClick={() => handleCreateGame('millionaire')}
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaMoneyBillWave /> من سيربح المليون
            </button>
            <button 
              onClick={() => handleCreateGame('racing')}
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaCar /> سباق السيارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
