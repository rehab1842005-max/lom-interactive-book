"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useBookStore, Question } from "../store/bookStore";
import { FaTimes, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import QuestionBuilderModal from "./QuestionBuilderModal";

export default function PageQuestionsModal({
  pageId,
  onClose
}: {
  pageId: string;
  onClose: () => void;
}) {
  const { pages, updatePage } = useBookStore();
  const page = pages.find((p) => p.id === pageId);
  const questions = page?.questions || [];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (!page) return null;

  const handleSaveQuestion = (q: Partial<Question>) => {
    const updatedQuestions = [...questions];
    if (editingIndex !== null && editingIndex < updatedQuestions.length) {
      updatedQuestions[editingIndex] = q as Question;
    } else {
      updatedQuestions.push(q as Question);
    }
    updatePage(pageId, { questions: updatedQuestions });
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      updatePage(pageId, { questions: updatedQuestions });
    }
  };

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "white", width: "90%", maxWidth: "600px",
        maxHeight: "90vh", overflowY: "auto", borderRadius: "12px",
        padding: "20px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "15px", right: "15px",
          background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666"
        }}>
          <FaTimes />
        </button>

        <h2 style={{ marginTop: 0, color: "var(--primary-color)", borderBottom: "2px solid #f0f0f0", paddingBottom: "10px" }}>
          <i className="fa-solid fa-clipboard-question"></i> إعداد أسئلة الصفحة
        </h2>

        {editingIndex !== null ? (
          <QuestionBuilderModal
            initialQuestion={editingIndex < questions.length ? questions[editingIndex] : {}}
            onSave={handleSaveQuestion}
            onClose={() => setEditingIndex(null)}
          />
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <p style={{ color: '#555' }}>
                أضف أسئلة تظهر للطالب عند ضغطه على زر "اختبر نفسك" في هذه الصفحة.
              </p>
              <button
                onClick={() => setEditingIndex(questions.length)}
                style={{
                  background: 'var(--primary-color)', color: 'white', border: 'none',
                  padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center'
                }}
              >
                <FaPlus /> إضافة سؤال
              </button>
            </div>

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                لا توجد أسئلة لهذه الصفحة بعد.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questions.map((q, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px'
                  }}>
                    <div style={{ flex: 1, fontWeight: 'bold', color: '#334155' }}>
                      {idx + 1}. {q.title}
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginTop: '4px' }}>
                        النوع: {q.type} | النقاط: {q.points}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingIndex(idx)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteQuestion(idx)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
