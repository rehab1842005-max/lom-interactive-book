"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useBookStore, Question } from "../store/bookStore";
import { FaTimes, FaMagic, FaCheckCircle } from "react-icons/fa";

export default function SmartImporterModal({ 
  onClose,
  pageId
}: { 
  onClose: () => void;
  pageId: string;
}) {
  const [text, setText] = useState("");
  const { zones, updateZone, pages, updatePage } = useBookStore();
  const [status, setStatus] = useState("");
  
  const handleImport = () => {
    if (!text.trim()) return;
    setStatus("جاري تحليل وتوزيع الأسئلة...");
    
    try {
      const normalizeDigits = (str: string) => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.replace(/[٠-٩]/g, d => arabicNumbers.indexOf(d).toString());
      };

      const normalizedText = normalizeDigits(text);
      const lines = normalizedText.split('\n');
      let currentTarget: 'zone' | 'page' | null = null;
      let currentZoneSeq: string | null = null;
      
      let pageQuestions: Question[] = [];
      let zoneQuestionsMap: Record<string, Question[]> = {};
      let allParsedQuestions: Question[] = [];
      
      let currentQ: Partial<Question> | null = null;
      let currentMode: 'tf' | 'mcq' | null = null;
      
      const saveCurrentQuestion = () => {
        if (currentQ && currentQ.title) {
          const finalQ: Question = {
            id: Math.random().toString(36).substring(2, 10),
            type: currentQ.type || 'tf',
            title: currentQ.title,
            options: currentQ.options || (currentQ.type === 'tf' ? ['صح', 'خطأ'] : []),
            correctAnswer: currentQ.correctAnswer !== undefined ? currentQ.correctAnswer : (currentQ.type === 'tf' ? 'صح' : (currentQ.options?.[0] || '')),
            points: 1,
            maxAttempts: 2,
            showAnswer: true
          };
          
          allParsedQuestions.push(finalQ);
          
          if (currentTarget === 'page') {
            pageQuestions.push(finalQ);
          } else if (currentTarget === 'zone' && currentZoneSeq) {
            if (!zoneQuestionsMap[currentZoneSeq]) zoneQuestionsMap[currentZoneSeq] = [];
            zoneQuestionsMap[currentZoneSeq].push(finalQ);
          } else {
            pageQuestions.push(finalQ);
          }
        }
        currentQ = null;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // 1. Check for targets
        if (line.includes('اختبار الصفحة') || line.includes('اختبار شامل') || line.includes('اختبار الدرس')) {
          saveCurrentQuestion();
          currentTarget = 'page';
          continue;
        }
        
        // Ignore Markdown horizontal rules
        if (/^[\-\*]{3,}$/.test(line)) {
          continue;
        }
        
        // Match zone headers ONLY when not in page quiz mode, or when explicitly preceded by ### or 'المقطع'
        const isExplicitZoneHeader = line.includes('المقطع') || line.includes('مقطع') || line.includes('المربع') || line.includes('مربع') || (line.startsWith('#') && !line.includes('اختبار'));
        
        if (isExplicitZoneHeader || currentTarget !== 'page') {
          const arabicWordMap: Record<string, string> = { 'الأول': '1', 'الاول': '1', 'الثاني': '2', 'الثالث': '3', 'الرابع': '4', 'الخامس': '5', 'السادس': '6', 'السابع': '7', 'الثامن': '8', 'التاسع': '9', 'العاشر': '10' };
          let matchedSeq: string | null = null;
          
          const zoneMatch = line.match(/(?:###|##|#|\*{1,2})?\s*(?:المقطع|مقطع|المربع|مربع|المنطقة|منطقة|س|فقرة)?\s*(\d+)\s*(?:[—\-:\.\)]|\*{1,2}|$)/i);
          if (zoneMatch && isExplicitZoneHeader) {
            matchedSeq = zoneMatch[1];
          } else if (zoneMatch && currentTarget !== 'page' && !line.match(/^\*\*?\d+\.?\*\*?/) && !line.match(/^\d+[\.\)]/)) {
            matchedSeq = zoneMatch[1];
          } else {
            for (const [word, num] of Object.entries(arabicWordMap)) {
              if (line.includes(word) && (line.includes('المقطع') || line.includes('مقطع') || line.includes('المربع') || line.includes('مربع') || line.startsWith('#'))) {
                matchedSeq = num;
                break;
              }
            }
          }

          if (matchedSeq && !line.startsWith('✅') && !line.startsWith('❌') && !line.match(/^[أ-يa-d][\.\)]/)) {
            saveCurrentQuestion();
            currentTarget = 'zone';
            currentZoneSeq = matchedSeq;
            continue;
          }
        }
        
        // 2. Check for mode switches
        if (line.includes('صح أم غلط') || line.includes('صح ام غلط') || line.includes('صح و خطأ') || line.includes('صح أو خطأ') || line.includes('صح أم خطأ')) {
          saveCurrentQuestion();
          currentMode = 'tf';
          continue;
        }
        
        if (line.includes('اختيار من متعدد') || line.includes('اختر الإجابة') || line.includes('اختر الاجابه') || line.includes('اختيار من المتعدد')) {
          saveCurrentQuestion();
          currentMode = 'mcq';
          continue;
        }
        
        // 3. Process line based on whether it's an answer option or a new question title
        const isMcqOption = !!line.match(/^[أ-يa-d][\.\)]/) || !!line.match(/^[\-\*]\s*[أ-يa-d]/) || !!line.match(/^\d+[\.\)]\s*[أ-يa-d]/);
        const isTfAnswer = line.includes('✅') || line.includes('❌') || line === 'صح' || line === 'خطأ' || line === 'غلط' || line === 'صواب';
        
        if (!isMcqOption && !isTfAnswer) {
          // This must be a new question title!
          saveCurrentQuestion();
          if (!currentMode) {
            currentMode = 'tf';
          }
          if (currentMode) {
            let cleanTitle = line.replace(/^\*\*?\d+\.?\*\*?\s*/, '').replace(/\*+/g, '').trim();
            cleanTitle = cleanTitle.replace(/^(?:س\s*\d+|\d+)[\.\-:\)]\s*/, '').trim();
            
            if (cleanTitle) {
              currentQ = {
                type: currentMode,
                title: cleanTitle,
                options: currentMode === 'tf' ? ['صح', 'خطأ'] : []
              };
            }
          }
        } else if (currentQ) {
          if (currentQ.type === 'tf') {
            if (line.includes('✅ صح') || line.includes('صح ✅') || line === 'صح' || (line.includes('✅') && !line.includes('غلط') && !line.includes('خطأ'))) {
              currentQ.correctAnswer = 'صح';
            } else if (line.includes('❌ غلط') || line.includes('غلط ❌') || line.includes('خطأ') || line === 'غلط' || line.includes('❌')) {
              currentQ.correctAnswer = 'خطأ';
            }
          } else if (currentQ.type === 'mcq') {
            const isCorrect = line.includes('✅');
            const cleanOption = line.replace(/^[أ-يa-d\d][\.\)]/, '').replace('✅', '').replace(/\*+/g, '').trim();
            if (cleanOption) {
              currentQ.options = [...(currentQ.options || []), cleanOption];
              if (isCorrect) {
                currentQ.correctAnswer = cleanOption;
              }
            }
          }
        }
      }
      saveCurrentQuestion();
      
      const extractNum = (str?: string): number | null => {
        if (!str) return null;
        const m = str.match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
      };

      // Apply parsed data to zones
      let appliedZones = 0;
      const { updateMultipleZones, updatePage, pages: currentPages, zones: freshZones, activeLessonId } = useBookStore.getState();
      const targetPageId = pageId || currentPages[0]?.id;
      const activePage = currentPages.find(p => p.id === targetPageId);
      
      const pageZones = freshZones.filter(z => z.pageId === targetPageId || freshZones.length <= 15);
      // Sort visual zones top to bottom, right to left
      const visualZones = [...pageZones].sort((a, b) => Math.abs(a.y - b.y) > 25 ? a.y - b.y : b.x - a.x);
      
      let seqIndex = 0;
      const zoneUpdates: {id: string, updates: Partial<any>}[] = [];

      for (const [seq, qs] of Object.entries(zoneQuestionsMap)) {
        seqIndex++;
        const targetSeqNum = parseInt(seq, 10);
        
        let targetZone = pageZones.find(z => extractNum(z.name) === targetSeqNum);
        if (!targetZone && visualZones[seqIndex - 1]) {
          targetZone = visualZones[seqIndex - 1];
        }
        if (!targetZone && pageZones[seqIndex - 1]) {
          targetZone = pageZones[seqIndex - 1];
        }
        
        if (targetZone) {
          const interactions = new Set(targetZone.interactionTypes || (targetZone.interactionType !== 'none' ? [targetZone.interactionType] : []));
          interactions.add('question');
          if (!interactions.has('video') && (targetZone.content?.videoUrl || activePage?.pageVideoUrl)) {
            interactions.add('video');
          }
          
          zoneUpdates.push({
            id: targetZone.id,
            updates: { 
              interactionTypes: Array.from(interactions),
              content: {
                ...targetZone.content,
                questions: qs,
                question: undefined
              }
            }
          });
          appliedZones++;
        }
      }
      
      if (zoneUpdates.length > 0) {
        updateMultipleZones(zoneUpdates);
      }

      // Save comprehensive page questions for the whole page quiz across the lesson/page
      const finalPageQuestions = pageQuestions.length > 0 ? pageQuestions : (allParsedQuestions.length <= 15 ? allParsedQuestions : allParsedQuestions.slice(0, 10));
      
      const pagesToUpdate = currentPages.filter(p => p.id === targetPageId || (activeLessonId && p.lessonId === activeLessonId));
      if (pagesToUpdate.length > 0) {
        pagesToUpdate.forEach(p => updatePage(p.id, { questions: finalPageQuestions }));
      } else {
        currentPages.forEach(p => updatePage(p.id, { questions: finalPageQuestions }));
      }
      
      setStatus(`تم استيراد الأسئلة بنجاح! تم توزيع الأسئلة على ${appliedZones} مربعات، وتحديث اختبار الصفحة (${finalPageQuestions.length} أسئلة).`);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (e) {
      console.error(e);
      setStatus("حدث خطأ في التحليل، يرجى التأكد من التنسيق.");
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '700px',
        maxWidth: '90%',
        padding: '30px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaMagic /> استيراد الأسئلة بالذكاء الاصطناعي
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>
            <FaTimes />
          </button>
        </div>
        
        <p style={{ color: '#666', marginBottom: '15px' }}>
          انسخي الأسئلة التي قمتِ بتحضيرها والصقيها هنا. سيقوم النظام تلقائياً بتوزيعها على المربعات الصحيحة (1، 2، 3...) واختبار الصفحة.
        </p>
        
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="### 1 — ماذا يوجد حولنا؟&#10;&#10;**صح أم غلط:**&#10;كل ما يوجد حولنا في الطبيعة يعتبر كائنًا حيًا.&#10;❌ غلط&#10;..."
          style={{
            width: '100%',
            height: '280px',
            padding: '15px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            fontSize: '15px',
            fontFamily: 'monospace',
            resize: 'vertical',
            direction: 'rtl'
          }}
        />
        
        {status && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            borderRadius: '8px', 
            backgroundColor: status.includes('بنجاح') ? '#dcfce7' : '#f1f5f9',
            color: status.includes('بنجاح') ? '#166534' : '#334155',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {status.includes('بنجاح') && <FaCheckCircle />}
            {status}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px' }}>
          <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
            إلغاء
          </button>
          <button onClick={handleImport} style={{ padding: '12px 35px', borderRadius: '8px', border: 'none', background: 'var(--color-pink)', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMagic /> تحليل واستيراد
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
