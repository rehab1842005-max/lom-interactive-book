"use client";

import { useBookStore, Zone, InteractionType } from "../store/bookStore";
import { FaChevronRight, FaChevronLeft, FaVolumeUp, FaVideo, FaQuestionCircle, FaLink } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuestionEngine from "./QuestionEngine";
import ZoneInteractiveIcon from "./ZoneInteractiveIcon";
import JourneyModal from "./JourneyModal";
import PageQuizModal from "./PageQuizModal";
import { FaClipboardCheck } from "react-icons/fa";

export default function StudentViewer({ styles }: { styles: any }) {
  const { pages: allPages, zones, activeLessonId, curriculum } = useBookStore();
  const pages = activeLessonId ? allPages.filter(p => p.lessonId === activeLessonId) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePopupZone, setActivePopupZone] = useState<Zone | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [rippleId, setRippleId] = useState<string | null>(null);
  const [showPageQuiz, setShowPageQuiz] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (pages.length === 0) {
    return (
      <div className={styles.viewerContainer}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "20px" }}>
          <h2>المعلمة لم تضع صوراً في هذا الدرس بعد</h2>
          <p>يرجى العودة لوضع المعلم وإضافة صفحات للكتاب.</p>
          <div style={{ marginTop: "20px", fontSize: "12px", color: "red", border: "1px solid red", padding: "10px", display: "inline-block", textAlign: "left", direction: "ltr" }}>
            <p><strong>معلومات فنية للمطور:</strong></p>
            <p>activeLessonId: {activeLessonId || 'NULL'}</p>
            <p>allPages count: {allPages.length}</p>
            <hr />
            <p><strong>All Pages Data:</strong></p>
            {allPages.map((p, i) => (
              <p key={p.id}>Page {i+1}: lessonId = {p.lessonId || 'undefined'}</p>
            ))}
            <hr />
            <p><strong>Curriculum:</strong></p>
            {Object.entries(curriculum).map(([grade, units]) => (
              <div key={grade}>
                <p>Grade: {grade}</p>
                {units.map(u => (
                  <div key={u.id} style={{ paddingLeft: '10px' }}>
                    <p>Unit: {u.title} (ID: {u.id})</p>
                    {u.lessons.map(l => (
                      <p key={l.id} style={{ paddingLeft: '20px' }}>Lesson: {l.title} (ID: {l.id})</p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentIndex];
  const currentZones = zones.filter(z => z.pageId === currentPage.id);

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleZoneClick = (zone: Zone) => {
    const interactions = zone.interactionTypes && zone.interactionTypes.length > 0 
      ? zone.interactionTypes 
      : (zone.interactionType !== 'none' ? [zone.interactionType] : []);

    if (interactions.length === 0) return;

    // Special cases for single interactions that don't need a modal
    if (interactions.length === 1) {
      const type = interactions[0];
      if (type === 'audio') {
        if (zone.content.audioUrl) {
          if (playingAudioId === zone.id && audioRef.current) {
            audioRef.current.pause();
            setPlayingAudioId(null);
            audioRef.current = null;
            return;
          }
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(zone.content.audioUrl);
          audioRef.current = audio;
          setPlayingAudioId(zone.id);
          audio.play().then(() => {
            audio.onended = () => setPlayingAudioId(null);
          }).catch(e => {
            console.error("Audio error", e);
            setPlayingAudioId(null);
          });
        }
        return;
      }
      if (type === 'link') {
        if (zone.content.linkUrl) {
          window.open(zone.content.linkUrl, "_blank");
        }
        return;
      }
    }

    // For everything else (Video, Question, Note, or Multiple interactions), open JourneyModal
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }
    setActivePopupZone(zone);
  };

  return (
    <div className={styles.viewerContainer} style={{ paddingBottom: '100px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={styles.pageWrapper}
          style={{ containerType: 'inline-size' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={currentPage.imageUrl} 
            alt="Page" 
            style={{ display: "block", width: "100%", height: "auto", userSelect: "none", WebkitUserSelect: "none" }}
          />
          
          {currentZones.map(zone => {
            return (
              <div
                key={zone.id}
                style={{
                  position: "absolute",
                  left: zone.xPercent !== undefined ? `${zone.xPercent}%` : `${(zone.x / 800) * 100}cqw`,
                  top: zone.yPercent !== undefined ? `${zone.yPercent}%` : `${(zone.y / 800) * 100}cqw`,
                  width: zone.widthPercent !== undefined ? `${zone.widthPercent}%` : `${(zone.width / 800) * 100}cqw`,
                  height: zone.heightPercent !== undefined ? `${zone.heightPercent}%` : `${(zone.height / 800) * 100}cqw`,
                  zIndex: 10,
                  pointerEvents: "none"
                }}
              >
                {zone.shape === 'polygon' && zone.polygonPoints ? (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <motion.polygon 
                      points={zone.polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={rippleId === zone.id ? "rgba(255, 79, 163, 0.4)" : "transparent"}
                      whileTap={{ scale: 0.98, y: 2 }}
                      style={{ pointerEvents: 'auto', cursor: 'pointer', transition: "fill 0.2s ease", transformOrigin: "center" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRippleId(zone.id);
                        setTimeout(() => setRippleId(null), 300);
                        handleZoneClick(zone);
                      }}
                    />
                  </svg>
                ) : (
                  <motion.div
                    whileTap={{ 
                      scale: 0.95, 
                      y: 4, 
                      boxShadow: "inset 0px 4px 8px rgba(0,0,0,0.4)", 
                      backgroundColor: "rgba(0,0,0,0.1)" 
                    }}
                    style={{
                      width: '100%', height: '100%',
                      pointerEvents: 'auto', cursor: 'pointer',
                      borderRadius: zone.shape === 'circle' ? "50%" : "8px",
                      backgroundColor: rippleId === zone.id ? "rgba(255, 79, 163, 0.4)" : "transparent",
                      transition: "background-color 0.2s ease"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRippleId(zone.id);
                      setTimeout(() => setRippleId(null), 300);
                      handleZoneClick(zone);
                    }}
                  />
                )}

                {(() => {
                  let cx = 50;
                  let cy = 50;
                  if (zone.shape === 'polygon' && zone.polygonPoints && zone.polygonPoints.length > 0) {
                    cx = zone.polygonPoints.reduce((sum, p) => sum + p.x, 0) / zone.polygonPoints.length;
                    cy = zone.polygonPoints.reduce((sum, p) => sum + p.y, 0) / zone.polygonPoints.length;
                  }
                  const isVideo = !!zone.content?.videoUrl;

                  return (
                    <div style={{ 
                      position: 'absolute', 
                      top: `${cy}%`, 
                      left: `${cx}%`, 
                      transform: 'translate(-50%, -50%)', 
                      pointerEvents: 'none',
                      zIndex: 20
                    }}>
                      {isVideo && (
                        <div style={{ position: 'absolute', transform: 'translate(-50%, -100%)', marginTop: 'clamp(-10px, -2vw, -20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', zIndex: 21 }}>
                          <span style={{ fontFamily: 'var(--font-arabic)', color: '#ff4fa3', fontWeight: 'bold', fontSize: 'clamp(10px, 2.5vw, 16px)', textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '8px' }}>فيديو</span>
                          <svg style={{ width: 'clamp(20px, 4vw, 35px)', height: 'clamp(20px, 4vw, 35px)', transform: 'rotate(-10deg)', marginTop: '2px' }} viewBox="0 0 100 100">
                            <path d="M 80 10 Q 40 20 20 80 M 20 80 L 10 55 M 20 80 L 45 70" stroke="#ff4fa3" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      
                      {zone.showIcon && (
                        <div style={{ pointerEvents: 'auto' }}>
                          <ZoneInteractiveIcon 
                            zone={zone} 
                            onClick={() => handleZoneClick(zone)} 
                            isPlayingAudio={playingAudioId === zone.id}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {pages[currentIndex]?.questions && pages[currentIndex].questions!.length > 0 && (
          <motion.button 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowPageQuiz(true)}
            style={{
              position: 'fixed',
              bottom: 'clamp(65px, 12vw, 85px)', // Above the navigation bar
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-pink)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 25px)',
              fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(255, 79, 163, 0.4)',
              cursor: 'pointer',
              zIndex: 99,
              whiteSpace: 'nowrap'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaClipboardCheck /> اختبر نفسك
          </motion.button>
        )}
      </AnimatePresence>

      <div className={styles.navigation} style={{ 
        display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', padding: '10px 15px',
        position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg-header)', backdropFilter: 'blur(10px)',
        borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100,
        width: 'max-content', maxWidth: '95%'
      }}>
        <button className={styles.navButton} onClick={handleNext} disabled={currentIndex === pages.length - 1} style={{ padding: '8px 15px', display: 'flex', gap: '5px', alignItems: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '25px', border: 'none', cursor: currentIndex === pages.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex === pages.length - 1 ? 0.5 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
          <span>التالي</span> <FaChevronLeft />
        </button>

        <button onClick={() => window.scrollBy({ top: 300, behavior: 'smooth' })} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }} title="نزول لأسفل">
          <i className="fa-solid fa-arrow-down"></i>
        </button>
        
        <span className={styles.pageIndicator} style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)', margin: '0 2px' }}>{currentIndex + 1}/{pages.length}</span>

        <button onClick={() => window.scrollBy({ top: -300, behavior: 'smooth' })} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }} title="صعود لأعلى">
          <i className="fa-solid fa-arrow-up"></i>
        </button>

        <button className={styles.navButton} onClick={handlePrev} disabled={currentIndex === 0} style={{ padding: '8px 15px', display: 'flex', gap: '5px', alignItems: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '25px', border: 'none', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.5 : 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
          <FaChevronRight /> <span>السابق</span>
        </button>
      </div>

      {/* Educational Journey Modal */}
      <AnimatePresence>
        {activePopupZone && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: '10px'
          }} onClick={() => setActivePopupZone(null)}>
            <JourneyModal zone={activePopupZone} onClose={() => setActivePopupZone(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Page Quiz Modal */}
      <AnimatePresence>
        {showPageQuiz && pages[currentIndex] && (
          <PageQuizModal 
            page={pages[currentIndex]} 
            onClose={() => setShowPageQuiz(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
