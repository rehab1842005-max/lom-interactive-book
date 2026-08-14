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

  const handleMasterVideoClick = () => {
    if (!currentPage.pageVideoUrl) return;
    const masterZone: any = {
      id: "master-video",
      pageId: currentPage.id,
      name: "شرح الصفحة",
      color: "blue",
      x: 0, y: 0, width: 0, height: 0,
      interactionType: 'video',
      interactionTypes: ['video'],
      showIcon: false,
      content: {
        videoUrl: currentPage.pageVideoUrl
      }
    };
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }
    setActivePopupZone(masterZone);
  };

  const handleZoneClick = (zone: Zone) => {
    // Dynamic slicing logic for numbered zones using Master Video
    let finalZone = JSON.parse(JSON.stringify(zone)); // Deep copy
    
    if (!finalZone.interactionTypes) {
      finalZone.interactionTypes = finalZone.interactionType !== 'none' ? [finalZone.interactionType] : [];
    }

    const content = finalZone.content || {};
    if (!content.videoUrl && currentPage.pageVideoUrl && !isNaN(Number(zone.name))) {
      const seq = Number(zone.name);
      if (seq > 0) {
        const interval = currentPage.videoSplitInterval || 8;
        finalZone.content = {
          ...content,
          videoUrl: currentPage.pageVideoUrl,
          videoStartTime: (seq - 1) * interval,
          videoEndTime: seq * interval
        };
        if (!finalZone.interactionTypes.includes('video')) {
          finalZone.interactionTypes.push('video');
        }
      }
    }

    const interactions = finalZone.interactionTypes;
    if (interactions.length === 0) return;

    // Special cases for single interactions that don't need a modal
    if (interactions.length === 1) {
      const type = interactions[0];
      if (type === 'audio') {
        if (finalZone.content.audioUrl) {
          if (playingAudioId === finalZone.id && audioRef.current) {
            audioRef.current.pause();
            setPlayingAudioId(null);
            audioRef.current = null;
            return;
          }
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(finalZone.content.audioUrl);
          audioRef.current = audio;
          setPlayingAudioId(finalZone.id);
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
        if (finalZone.content.linkUrl) {
          window.open(finalZone.content.linkUrl, "_blank");
        }
        return;
      }
    }

    // For everything else (Video, Question, Note, or Multiple interactions), open JourneyModal
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }
    setActivePopupZone(finalZone);
  };

  return (
    <div className={styles.viewerContainer} style={{ paddingBottom: '40px' }}>
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
          {/* Container for Image and Zones to keep percentages accurate */}
          <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
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
                  <div
                    className="invisible-btn-3d"
                    style={{
                      width: '100%', height: 'calc(100% - 3px)',
                      pointerEvents: 'auto',
                      borderRadius: zone.shape === 'circle' ? "50%" : "12px",
                      position: 'relative'
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

                  return (
                    <>
                      <div style={{ 
                        position: 'absolute', 
                        top: `${cy}%`, 
                        left: `${cx}%`, 
                        transform: 'translate(-50%, -50%)', 
                        pointerEvents: 'none',
                        zIndex: 20
                      }}>
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

                      {/* Video Label inside the 3px shadow */}
                      {(zone.interactionTypes?.includes('video') || zone.interactionType === 'video' || !!zone.content?.videoUrl) && (
                        <div className="zone-shadow-text" style={{ 
                          position: 'absolute', 
                          bottom: '-3px', /* Sit exactly where the 3px shadow is */
                          left: '0',
                          width: '100%',
                          height: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          zIndex: 20,
                          color: '#ff4fa3', /* Pink text */
                          fontSize: '8px', /* Very small */
                          fontWeight: '400', /* Thin */
                          letterSpacing: '1px'
                        }}>
                          فيديو
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            );
          })}
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Premium Floating Action Dock */}
      <AnimatePresence>
        {(currentPage.pageVideoUrl || (pages[currentIndex]?.questions && pages[currentIndex].questions!.length > 0)) && (
          <motion.div
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '15px',
              left: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 79, 163, 0.2)',
              borderRadius: '25px',
              boxShadow: '0 8px 20px rgba(255, 79, 163, 0.15), 0 4px 10px rgba(0,0,0,0.05)',
              zIndex: 100,
            }}
          >
            {/* Video Button inside Dock */}
            {currentPage.pageVideoUrl && (
              <motion.button 
                onClick={handleMasterVideoClick}
                style={{
                  background: 'transparent',
                  color: 'var(--color-pink)',
                  border: 'none',
                  padding: '2px 6px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  borderRadius: '15px',
                  transition: 'background 0.2s',
                }}
                whileHover={{ backgroundColor: 'rgba(255, 79, 163, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-brands fa-youtube" style={{ fontSize: '1rem' }}></i> 
                <span>شرح الصفحة</span>
              </motion.button>
            )}

            {/* Divider if both exist */}
            {currentPage.pageVideoUrl && (pages[currentIndex]?.questions && pages[currentIndex].questions!.length > 0) && (
              <div style={{ width: '1px', height: '16px', background: 'rgba(255, 79, 163, 0.2)' }} />
            )}

            {/* Quiz Button inside Dock */}
            {pages[currentIndex]?.questions && pages[currentIndex].questions!.length > 0 && (
              <motion.button 
                onClick={() => setShowPageQuiz(true)}
                style={{
                  background: 'transparent',
                  color: 'var(--color-pink)',
                  border: 'none',
                  padding: '2px 6px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  borderRadius: '15px',
                  transition: 'background 0.2s',
                }}
                whileHover={{ backgroundColor: 'rgba(255, 79, 163, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span>اختبر نفسك</span>
                <FaClipboardCheck style={{ fontSize: '1rem' }} />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right (Previous) Navigation Button */}
      <button 
        onClick={handlePrev} 
        disabled={currentIndex === 0}
        style={{
          position: 'fixed', right: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'var(--color-pink)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', boxShadow: '0 4px 15px rgba(255, 79, 163, 0.4)',
          zIndex: 100, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
          opacity: currentIndex === 0 ? 0.2 : 0.6,
          fontSize: '1.2rem', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { if(currentIndex !== 0) e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { if(currentIndex !== 0) e.currentTarget.style.opacity = '0.6'; }}
      >
        <FaChevronRight />
      </button>

      {/* Left (Next) Navigation Button */}
      <button 
        onClick={handleNext} 
        disabled={currentIndex === pages.length - 1}
        style={{
          position: 'fixed', left: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'var(--color-pink)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', boxShadow: '0 4px 15px rgba(255, 79, 163, 0.4)',
          zIndex: 100, cursor: currentIndex === pages.length - 1 ? 'not-allowed' : 'pointer',
          opacity: currentIndex === pages.length - 1 ? 0.2 : 0.6,
          fontSize: '1.2rem', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { if(currentIndex !== pages.length - 1) e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { if(currentIndex !== pages.length - 1) e.currentTarget.style.opacity = '0.6'; }}
      >
        <FaChevronLeft />
      </button>

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
