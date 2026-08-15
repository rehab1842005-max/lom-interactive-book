"use client";

import { useState, useMemo, useEffect } from "react";
import { Question } from "../store/bookStore";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTimes, FaRedo, FaInfoCircle } from "react-icons/fa";
import confetti from "canvas-confetti";

export default function QuestionEngine({ question, onComplete, forceSingleAttempt }: { question: Question, onComplete: (success?: boolean) => void, forceSingleAttempt?: boolean }) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'revealed' | 'essay_submitted'>('idle');
  const [feedbackText, setFeedbackText] = useState("");

  const maxAttempts = forceSingleAttempt ? 1 : (question.maxAttempts || 1);
  const isMultiSelect = question.type === 'multiselect';

  // Initialize answer based on type
  useEffect(() => {
    if (isMultiSelect) setSelectedAnswer([]);
    else setSelectedAnswer("");
  }, [question.type, isMultiSelect]);

  // Randomize options if needed
  const displayOptions = useMemo(() => {
    if (!question.options) return [];
    if (!question.randomizeOptions) return question.options;
    return [...question.options].sort(() => Math.random() - 0.5);
  }, [question.options, question.randomizeOptions]);

  const toggleMultiSelect = (val: string) => {
    if (status !== 'idle') return;
    const current = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
    if (current.includes(val)) setSelectedAnswer(current.filter(v => v !== val));
    else setSelectedAnswer([...current, val]);
  };

  const playSound = (type: 'success' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === 'success') {
        // Triumphant Victory Fanfare (Ta-da-da-DAAA!)
        const t = ctx.currentTime;
        const notes = [
          { freq: 523.25, time: 0 },    // C5
          { freq: 659.25, time: 0.15 }, // E5
          { freq: 783.99, time: 0.3 },  // G5
          { freq: 1046.50, time: 0.5 }, // C6 (long)
          // Add harmony to the final C6
          { freq: 523.25, time: 0.5 },  // C5
          { freq: 659.25, time: 0.5 },  // E5
        ];

        notes.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.value = note.freq;
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          gain.gain.setValueAtTime(0, t + note.time);
          gain.gain.linearRampToValueAtTime(0.8, t + note.time + 0.05); // Louder!
          
          const isFinal = note.time >= 0.5;
          const duration = isFinal ? 2.0 : 0.15;
          
          gain.gain.exponentialRampToValueAtTime(0.01, t + note.time + duration);
          osc.start(t + note.time);
          osc.stop(t + note.time + duration);
        });
      } else {
        // Loud Dissonant Buzzer (Wrong Answer)
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05); // Loud volume
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        // Two oscillators slightly out of tune for a harsh buzz
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.connect(gain);
        osc1.frequency.setValueAtTime(150, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);

        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.connect(gain);
        osc2.frequency.setValueAtTime(160, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.6);
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.log("Audio skipped", e);
    }
  };

  const checkAnswer = () => {
    if (status !== 'idle' && status !== 'error') return;

    if (question.type === 'essay') {
      if (!selectedAnswer) {
        setStatus('error');
        setFeedbackText("الرجاء كتابة إجابة أولاً.");
        return;
      }
      playSound('success');
      setStatus('essay_submitted');
      setFeedbackText("تم إرسال إجابتك بنجاح للمراجعة.");
      setTimeout(onComplete, 3000);
      return;
    }

    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) {
      setStatus('error');
      setFeedbackText('الرجاء إدخال أو اختيار إجابة أولاً!');
      return;
    }

    let isCorrect = false;

    if (isMultiSelect) {
      const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const selectedArr = selectedAnswer as string[];
      isCorrect = correctArr.length === selectedArr.length && correctArr.every(v => selectedArr.includes(v));
    } else {
      const normalizedCorrect = String(question.correctAnswer).trim().toLowerCase();
      const normalizedSelected = String(selectedAnswer).trim().toLowerCase();
      isCorrect = normalizedCorrect === normalizedSelected;
    }

    const currentAttempts = attempts + 1;
    setAttempts(currentAttempts);

    if (isCorrect) {
      playSound('success');
      
      // Fireworks Confetti Effect!
      const duration = 2 * 1000;
      const end = Date.now() + duration;
      const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

      (function frame() {
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          startVelocity: 60
        });
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          startVelocity: 60
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      setStatus('success');
      setFeedbackText(question.successMessage || 'إجابة صحيحة! أحسنت 👏');
      setTimeout(() => onComplete(true), 2000);
    } else {
      playSound('error');
      if (currentAttempts >= maxAttempts) {
        if (question.showAnswer) {
          setStatus('revealed');
          setFeedbackText(`لقد استنفدت المحاولات. الإجابة الصحيحة هي: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(" و ") : question.correctAnswer}`);
          setTimeout(() => onComplete(false), 2500);
        } else {
          setStatus('error');
          setFeedbackText(`لقد استنفدت المحاولات المسموحة (${maxAttempts}).`);
          setTimeout(() => onComplete(false), 1500);
        }
      } else {
        setStatus('error');
        setFeedbackText(`${question.errorMessage || 'إجابة خاطئة، حاول مرة أخرى!'} (المحاولة ${currentAttempts} من ${maxAttempts})`);
      }
    }
  };

  const resetTry = () => {
    setStatus('idle');
    setFeedbackText("");
    setSelectedAnswer(isMultiSelect ? [] : "");
  };

  if (!question || !question.type) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h3 style={{ color: "var(--color-purple)" }}>سؤال غير مكتمل</h3>
        <p>الرجاء ضبط إعدادات السؤال من وضع المعلم.</p>
        <button onClick={() => onComplete(false)} style={{ marginTop: "1rem", padding: "8px 20px", background: "var(--color-pink)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          تخطي السؤال
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      animate={status === 'error' ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } } : {}}
      style={{ 
        textAlign: "right", 
        padding: "15px", 
        width: '100%', 
        maxWidth: '700px', 
        margin: '0 auto',
        backgroundColor: status === 'error' ? 'rgba(255, 0, 0, 0.05)' : 'transparent',
        borderRadius: '16px',
        transition: 'background-color 0.3s'
      }}
    >
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1rem", borderBottom: "2px solid var(--color-light-pink)", paddingBottom: "10px" }}>
        <h3 style={{ color: "#2d004d", fontSize: "1.4rem", margin: 0, fontWeight: "bold", lineHeight: "1.4" }}>
          {question.title || "سؤال بدون عنوان"}
        </h3>
        <span style={{ background: 'var(--color-light-pink)', color: 'var(--color-purple)', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', flexShrink: 0, marginRight: '15px' }}>
          {question.points} نقاط
        </span>
      </div>
      
      {/* Media (Audio/Video) */}
      {(question.type === 'audio_q' || question.type === 'video_q') && question.mediaUrl && (
        <div style={{ marginBottom: '20px', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: question.type === 'audio_q' ? '20px' : '0' }}>
          {question.type === 'video_q' ? (
            <video src={question.mediaUrl} controls style={{ width: '100%', maxHeight: '300px' }} />
          ) : (
            <audio src={question.mediaUrl} controls style={{ width: '100%' }} />
          )}
        </div>
      )}

      {/* Inputs area */}
      <div style={{ marginBottom: "2rem" }}>
        
        {/* Choices (MCQ, TF, MultiSelect, Audio/Video with options) */}
        {['mcq', 'tf', 'multiselect', 'audio_q', 'video_q'].includes(question.type) && displayOptions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayOptions.map((opt, idx) => {
              const isSelected = isMultiSelect ? (selectedAnswer as string[]).includes(opt) : selectedAnswer === opt;
              const isRevealedCorrect = status === 'revealed' && (
                isMultiSelect 
                  ? (question.correctAnswer as string[]).includes(opt) 
                  : question.correctAnswer === opt
              );

              return (
                <button
                  key={idx}
                  onClick={() => isMultiSelect ? toggleMultiSelect(opt) : (status === 'idle' || status === 'error') && setSelectedAnswer(opt)}
                  disabled={status === 'success' || status === 'revealed'}
                  style={{
                    padding: "20px 25px",
                    borderRadius: "12px",
                    border: isRevealedCorrect ? "3px solid #28a745" : (isSelected ? "3px solid var(--color-pink)" : "2px solid var(--border-color)"),
                    background: isRevealedCorrect ? "#d4edda" : (isSelected ? "var(--color-light-pink)" : "var(--bg-surface)"),
                    cursor: (status === 'success' || status === 'revealed') ? "default" : "pointer",
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    color: "#1a1a1a",
                    textAlign: "right",
                    transition: "all 0.2s",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    boxShadow: isSelected ? "0 4px 10px rgba(255, 79, 163, 0.2)" : "0 2px 5px rgba(0,0,0,0.05)"
                  }}
                >
                  <div style={{ 
                    width: '24px', height: '24px', 
                    borderRadius: isMultiSelect ? '4px' : '50%', 
                    border: `2px solid ${isSelected || isRevealedCorrect ? (isRevealedCorrect ? '#28a745' : 'var(--color-purple)') : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected || isRevealedCorrect ? (isRevealedCorrect ? '#28a745' : 'var(--color-purple)') : 'transparent'
                  }}>
                    {(isSelected || isRevealedCorrect) && <FaCheck color="white" size={12} />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Short Text */}
        {question.type === 'text' && (
          <div>
            <input 
              type="text" 
              placeholder="اكتب إجابتك هنا..."
              value={selectedAnswer as string}
              onChange={(e) => status !== 'success' && status !== 'revealed' && setSelectedAnswer(e.target.value)}
              disabled={status === 'success' || status === 'revealed'}
              style={{
                width: "100%", padding: "15px", borderRadius: "8px", border: "2px solid var(--color-purple)", fontSize: "1.2rem", textAlign: "right",
                background: status === 'revealed' ? '#d4edda' : 'white'
              }}
            />
            {status === 'revealed' && (
              <p style={{ color: '#155724', fontWeight: 'bold', marginTop: '10px' }}>الإجابة الصحيحة: {question.correctAnswer}</p>
            )}
          </div>
        )}

        {/* Essay */}
        {question.type === 'essay' && (
          <div>
            <textarea 
              rows={5}
              placeholder="اكتب إجابتك بالتفصيل هنا..."
              value={selectedAnswer as string}
              onChange={(e) => status === 'idle' && setSelectedAnswer(e.target.value)}
              disabled={status === 'essay_submitted'}
              style={{
                width: "100%", padding: "15px", borderRadius: "8px", border: "2px solid var(--color-purple)", fontSize: "1.1rem", textAlign: "right", resize: "vertical"
              }}
            />
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ 
              padding: "15px", 
              borderRadius: "8px", 
              marginBottom: "20px",
              background: (status === 'success' || status === 'essay_submitted') ? '#d4edda' : (status === 'error' ? '#f8d7da' : '#fff3cd'),
              color: (status === 'success' || status === 'essay_submitted') ? '#155724' : (status === 'error' ? '#721c24' : '#856404'),
              border: `1px solid ${(status === 'success' || status === 'essay_submitted') ? '#c3e6cb' : (status === 'error' ? '#f5c6cb' : '#ffeeba')}`,
              fontWeight: "bold",
              textAlign: "center",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {status === 'success' && <FaCheck size={20} />}
            {status === 'error' && <FaTimes size={20} />}
            {status === 'revealed' && <FaInfoCircle size={20} />}
            {feedbackText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        
        {status === 'idle' && (
          <button 
            onClick={checkAnswer}
            style={{ 
              background: "var(--color-purple)", color: "white", border: "none", padding: "12px 40px", borderRadius: "25px", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(142, 68, 173, 0.3)"
            }}
          >
            {question.type === 'essay' ? 'إرسال الإجابة' : 'تحقق من الإجابة'}
          </button>
        )}

        {status === 'error' && attempts < maxAttempts && (
          <button 
            onClick={resetTry}
            style={{ 
              background: "#ffc107", color: "#000", border: "none", padding: "12px 30px", borderRadius: "25px", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <FaRedo /> حاول مرة أخرى
          </button>
        )}

        {(status === 'revealed' || (status === 'error' && attempts >= maxAttempts)) && (
          <button 
            onClick={() => onComplete(false)}
            style={{ 
              background: "var(--color-purple)", color: "white", border: "none", padding: "12px 40px", borderRadius: "25px", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold"
            }}
          >
            المتابعة
          </button>
        )}

        {status === 'idle' && (
          <button 
            onClick={() => onComplete(false)}
            style={{ 
              background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-color)", padding: "12px 30px", borderRadius: "25px", fontSize: "1.2rem", cursor: "pointer"
            }}
          >
            إلغاء
          </button>
        )}
      </div>
    </motion.div>
  );
}
