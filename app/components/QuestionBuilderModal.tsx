"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Question, QuestionType } from "../store/bookStore";
import { FaTimes, FaPlus, FaTrash, FaVolumeUp } from "react-icons/fa";

export default function QuestionBuilderModal({ 
  initialQuestion, 
  onSave, 
  onClose 
}: { 
  initialQuestion: Partial<Question>, 
  onSave: (q: Partial<Question>) => void, 
  onClose: () => void 
}) {
  const [q, setQ] = useState<Partial<Question>>({
    id: initialQuestion.id || Math.random().toString(),
    type: initialQuestion.type || 'mcq',
    title: initialQuestion.title || '',
    points: initialQuestion.points || 10,
    options: initialQuestion.options || [],
    correctAnswer: initialQuestion.correctAnswer || '',
    successMessage: initialQuestion.successMessage || 'إجابة صحيحة! أحسنت.',
    errorMessage: initialQuestion.errorMessage || 'إجابة خاطئة، حاول مرة أخرى.',
    showAnswer: initialQuestion.showAnswer ?? true,
    maxAttempts: initialQuestion.maxAttempts || 3,
    randomizeOptions: initialQuestion.randomizeOptions ?? false,
    mediaUrl: initialQuestion.mediaUrl || ''
  });

  const handleOptionChange = (idx: number, val: string) => {
    const newOps = [...(q.options || [])];
    newOps[idx] = val;
    setQ({ ...q, options: newOps });
  };

  const addOption = () => {
    setQ({ ...q, options: [...(q.options || []), `خيار ${(q.options?.length || 0) + 1}`] });
  };

  const removeOption = (idx: number) => {
    const newOps = [...(q.options || [])];
    newOps.splice(idx, 1);
    setQ({ ...q, options: newOps });
  };

  const toggleMultipleCorrect = (val: string) => {
    let current = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];
    if (current.includes(val)) {
      current = current.filter(v => v !== val);
    } else {
      current.push(val);
    }
    setQ({ ...q, correctAnswer: current });
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: 'var(--bg-main)',
        borderRadius: '12px',
        width: '900px',
        maxWidth: '95%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-header)' }}>
          <h2 style={{ margin: 0, color: 'var(--color-purple)' }}><i className="fa-solid fa-cogs"></i> إعدادات السؤال المتقدمة</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', gap: '30px' }}>
          
          {/* Right Column: Basic settings & Question content */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>نوع السؤال</label>
              <select 
                value={q.type} 
                onChange={e => setQ({ ...q, type: e.target.value as QuestionType, options: e.target.value === 'tf' ? ['صح', 'خطأ'] : [] })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }}
              >
                <option value="mcq">اختيار من متعدد (إجابة واحدة)</option>
                <option value="multiselect">اختيار من متعدد (أكثر من إجابة)</option>
                <option value="tf">صح أو خطأ</option>
                <option value="text">إجابة قصيرة (أكمل الفراغ)</option>
                <option value="essay">مقال / فقرة قصيرة</option>
                <option value="audio_q">سؤال صوتي (استماع)</option>
                <option value="video_q">سؤال فيديو (مشاهدة)</option>
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>نص السؤال</label>
              <textarea 
                rows={3}
                value={q.title} 
                onChange={e => setQ({ ...q, title: e.target.value })}
                placeholder="اكتب سؤالك هنا..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px', resize: 'vertical' }}
              />
            </div>

            {(q.type === 'audio_q' || q.type === 'video_q') && (
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{q.type === 'audio_q' ? 'رابط الصوت' : 'رابط الفيديو (YouTube)'}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="url" 
                    value={q.mediaUrl} 
                    onChange={e => setQ({ ...q, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  {q.type === 'audio_q' && (
                    <label style={{ background: 'var(--primary-color)', color: 'white', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <FaVolumeUp /> رفع ملف
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = () => { if (typeof reader.result === 'string') setQ({ ...q, mediaUrl: reader.result }); };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Options Builder for MCQ / MultiSelect */}
            {(q.type === 'mcq' || q.type === 'multiselect' || q.type === 'audio_q' || q.type === 'video_q') && (
              <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>الخيارات وتحديد الإجابة الصحيحة</label>
                
                {q.options?.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    {q.type === 'multiselect' ? (
                      <input 
                        type="checkbox" 
                        checked={Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)} 
                        onChange={() => toggleMultipleCorrect(opt)} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    ) : (
                      <input 
                        type="radio" 
                        name="correctAnswer" 
                        checked={q.correctAnswer === opt} 
                        onChange={() => setQ({ ...q, correctAnswer: opt })} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    )}
                    
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                    <button onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '18px' }}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
                
                <button onClick={addOption} style={{ background: 'var(--color-light-pink)', color: 'var(--color-purple)', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', fontWeight: 'bold' }}>
                  <FaPlus /> إضافة خيار
                </button>
              </div>
            )}

            {/* True/False Settings */}
            {q.type === 'tf' && (
              <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>الإجابة الصحيحة</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '18px' }}>
                    <input type="radio" name="tfAnswer" checked={q.correctAnswer === 'صح'} onChange={() => setQ({ ...q, correctAnswer: 'صح' })} style={{ width: '20px', height: '20px' }} /> صح
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '18px' }}>
                    <input type="radio" name="tfAnswer" checked={q.correctAnswer === 'خطأ'} onChange={() => setQ({ ...q, correctAnswer: 'خطأ' })} style={{ width: '20px', height: '20px' }} /> خطأ
                  </label>
                </div>
              </div>
            )}

            {/* Text Answer Settings */}
            {q.type === 'text' && (
              <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>الإجابة الصحيحة المقبولة</label>
                <input 
                  type="text" 
                  value={q.correctAnswer as string} 
                  onChange={e => setQ({ ...q, correctAnswer: e.target.value })}
                  placeholder="مثال: القاهرة"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>سيتم تجاهل المسافات الزائدة وحالة الأحرف أثناء التحقق.</p>
              </div>
            )}
            
            {q.type === 'essay' && (
              <div style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)' }}>أسئلة المقال لا يوجد لها تقييم تلقائي. سيتمكن الطالب من كتابة فقرة حرة يقرأها المعلم لاحقاً.</p>
              </div>
            )}
            
          </div>

          {/* Left Column: Advanced settings */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>الدرجة (النقاط)</label>
              <input 
                type="number" 
                min="1"
                value={q.points} 
                onChange={e => setQ({ ...q, points: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
            
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>عدد المحاولات المسموحة</label>
              <input 
                type="number" 
                min="1"
                value={q.maxAttempts} 
                onChange={e => setQ({ ...q, maxAttempts: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>

            {(q.type === 'mcq' || q.type === 'multiselect' || q.type === 'audio_q' || q.type === 'video_q') && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={q.randomizeOptions} onChange={e => setQ({ ...q, randomizeOptions: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  ترتيب الخيارات عشوائياً للطالب
                </label>
              </div>
            )}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={q.showAnswer} onChange={e => setQ({ ...q, showAnswer: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                إظهار الإجابة الصحيحة بعد استنفاد المحاولات
              </label>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#155724' }}>رسالة الإجابة الصحيحة</label>
              <textarea 
                rows={2}
                value={q.successMessage} 
                onChange={e => setQ({ ...q, successMessage: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c3e6cb', background: '#d4edda', resize: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#721c24' }}>رسالة الإجابة الخاطئة</label>
              <textarea 
                rows={2}
                value={q.errorMessage} 
                onChange={e => setQ({ ...q, errorMessage: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f5c6cb', background: '#f8d7da', resize: 'none' }}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '15px', background: 'var(--bg-header)' }}>
          <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '25px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
            إلغاء
          </button>
          <button onClick={() => onSave(q)} style={{ padding: '12px 35px', borderRadius: '25px', border: 'none', background: 'var(--color-purple)', color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(142, 68, 173, 0.3)' }}>
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
