"use client";

import { useState } from "react";
import { Page, Question, useBookStore } from "../store/bookStore";
import QuestionEngine from "./QuestionEngine";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaStar } from "react-icons/fa";

interface PageQuizModalProps {
  page: Page;
  onClose: () => void;
}

export default function PageQuizModal({ page, onClose }: PageQuizModalProps) {
  const { pages, zones } = useBookStore();
  const currentLessonPages = pages.filter(p => p.lessonId === page.lessonId);
  const pageZoneQs = zones.filter(z => z.pageId === page.id).flatMap(z => z.content?.questions || (z.content?.question ? [z.content.question] : []));
  const allQs = (page.questions && page.questions.length > 0) 
    ? page.questions 
    : (currentLessonPages.find(p => p.questions && p.questions.length > 0)?.questions 
       || pages.find(p => p.questions && p.questions.length > 0)?.questions 
       || (pageZoneQs.length > 0 ? pageZoneQs : []));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [score, setScore] = useState(0);

  // If there are no questions for some reason, just show a message.
  if (allQs.length === 0) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "12px", textAlign: "center" }}>
          <h2>لا توجد أسئلة هنا</h2>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "8px", marginTop: "15px", cursor: "pointer" }}>إغلاق</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: '10px'
    }} onClick={onClose}>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: "#fff",
          borderRadius: "15px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={onClose} 
          style={{
            position: "absolute", top: "15px", left: "15px",
            background: "rgba(0,0,0,0.05)", border: "none",
            width: "30px", height: "30px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10, color: "#666"
          }}
        >
          <FaTimes />
        </button>

        <div style={{ padding: "20px" }}>
          {showFinalScore ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '40px 20px' }}
            >
              <div style={{ fontSize: '60px', color: '#fbbf24', margin: '20px 0' }}>
                <FaStar /> <FaStar /> <FaStar />
              </div>
              <h2 style={{ color: 'var(--primary-color)', fontSize: '28px', marginBottom: '10px' }}>ممتاز يا بطل! 🌟</h2>
              <p style={{ fontSize: '20px', color: '#4b5563', marginBottom: '30px', fontWeight: 'bold' }}>
                لقد أتممت أسئلة هذه الصفحة بنجاح!
                <br /><br />
                <span style={{ fontSize: '24px', color: 'var(--color-pink)' }}>
                  نتيجتك: {score} من {allQs.length}
                </span>
              </p>
              
              <button 
                onClick={onClose}
                style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                متابعة الدرس
              </button>
            </motion.div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #f0f0f0' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>اختبر نفسك</h3>
                <div style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>
                  سؤال {currentQuestionIndex + 1} من {allQs.length}
                </div>
              </div>
              
              {allQs[currentQuestionIndex] ? (
                  <QuestionEngine 
                    key={currentQuestionIndex} // force remount for new question
                    question={allQs[currentQuestionIndex]} 
                    forceSingleAttempt={true}
                    onComplete={(success?: boolean) => {
                      if (success) {
                        setScore(s => s + 1);
                      }
                      // Move to next question after a short delay
                      setTimeout(() => {
                        if (currentQuestionIndex < allQs.length - 1) {
                          setCurrentQuestionIndex(currentQuestionIndex + 1);
                        } else {
                          setShowFinalScore(true);
                        }
                      }, 1000);
                    }} 
                  />
                ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
