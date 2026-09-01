"use client";

import React, { useState } from 'react';
import { useBookStore, Game } from '@/app/store/bookStore';
import { v4 as uuidv4 } from 'uuid';
import { FaGamepad, FaPlus, FaTrash, FaEdit, FaStar, FaCar, FaMoneyBillWave, FaMagic } from 'react-icons/fa';
import GameSmartImporterModal from './GameSmartImporterModal';

export default function GamesManager() {
  const games = useBookStore(state => state.games || []);
  const addGame = useBookStore(state => state.addGame);
  const updateGame = useBookStore(state => state.updateGame);
  const deleteGame = useBookStore(state => state.deleteGame);
  const activeLessonId = useBookStore(state => state.activeLessonId);
  const curriculum = useBookStore(state => state.curriculum);

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showSmartImporter, setShowSmartImporter] = useState(false);

  let activeLessonTitle = "غير معروف";
  if (activeLessonId && curriculum) {
    for (const grade of Object.values(curriculum)) {
      for (const unit of grade) {
        const lesson = unit.lessons.find(l => l.id === activeLessonId);
        if (lesson) {
          activeLessonTitle = lesson.title;
          break;
        }
      }
    }
  }

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
        
        {editingGame.template === 'millionaire' && (
          <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <h4 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>إعدادات سيربح المليون</h4>
            
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>مدة السؤال (بالثواني):</label>
            <input 
              type="number" 
              value={editingGame.settings?.timer || 45}
              onChange={e => setEditingGame({ ...editingGame, settings: { ...editingGame.settings, timer: parseInt(e.target.value) || 45 } })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', marginBottom: '10px' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>قيم الجوائز (مفصولة بفاصلة لـ 15 سؤال):</label>
            <textarea 
              value={editingGame.settings?.customMoneyLadder?.join(', ') || '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15'}
              onChange={e => {
                const arr = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                setEditingGame({ ...editingGame, settings: { ...editingGame.settings, customMoneyLadder: arr } });
              }}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', minHeight: '60px' }}
              placeholder="مثال: 1000, 2000, 3000, ..."
            />
            <small style={{ color: '#0284c7' }}>تأكدي من كتابة 15 رقم لتغطية جميع المستويات.</small>
          </div>
        )}

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
      
      <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginBottom: '10px' }}>اختر الدرس الذي تريد إضافة الألعاب إليه:</h4>
        <select 
          value={activeLessonId || ''} 
          onChange={(e) => useBookStore.getState().setActiveLesson(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
        >
          <option value="" disabled>-- الرجاء اختيار درس --</option>
          {curriculum && Object.entries(curriculum).map(([grade, units]) => (
            <optgroup key={grade} label={`الصف ${grade}`}>
              {(units as any[]).map(u => 
                u.lessons.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))
              )}
            </optgroup>
          ))}
        </select>
      </div>

      {!activeLessonId ? (
        <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center', marginTop: '15px' }}>
          الرجاء اختيار درس من القائمة أعلاه أولاً لإضافة أو عرض الألعاب.
        </div>
      ) : (
        <div style={{ marginTop: '15px' }}>
          <div style={{ padding: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
            الدرس المحدد حالياً: {activeLessonTitle}
          </div>
          <h4>الألعاب المضافة لهذا الدرس:</h4>
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
                <button 
                  onClick={() => updateGame(game.id, { isPublished: game.isPublished === false ? true : false })}
                  style={{ background: 'none', border: 'none', color: game.isPublished !== false ? '#3b82f6' : '#94a3b8', padding: '6px', fontSize: '18px', cursor: 'pointer' }}
                  title={game.isPublished !== false ? 'اللعبة ظاهرة للطلاب (اضغط للإخفاء)' : 'مسودة (اضغط للنشر)'}
                >
                  {game.isPublished !== false ? '👁️' : '🙈'}
                </button>
                <button onClick={() => setEditingGame(game)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><FaEdit /></button>
                <button onClick={() => deleteGame(game.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><FaTrash /></button>
              </div>
            </div>
          ))}
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#64748b' }}>إضافة لعبة جديدة:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button 
              onClick={() => setShowSmartImporter(true)}
              style={{ background: 'linear-gradient(135deg, #ff4fa3 0%, #db2777 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px' }}
            >
              <FaMagic /> منظم الألعاب التلقائي (لصق أسئلة)
            </button>
            <button 
              onClick={() => handleCreateGame('stars')}
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaStar /> تحدي النجوم (يدوي)
            </button>
            <button 
              onClick={() => handleCreateGame('millionaire')}
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaMoneyBillWave /> من سيربح المليون (يدوي)
            </button>
            <button 
              onClick={() => handleCreateGame('racing')}
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <FaCar /> سباق السيارات (يدوي)
            </button>
          </div>
        </div>
      )}
      
      {showSmartImporter && activeLessonId && (
        <GameSmartImporterModal
          lessonId={activeLessonId}
          onClose={() => setShowSmartImporter(false)}
        />
      )}
    </div>
  );
}
