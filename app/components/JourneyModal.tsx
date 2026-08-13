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
  const { updateZone } = useBookStore();
  const allQs = zone.content.questions || (zone.content.question ? [zone.content.question] : []);
  const hasVideo = zone.interactionTypes?.includes('video') || zone.interactionType === 'video';
  const hasAudio = !!zone.content.audioUrl;
  const hasQuestion = allQs.length > 0;
  const hasNote = !!zone.content.noteText;
  
  // Track manual reveal of the question
  const [showQuestion, setShowQuestion] = useState(!(hasVideo || hasAudio));
  
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
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        padding: "20px", 
        width: "100%", 
        maxWidth: "700px", 
        maxHeight: "90vh", 
        overflowY: "auto", 
        position: "relative",
        fontFamily: "'Cairo', 'Tajawal', sans-serif"
      }}
      onClick={e => e.stopPropagation()}
    >
      <button 
        onClick={onClose}
        style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "32px", cursor: "pointer", color: "#555", zIndex: 10 }}
      >
        &times;
      </button>

      <h3 style={{ marginBottom: "1.5rem", color: "var(--color-purple)", fontSize: "1.5rem", textAlign: "center" }}>
        {zone.name || "رحلة تعليمية"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {hasVideo && !zone.content.videoUrl && (
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
        )}
        
        {/* VIDEO SECTION */}
        {hasVideo && zone.content.videoUrl && (
          <div style={{ background: "#000", padding: "0", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            {zone.content.videoUrl.includes("youtube.com") || zone.content.videoUrl.includes("youtu.be") ? (
              <iframe 
                width="100%" 
                height="400" 
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
                style={{ display: "block", pointerEvents: (zone.content.videoStartTime || zone.content.videoEndTime) ? 'none' : 'auto' }}
              />
            ) : zone.content.videoUrl.includes("tiktok.com") ? (
              <iframe 
                width="100%" 
                height="750" 
                src={`https://www.tiktok.com/embed/v2/${
                  zone.content.videoUrl.includes("/video/")
                    ? zone.content.videoUrl.split("/video/")[1].split("?")[0]
                    : zone.content.videoUrl.split("/").pop()?.split("?")[0]
                }`}
                title="TikTok video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ display: "block" }}
              />
            ) : (
              <video 
                src={`${zone.content.videoUrl}${zone.content.videoStartTime ? `#t=${zone.content.videoStartTime}${zone.content.videoEndTime ? `,${zone.content.videoEndTime}` : ''}` : ''}`} 
                controls={!(zone.content.videoStartTime || zone.content.videoEndTime)}
                autoPlay 
                style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "contain", cursor: (zone.content.videoStartTime || zone.content.videoEndTime) ? 'pointer' : 'default' }} 
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

        {/* MANUAL QUESTION REVEAL BUTTON */}
        {hasQuestion && !showQuestion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", marginTop: "10px" }}>
            <button 
              onClick={() => setShowQuestion(true)}
              style={{
                background: "linear-gradient(135deg, #FF4FA3 0%, #a252ff 100%)",
                color: "white",
                border: "none",
                borderRadius: "30px",
                padding: "12px 24px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(255, 79, 163, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <FaQuestionCircle size={24} />
              انتقل إلى الاختبار
            </button>
          </motion.div>
        )}

        {/* QUESTION SECTION */}
        {hasQuestion && showQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderTop: (hasVideo || hasNote) ? "2px solid #e2e8f0" : "none", paddingTop: (hasVideo || hasNote) ? "1.5rem" : "0" }}
          >
            {showFinalScore ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "12px", border: "2px solid #4ade80" }}>
                <h3 style={{ color: "#16a34a", fontSize: "1.8rem", marginBottom: "1rem" }}>🎉 أحسنت صنعاً! 🎉</h3>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  لقد أتممت الاختبار بنجاح!
                </p>
                <div style={{ marginTop: "20px" }}>
                  <button onClick={onClose} style={{ background: "var(--color-green)", color: "white", padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}>
                    إغلاق المربع
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {allQs.length > 1 && (
                  <div style={{ marginBottom: "10px", fontSize: "14px", color: "var(--text-muted)", fontWeight: "bold", textAlign: "right" }}>
                    سؤال {currentQuestionIndex + 1} من {allQs.length}
                  </div>
                )}
                {allQs[currentQuestionIndex] ? (
                  <QuestionEngine 
                    key={currentQuestionIndex} // force remount for new question
                    question={allQs[currentQuestionIndex]} 
                    onComplete={() => {
                      // Move to next question after a short delay
                      setTimeout(() => {
                        if (currentQuestionIndex < allQs.length - 1) {
                          setCurrentQuestionIndex(currentQuestionIndex + 1);
                        } else {
                          setShowFinalScore(true);
                        }
                      }, 2500); // 2.5s wait to enjoy the success animation before switching
                    }} 
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "12px" }}>
                    <p>السؤال غير مكتمل.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
