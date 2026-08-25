"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useBookStore, GameQuestion, Game } from "../store/bookStore";
import { v4 as uuidv4 } from "uuid";
import { FaTimes, FaMagic, FaGamepad, FaStar, FaCar, FaMoneyBillWave } from "react-icons/fa";

export default function GameSmartImporterModal({ 
  onClose,
  lessonId
}: { 
  onClose: () => void;
  lessonId: string;
}) {
  const [text, setText] = useState("");
  const [template, setTemplate] = useState<Game['template']>('stars');
  const [gameTitle, setGameTitle] = useState("لعبة تحدي جديدة");
  const { addGame } = useBookStore();
  const [status, setStatus] = useState("");
  
  const handleImport = async () => {
    if (!text.trim()) return;
    setStatus("جاري تحليل وتوزيع الأسئلة...");
    
    try {
      const normalizeDigits = (str: string) => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.replace(/[٠-٩]/g, d => arabicNumbers.indexOf(d).toString());
      };

      const normalizedText = normalizeDigits(text);
      const lines = normalizedText.split('\n');
      
      let parsedQuestions: GameQuestion[] = [];
      
      let currentQ: Partial<GameQuestion> | null = null;
      let optionsCollected: string[] = [];
      let correctAnswerIdx: number = 0;
      
      const saveCurrentQuestion = () => {
        if (currentQ && currentQ.questionText && optionsCollected.length >= 2) {
          // If not explicitly marked correct, assume first option is correct
          
          let correctAns = optionsCollected[correctAnswerIdx];
          let wrongAns = optionsCollected.filter((_, idx) => idx !== correctAnswerIdx);
          
          // Ensure we have 3 wrong answers (pad with empty if needed)
          while (wrongAns.length < 3) {
            wrongAns.push("");
          }
          if (wrongAns.length > 3) {
            wrongAns = wrongAns.slice(0, 3); // Max 3
          }

          const finalQ: GameQuestion = {
            id: uuidv4(),
            questionText: currentQ.questionText,
            correctAnswer: correctAns,
            wrongAnswers: wrongAns
          };
          
          parsedQuestions.push(finalQ);
        }
        currentQ = null;
        optionsCollected = [];
        correctAnswerIdx = 0;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Ignore Markdown horizontal rules
        if (/^[\-\*]{3,}$/.test(line)) {
          continue;
        }

        // Try to find if multiple options are smashed into one line
        // e.g. "أ) كذا ب) كذا ج) كذا"
        // Only letters (أ-يa-zA-Z) followed by . or ) are options, OR dashes. Numbers are usually question titles!
        const optionPrefixPattern = /(?:[أ-يa-zA-Z][\.\)]|\-|\*(?!\*))/;
        const smashedOptionsRegex = new RegExp(`(?:^|\\s+)(${optionPrefixPattern.source})\\s*(.*?)(?=\\s+${optionPrefixPattern.source}|\\s*$)`, 'g');
        
        // Count how many options are in this line
        const smashedMatches = [...line.matchAll(smashedOptionsRegex)];
        
        if (smashedMatches.length >= 2) {
          // Check if there is text BEFORE the first option. That's likely the question!
          const firstOptionIndex = smashedMatches[0].index;
          if (firstOptionIndex !== undefined && firstOptionIndex > 0) {
            const possibleQuestionText = line.substring(0, firstOptionIndex).trim();
            if (possibleQuestionText) {
              // It's a new question!
              saveCurrentQuestion();
              let cleanTitle = possibleQuestionText.replace(/^\*\*?\d+\.?\*\*?\s*/, '').replace(/\*+/g, '').trim();
              cleanTitle = cleanTitle.replace(/^(?:س\s*\d+|\d+)[\.\-:\)]\s*/, '').trim();
              if (cleanTitle && !cleanTitle.startsWith('#')) {
                currentQ = { questionText: cleanTitle };
              }
            }
          }

          // This line contains multiple options
          smashedMatches.forEach(match => {
            let cleanOpt = match[2].replace('✅', '').trim();
            if (cleanOpt) {
              optionsCollected.push(cleanOpt);
              if (match[2].includes('✅')) {
                correctAnswerIdx = optionsCollected.length - 1;
              }
            }
          });
          continue; // Skip the rest of the loop for this line since we parsed its options
        }

        // Normal check if line is a single option (starts with أ-ي or a-z followed by . or ) or starts with dash)
        const isOption = !!line.match(/^(?:[أ-يa-zA-Z][\.\)]|\-|\*(?!\*))\s*(.+)/);
        const isCorrectMarked = line.includes('✅');

        if (isOption) {
          let cleanOpt = line.replace(/^(?:[أ-يa-zA-Z][\.\)]|\-|\*(?!\*))\s*/, '').replace('✅', '').trim();
          if (cleanOpt) {
            optionsCollected.push(cleanOpt);
            if (isCorrectMarked) {
              correctAnswerIdx = optionsCollected.length - 1;
            }
          }
        } else {
          // It's a new question title
          saveCurrentQuestion();
          
          let cleanTitle = line.replace(/^\*\*?\d+\.?\*\*?\s*/, '').replace(/\*+/g, '').trim();
          cleanTitle = cleanTitle.replace(/^(?:س\s*\d+|\d+)[\.\-:\)]\s*/, '').trim();
          
          if (cleanTitle && !cleanTitle.startsWith('#') && !cleanTitle.toLowerCase().includes('eof')) {
            currentQ = { questionText: cleanTitle };
          }
        }
      }
      
      // Save last question
      saveCurrentQuestion();
      
      if (parsedQuestions.length > 0) {
        const newGame: Game = {
          id: uuidv4(),
          title: gameTitle,
          template: template,
          lessonId: lessonId,
          questions: parsedQuestions
        };
        
        addGame(newGame);
        
        setStatus(`تم استيراد اللعبة بنجاح! تم العثور على ${parsedQuestions.length} سؤال.`);
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus("لم يتم العثور على أي أسئلة بصيغة صحيحة. يرجى التأكد من التنسيق.");
      }
      
    } catch (err: any) {
      console.error(err);
      setStatus("حدث خطأ أثناء التحليل: " + err.message);
    }
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%)' }}>
          <h2 style={{ margin: 0, color: '#db2777', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <FaMagic /> منظم ألعاب الذكاء الاصطناعي
          </h2>
          <button onClick={onClose} style={{ background: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>عنوان اللعبة</label>
              <input 
                type="text" 
                value={gameTitle} 
                onChange={e => setGameTitle(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>قالب اللعبة</label>
              <select 
                value={template} 
                onChange={e => setTemplate(e.target.value as any)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              >
                <option value="stars">تحدي النجوم ⭐</option>
                <option value="millionaire">من سيربح المليون 💰</option>
                <option value="racing">سباق السيارات 🏎️</option>
              </select>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>تعليمات النسخ واللصق:</h4>
            <ul style={{ margin: 0, paddingRight: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>انسخي الأسئلة بصيغة "اختيار من متعدد".</li>
              <li>اجعلي كل خيار في سطر جديد يبدأ بحرف (أ، ب، ج، د) أو شرطة (-).</li>
              <li>ضعي علامة ✅ بجانب الإجابة الصحيحة (أو اجعليها دائماً الخيار الأول وسيقوم النظام بخلطها تلقائياً للمتعة).</li>
            </ul>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`الصقي الأسئلة هنا... مثال:
ما هو أكبر كوكب في المجموعة الشمسية؟
أ) المشتري ✅
ب) زحل
ج) المريخ
د) الأرض`}
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontFamily: 'var(--font-cairo)',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}
          />

          {status && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '8px', 
              background: status.includes('نجاح') ? '#dcfce7' : '#fee2e2',
              color: status.includes('نجاح') ? '#166534' : '#991b1b',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {status}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button 
            onClick={handleImport}
            disabled={!text.trim()}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              background: text.trim() ? 'linear-gradient(135deg, #ff4fa3 0%, #db2777 100%)' : '#cbd5e1', 
              color: 'white', 
              fontWeight: 'bold', 
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <FaMagic /> تحويل لِلعبة
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
