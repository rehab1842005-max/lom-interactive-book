"use client";

import { useState, useRef, useEffect } from "react";
import { useBookStore, Zone } from "../store/bookStore";
import QuestionEngine from "./QuestionEngine";
import { motion } from "framer-motion";
import { FaQuestionCircle } from "react-icons/fa";

interface JourneyModalProps {
  zone: Zone;
  onClose: () => void;
}

export default function JourneyModal({ zone, onClose }: JourneyModalProps) {
  const { updateZone, pages, zones } = useBookStore();
  
  // Find the page for this zone with robust fallbacks
  const page = pages.find(p => p.id === zone.pageId) || pages.find(p => p.lessonId === zone.pageId) || pages[0];
  const currentZoneInStore = zones.find(z => z.id === zone.id);
  
  // Zone-specific questions only (Master Video gets all page questions, numbered zones get their own questions or page fallback)
  const zoneQs = (currentZoneInStore?.content?.questions && currentZoneInStore.content.questions.length > 0)
    ? currentZoneInStore.content.questions
    : (Array.isArray(zone.content?.questions) && zone.content.questions.length > 0 
        ? zone.content.questions 
        : (zone.content?.question ? [zone.content.question] : []));
  
  const pageQs = page?.questions || [];
  const isZoneSpecific = zoneQs.length > 0;
  const fallbackQs = pages.find(p => p.questions && p.questions.length > 0)?.questions || zones.find(z => z.content?.questions && z.content.questions.length > 0)?.content?.questions || [];
  const allQs = isZoneSpecific ? zoneQs : (pageQs.length > 0 ? pageQs : fallbackQs);
  
  const hasVideo = zone.interactionTypes?.includes('video') || zone.interactionType === 'video' || !!zone.content?.videoUrl;
  const hasAudio = !!zone.content?.audioUrl;
  const hasQuestion = allQs.length > 0;
  const hasNote = !!zone.content?.noteText;
  
  // Active Tab state if both Video and Quiz exist
  const [activeTab, setActiveTab] = useState<'video' | 'quiz'>(hasVideo ? 'video' : 'quiz');

  // Quiz tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // When modal opens, if there's audio and it's NOT a YouTube link, play it natively.
    if (hasAudio && zone.content.audioUrl) {
      const isYoutube = zone.content.audioUrl.includes('youtube.com') || zone.content.audioUrl.includes('youtu.be');
      
      if (!isYoutube) {
        const audio = new Audio(zone.content.audioUrl);
        audio.play().catch(e => console.error("Audio autoplay failed:", e));
        
        audioRef.current = audio;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hasAudio, zone.content.audioUrl]);

  let displayVideoUrl = zone.content.videoUrl;
  if (displayVideoUrl?.includes('/shorts/')) {
    const shortId = displayVideoUrl.split('/shorts/')[1].split('?')[0];
    displayVideoUrl = `https://www.youtube.com/watch?v=${shortId}`;
  }

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.8 }}
      style={{ 
        background: "#ffffff", 
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        padding: "20px", 
        width: "100%", 
        maxWidth: "720px", 
        maxHeight: "90vh", 
        overflowY: "auto", 
        position: "relative",
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        border: "3px solid #fbcfe8"
      }}
      onClick={e => e.stopPropagation()}
    >
      <button 
        onClick={onClose}
        style={{ 
          position: "absolute", top: "15px", left: "15px", 
          background: "#fee2e2", border: "none", width: "36px", height: "36px",
          borderRadius: "50%", fontSize: "20px", cursor: "pointer", 
          color: "#ef4444", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold"
        }}
      >
        &times;
      </button>

      <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-purple)", fontSize: "1.4rem", textAlign: "center", fontWeight: "bold" }}>
        {zone.name || "رحلة تعليمية تفاعلية"}
      </h3>

      {/* Prominent Quick-Switch Tabs at the Top */}
      {hasVideo && hasQuestion && (
        <div style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "1.2rem",
          background: "#fdf2f8",
          padding: "6px",
          borderRadius: "30px",
          border: "1px solid #fbcfe8"
        }}>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "25px",
              border: "none",
              background: activeTab === 'video' ? "linear-gradient(135deg, #ff4fa3 0%, #db2777 100%)" : "transparent",
              color: activeTab === 'video' ? "#fff" : "#db2777",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: activeTab === 'video' ? "0 4px 12px rgba(219, 39, 119, 0.3)" : "none",
              transition: "all 0.2s"
            }}
          >
            <i className="fa-solid fa-play"></i> 1. مشاهدة الشرح
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "25px",
              border: "none",
              background: activeTab === 'quiz' ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" : "transparent",
              color: activeTab === 'quiz' ? "#fff" : "#6d28d9",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: activeTab === 'quiz' ? "0 4px 12px rgba(109, 40, 217, 0.3)" : "none",
              transition: "all 0.2s"
            }}
          >
            <FaQuestionCircle /> 2. اختبر نفسك ({allQs.length} أسئلة)
          </button>
        </div>
      )}
        {/* VIDEO SECTION */}
        {hasVideo && activeTab === 'video' && (
          <div>
            {!zone.content.videoUrl ? (
              <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "15px", borderRadius: "8px", textAlign: "center", border: "1px solid #f87171" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "24px", marginBottom: "10px" }}></i>
                <h4 style={{ margin: "0 0 10px 0" }}>لا يوجد رابط فيديو مسجل في هذه المنطقة!</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>يرجى العودة لوضع المعلم، وفتح إعدادات هذه المنطقة لإضافة الرابط.</p>
                <button 
                  onClick={() => {
                    const url = window.prompt("الصقي رابط اليوتيوب هنا لإصلاح المشكلة فوراً:");
                    if (url) {
                      updateZone(zone.id, { content: { ...zone.content, videoUrl: url } });
                      alert("تم الحفظ بنجاح! الرابط الآن مسجل. يرجى إغلاق هذه النافذة وفتحها مرة أخرى.");
                    }
                  }}
                  style={{ marginTop: "15px", background: "#b91c1c", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  أصلح المشكلة الآن (أدخلي الرابط هنا)
                </button>
              </div>
            ) : (
              <div style={{ background: "#000", padding: "0", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", width: "100%", aspectRatio: "16/9" }}>
                {zone.content.videoUrl.includes("youtube.com") || zone.content.videoUrl.includes("youtu.be") ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${
                      zone.content.videoUrl.includes("v=") 
                        ? zone.content.videoUrl.split("v=")[1].split("&")[0] 
                        : zone.content.videoUrl.includes("/shorts/")
                          ? zone.content.videoUrl.split("/shorts/")[1].split("?")[0]
                          : zone.content.videoUrl.split("/").pop()?.split("?")[0]
                    }?autoplay=1&rel=0${zone.content.videoStartTime ? `&start=${zone.content.videoStartTime}` : ''}${zone.content.videoEndTime ? `&end=${zone.content.videoEndTime}` : ''}${(zone.content.videoStartTime || zone.content.videoEndTime) ? '&controls=0&disablekb=1' : ''}`}
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: "none", display: "block", pointerEvents: (zone.content.videoStartTime || zone.content.videoEndTime) ? 'none' : 'auto' }}
                  />
                ) : zone.content.videoUrl.includes("tiktok.com") ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.tiktok.com/embed/v2/${
                      zone.content.videoUrl.includes("/video/")
                        ? zone.content.videoUrl.split("/video/")[1].split("?")[0]
                        : zone.content.videoUrl.split("/").pop()?.split("?")[0]
                    }`}
                    title="TikTok video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                ) : (
                  <video 
                    src={`${zone.content.videoUrl}${zone.content.videoStartTime ? `#t=${zone.content.videoStartTime}${zone.content.videoEndTime ? `,${zone.content.videoEndTime}` : ''}` : ''}`} 
                    controls={!(zone.content.videoStartTime || zone.content.videoEndTime)}
                    autoPlay 
                    style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", cursor: (zone.content.videoStartTime || zone.content.videoEndTime) ? 'pointer' : 'default' }} 
                    onClick={(e) => {
                      if (zone.content.videoStartTime || zone.content.videoEndTime) {
                        const video = e.target as HTMLVideoElement;
                        if (video.paused) video.play();
                        else video.pause();
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* AUDIO PLACEHOLDER */}
        {!hasVideo && hasAudio && (
          <div style={{ textAlign: "center", padding: "2rem", background: "rgba(255, 79, 163, 0.1)", borderRadius: "12px" }}>
            <div className="sound-wave-circle" style={{ position: "relative", margin: "0 auto", animation: "pulse 1.5s infinite" }}></div>
            <p style={{ marginTop: "1rem", color: "var(--color-purple)", fontWeight: "bold" }}>جارٍ الاستماع...</p>
          </div>
        )}

        {/* NOTE SECTION */}
        {hasNote && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "1.5rem", background: "var(--color-light-pink)", borderRadius: "12px", color: "var(--color-purple)", fontSize: "1.1rem" }}
          >
            <strong>ملاحظة:</strong> {zone.content.noteText}
          </motion.div>
        )}

        {/* Under Video Action Button to switch to Quiz */}
        {hasVideo && hasQuestion && activeTab === 'video' && (
          <div style={{ textAlign: "center", marginTop: "1.5rem", padding: "10px" }}>
            <button 
              onClick={() => setActiveTab('quiz')}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: "30px",
                fontSize: "1.15rem",
                fontWeight: "bold",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 6px 20px rgba(109, 40, 217, 0.35)",
                transition: "all 0.2s",
              }}
            >
              <FaQuestionCircle style={{ fontSize: '1.3rem' }} />
              <span>
                {isZoneSpecific 
                  ? `اختبر نفسك في هذا المقطع (${allQs.length} ${allQs.length === 1 ? 'سؤال' : 'أسئلة'})` 
                  : `اختبر نفسك (${allQs.length} ${allQs.length === 1 ? 'سؤال' : 'أسئلة'})`
                }
              </span>
            </button>
          </div>
        )}

        {/* QUESTION SECTION - Displayed only when on quiz tab or when there is no video */}
        {hasQuestion && (activeTab === 'quiz' || !hasVideo) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              paddingTop: "0.5rem", 
              marginTop: "0.5rem" 
            }}
          >
            {/* Back to video button */}
            {hasVideo && (
              <div style={{ marginBottom: "1rem" }}>
                <button 
                  onClick={() => setActiveTab('video')}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    padding: "8px 18px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>العودة لمشاهدة الشرح</span>
                </button>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.2rem',
              background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)',
              padding: '12px 20px',
              borderRadius: '14px',
              border: '1px solid #fbcfe8',
              boxShadow: '0 2px 8px rgba(255, 79, 163, 0.08)'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#db2777", 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                <FaQuestionCircle /> اختبر نفسك
              </h3>
              {allQs.length > 1 && !showFinalScore && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #db2777 0%, #a252ff 100%)', 
                  color: 'white', 
                  padding: '4px 14px', 
                  borderRadius: '20px', 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold' 
                }}>
                  سؤال {currentQuestionIndex + 1} من {allQs.length}
                </span>
              )}
            </div>

            {showFinalScore ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#f0fdf4", borderRadius: "16px", border: "2px solid #86efac" }}>
                <h3 style={{ color: "#16a34a", fontSize: "1.8rem", marginBottom: "0.5rem" }}>🎉 أحسنت صنعاً! 🎉</h3>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#15803d" }}>
                  لقد حصلت على {correctAnswers} من {allQs.length} إجابة صحيحة!
                </p>
                <div style={{ marginTop: "20px" }}>
                  <button onClick={onClose} style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)", color: "white", padding: "10px 24px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)" }}>
                    إغلاق والعودة للدرس
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {allQs[currentQuestionIndex] ? (
                  <QuestionEngine 
                    key={currentQuestionIndex}
                    question={allQs[currentQuestionIndex]} 
                    forceSingleAttempt={true}
                    onComplete={(success?: boolean) => {
                      if (success) {
                        setCorrectAnswers(c => c + 1);
                      }
                      setTimeout(() => {
                        if (currentQuestionIndex < allQs.length - 1) {
                          setCurrentQuestionIndex(currentQuestionIndex + 1);
                        } else {
                          setShowFinalScore(true);
                        }
                      }, 700);
                    }} 
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "1rem", background: "#f8fafc", borderRadius: "12px" }}>
                    <p>السؤال غير مكتمل.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
    </motion.div>
  );
}
