"use client";

import { useBookStore, Zone, InteractionType } from "../store/bookStore";
import { FaVolumeUp, FaVideo, FaQuestionCircle, FaLink } from "react-icons/fa";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuestionEngine from "./QuestionEngine";
import ZoneInteractiveIcon from "./ZoneInteractiveIcon";
import JourneyModal from "./JourneyModal";
import PageQuizModal from "./PageQuizModal";
import { FaClipboardCheck } from "react-icons/fa";

export default function StudentViewer({ styles }: { styles: any }) {
  const { pages: allPages, zones, activeLessonId, curriculum } = useBookStore();
  const pages = activeLessonId ? allPages.filter(p => p.lessonId === activeLessonId) : [];
  
  const [activePopupZone, setActivePopupZone] = useState<Zone | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [rippleId, setRippleId] = useState<string | null>(null);
  const [showPageQuiz, setShowPageQuiz] = useState<string | null>(null); // stores pageId
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lessonTitle = useMemo(() => {
    let title = "";
    if (activeLessonId) {
      Object.values(curriculum).forEach((units: any) => {
        units.forEach((u: any) => {
          const l = u.lessons.find((x: any) => x.id === activeLessonId);
          if (l) title = l.title;
        });
      });
    }
    return title;
  }, [curriculum, activeLessonId]);

  const sortedPages = [...pages].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (pages.length === 0) {
    return (
      <div className={styles.viewerContainer}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "20px" }}>
          <h2>أ. رحاب السباعي لم تضع صوراً في هذا الدرس بعد</h2>
          <p>يرجى العودة في وقت لاحق عندما تقوم أ. رحاب السباعي بإضافة المحتوى.</p>
        </div>
      </div>
    );
  }

  const handleMasterVideoClick = (page: any) => {
    if (!page.pageVideoUrl) return;
    const masterZone: any = {
      id: "master-video",
      pageId: page.id,
      name: "شرح الصفحة",
      color: "blue",
      x: 0, y: 0, width: 0, height: 0,
      interactionType: 'video',
      interactionTypes: ['video', ...(page.questions && page.questions.length > 0 ? ['question'] : [])],
      showIcon: false,
      content: {
        videoUrl: page.pageVideoUrl,
        questions: page.questions || []
      }
    };
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }
    setActivePopupZone(masterZone);
  };

  const handleZoneClick = (zone: Zone, page: any) => {
    // Dynamic slicing logic for numbered zones using Master Video
    let finalZone = JSON.parse(JSON.stringify(zone)); // Deep copy
    finalZone.pageId = zone.pageId || page.id;
    
    if (!finalZone.interactionTypes) {
      finalZone.interactionTypes = finalZone.interactionType !== 'none' ? [finalZone.interactionType] : [];
    }

    const content = finalZone.content || {};
    const zoneNumMatch = zone.name ? zone.name.match(/\d+/) : null;
    const seq = zoneNumMatch ? parseInt(zoneNumMatch[0], 10) : (!isNaN(Number(zone.name)) ? Number(zone.name) : null);
    
    if (!content.videoUrl && page.pageVideoUrl && seq !== null && seq > 0) {
      const interval = page.videoSplitInterval || 8;
      finalZone.content = {
        ...content,
        videoUrl: page.pageVideoUrl,
        videoStartTime: (seq - 1) * interval,
        videoEndTime: seq * interval
      };
      if (!finalZone.interactionTypes.includes('video')) {
        finalZone.interactionTypes.push('video');
      }
    }

    const storeZones = useBookStore.getState().zones;
    const freshZone = storeZones.find(z => z.id === zone.id);
    if (freshZone?.content?.questions && freshZone.content.questions.length > 0) {
      finalZone.content = {
        ...finalZone.content,
        questions: freshZone.content.questions
      };
      if (!finalZone.interactionTypes.includes('question')) {
        finalZone.interactionTypes.push('question');
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
    <div className={styles.viewerContainer} style={{ overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fdf2f8', paddingBottom: '80px' }}>
      
      {/* Lesson Title Header */}
      {lessonTitle && (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center', backgroundColor: 'var(--color-pink)', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(255, 79, 163, 0.4)' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{lessonTitle}</h1>
        </div>
      )}

      {/* Pages Container - Vertical Scroll */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {sortedPages.map((page, idx) => {
          const currentZones = zones.filter(z => z.pageId === page.id || zones.length <= 15);
          
          return (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={styles.pageWrapper}
              style={{ containerType: 'inline-size', position: 'relative', width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}
            >
              {/* Page Image & Zones */}
              <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={page.imageUrl} 
                  alt={`Page ${idx + 1}`} 
                  style={{ display: "block", width: "100%", height: "auto", userSelect: "none", WebkitUserSelect: "none" }}
                />
              
                {currentZones.filter(z => z.pageId === page.id).map(zone => {
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
                              handleZoneClick(zone, page);
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
                            handleZoneClick(zone, page);
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
                                    onClick={() => handleZoneClick(zone, page)} 
                                    isPlayingAudio={playingAudioId === zone.id}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Video Label inside the 3px shadow */}
                            {(zone.interactionTypes?.includes('video') || zone.interactionType === 'video' || !!zone.content?.videoUrl) && (
                              <div className="zone-shadow-text" style={{ 
                                position: 'absolute', 
                                bottom: '-3px',
                                left: '0',
                                width: '100%',
                                height: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 20,
                                color: '#ff4fa3',
                                fontSize: '8px',
                                fontWeight: '400',
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

              {/* Action Dock BELOW the Page */}
              {(() => {
                const hasPageVideo = !!page.pageVideoUrl;
                
                const directPageQuestions = page.questions || [];
                const pageZones = currentZones.filter(z => z.pageId === page.id);
                const zoneQuestions = pageZones.flatMap(z => z.content?.questions || (z.content?.question ? [z.content.question] : []));
                
                const finalQuizQuestions = directPageQuestions.length > 0 
                  ? directPageQuestions 
                  : (zoneQuestions.length > 0 ? zoneQuestions : []);
                
                const pageQuestionsCount = finalQuizQuestions.length;
                const hasAnyQuestions = pageQuestionsCount > 0;

                if (!hasPageVideo && !hasAnyQuestions) return null;

                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderTop: '1px solid rgba(255, 79, 163, 0.1)',
                      width: '100%'
                    }}
                  >
                    {/* Video Button */}
                    {hasPageVideo && (
                      <motion.button 
                        onClick={() => handleMasterVideoClick(page)}
                        style={{
                          background: 'transparent',
                          color: 'var(--color-pink)',
                          border: 'none',
                          padding: '6px 14px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          borderRadius: '20px',
                          transition: 'background 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        whileHover={{ backgroundColor: 'rgba(255, 79, 163, 0.12)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fa-brands fa-youtube" style={{ fontSize: '1.1rem', color: '#ef4444' }}></i> 
                        <span>شرح الصفحة</span>
                      </motion.button>
                    )}

                    {/* Divider if both exist */}
                    {hasPageVideo && hasAnyQuestions && (
                      <div style={{ width: '2px', height: '18px', background: 'rgba(255, 79, 163, 0.3)' }} />
                    )}

                    {/* Quiz Button */}
                    {hasAnyQuestions && (
                      <motion.button 
                        onClick={() => setShowPageQuiz(page.id)}
                        style={{
                          background: 'linear-gradient(135deg, #ff4fa3 0%, #db2777 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 18px',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          borderRadius: '20px',
                          boxShadow: '0 3px 10px rgba(219, 39, 119, 0.35)',
                          whiteSpace: 'nowrap'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaClipboardCheck style={{ fontSize: '1.1rem' }} />
                        <span>اختبر نفسك ({pageQuestionsCount})</span>
                      </motion.button>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          );
        })}
      </div>

      {/* Top Bar with version number */}
      <div style={{ position: "fixed", top: "10px", left: "10px", zIndex: 100, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none" }}>
        <span style={{ 
          background: "rgba(255, 255, 255, 0.9)", 
          padding: "4px 10px", 
          borderRadius: "8px", 
          fontSize: "0.85rem", 
          fontWeight: "bold", 
          color: "#db2777",
          border: "1px solid #fbcfe8",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          pointerEvents: "auto"
        }}>
          v2.0 ✨
        </span>
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
        {showPageQuiz && (
          <PageQuizModal 
            page={pages.find(p => p.id === showPageQuiz)!} 
            onClose={() => setShowPageQuiz(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
