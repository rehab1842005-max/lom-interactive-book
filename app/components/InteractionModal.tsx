"use client";

import { useState, useEffect } from "react";
import { useBookStore, Zone, InteractionType } from "../store/bookStore";
import QuestionBuilderModal from "./QuestionBuilderModal";
import VideoTrimmer from "./VideoTrimmer";

export default function InteractionModal({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const { updateZone, pages } = useBookStore();
  const currentPage = pages.find(p => p.id === zone.pageId);

  const [name, setName] = useState(zone.name);
  const [color, setColor] = useState(zone.color);
  const [showIcon, setShowIcon] = useState(zone.showIcon ?? false);
  const [types, setTypes] = useState<InteractionType[]>(zone.interactionTypes || (zone.interactionType !== 'none' ? [zone.interactionType] : []));
  const [audioUrl, setAudioUrl] = useState(zone.content.audioUrl || "");
  const [questions, setQuestions] = useState<any[]>(zone.content.questions || (zone.content.question ? [zone.content.question] : []));

  // Determine initial video values, applying auto-slicing logic if applicable
  let initialVideoUrl = zone.content.videoUrl || "";
  let initialStartTime = zone.content.videoStartTime;
  let initialEndTime = zone.content.videoEndTime;

  if (!initialVideoUrl && currentPage?.pageVideoUrl && !isNaN(Number(zone.name))) {
    const seq = Number(zone.name);
    if (seq > 0) {
      initialVideoUrl = currentPage.pageVideoUrl;
      const interval = currentPage.videoSplitInterval || 8;
      initialStartTime = (seq - 1) * interval;
      initialEndTime = seq * interval;
    }
  }

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);

  const formatSecondsToTime = (seconds?: number): string => {
    if (seconds === undefined || isNaN(seconds)) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
    return `${seconds}`; // just seconds
  };

  const parseTimeToSeconds = (timeStr: string): number | undefined => {
    if (!timeStr) return undefined;
    if (!isNaN(Number(timeStr))) return parseInt(timeStr, 10);
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2) {
      const [m, s] = parts;
      return (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
    } else if (parts.length === 3) {
      const [h, m, s] = parts;
      return (isNaN(h) ? 0 : h * 3600) + (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
    }
    return undefined;
  };

  const [startTimeStr, setStartTimeStr] = useState<string>(formatSecondsToTime(initialStartTime));
  const [endTimeStr, setEndTimeStr] = useState<string>(formatSecondsToTime(initialEndTime));

  // Also update zone content immediately if we auto-populated, so VideoTrimmer sees it
  useEffect(() => {
    if (!zone.content.videoUrl && currentPage?.pageVideoUrl && !isNaN(Number(zone.name))) {
       const seq = Number(zone.name);
       if (seq > 0) {
          const interval = currentPage.videoSplitInterval || 8;
          updateZone(zone.id, {
             content: {
                ...zone.content,
                videoUrl: currentPage.pageVideoUrl,
                videoStartTime: (seq - 1) * interval,
                videoEndTime: seq * interval
             }
          });
       }
    }
  }, []);

  useEffect(() => {
    setName(zone.name);
    setColor(zone.color);
    setShowIcon(zone.showIcon);
    setTypes(zone.interactionTypes || (zone.interactionType !== 'none' ? [zone.interactionType] : []));
    setAudioUrl(zone.content.audioUrl || "");
    setVideoUrl(zone.content.videoUrl || initialVideoUrl);
    setQuestions(zone.content.questions || (zone.content.question ? [zone.content.question] : []));
    
    // Only update string state if the actual number from store is different (to prevent cursor jumping while typing valid partials)
    const storeStart = formatSecondsToTime(zone.content.videoStartTime || initialStartTime);
    const storeEnd = formatSecondsToTime(zone.content.videoEndTime || initialEndTime);
    if (parseTimeToSeconds(startTimeStr) !== (zone.content.videoStartTime || initialStartTime)) {
      setStartTimeStr(storeStart);
    }
    if (parseTimeToSeconds(endTimeStr) !== (zone.content.videoEndTime || initialEndTime)) {
      setEndTimeStr(storeEnd);
    }
  }, [zone]);

  const toggleType = (type: InteractionType) => {
    setTypes(prev => {
      const newTypes = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      updateZone(zone.id, { interactionTypes: newTypes, interactionType: newTypes[0] || 'none' });
      return newTypes;
    });
  };

  const handleSave = () => {
    try {
      const currentZoneInStore = useBookStore.getState().zones.find(z => z.id === zone.id);
      updateZone(zone.id, {
        name,
        color,
        showIcon,
        interactionType: types[0] || 'none', // Legacy support
        interactionTypes: types,
        content: {
          ...(currentZoneInStore?.content || zone.content),
          videoUrl: videoUrl || currentZoneInStore?.content.videoUrl || zone.content.videoUrl,
          audioUrl: audioUrl || currentZoneInStore?.content.audioUrl || zone.content.audioUrl,
          videoStartTime: parseTimeToSeconds(startTimeStr) !== undefined ? parseTimeToSeconds(startTimeStr) : (currentZoneInStore?.content.videoStartTime || zone.content.videoStartTime),
          videoEndTime: parseTimeToSeconds(endTimeStr) !== undefined ? parseTimeToSeconds(endTimeStr) : (currentZoneInStore?.content.videoEndTime || zone.content.videoEndTime),
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ! مساحة التخزين ممتلئة.");
      onClose();
    }
  };

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const [uploadingState, setUploadingState] = useState<{video: boolean, audio: boolean}>({video: false, audio: false});

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limit size to 50MB for videos to avoid massive uploads
    if (file.size > 50 * 1024 * 1024) {
      alert("الملف كبير جداً! (الحد الأقصى 50 ميجابايت). يرجى تقليل حجم الملف أو رفعه على يوتيوب ووضع الرابط.");
      return;
    }

    try {
      setUploadingState(prev => ({...prev, [type]: true}));
      
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `media/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const metadata = {
        contentType: file.type || (type === 'video' ? 'video/mp4' : 'audio/mpeg'),
      };
      
      console.log("جاري الرفع إلى السحابة...", fileName);
      await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      if (type === 'video') {
        setVideoUrl(downloadUrl);
        updateZone(zone.id, { content: { ...zone.content, videoUrl: downloadUrl } });
      }
      if (type === 'audio') {
        setAudioUrl(downloadUrl);
        updateZone(zone.id, { content: { ...zone.content, audioUrl: downloadUrl } });
      }
      
      alert("تم رفع الملف بنجاح!");
      setUploadingState(prev => ({...prev, [type]: false}));
    } catch (error) {
      console.error(error);
      alert('فشل الرفع! تأكدي من اتصالك بالإنترنت.');
      setUploadingState(prev => ({...prev, [type]: false}));
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{ background: "#ffffff", padding: "2rem", width: "400px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h3 style={{ marginBottom: "1.5rem", color: "var(--color-purple)" }}>إعدادات المنطقة: {name}</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          <label>
            اسم المنطقة:
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>
          
          <label>
            لون الأيقونة والحدود:
            <input 
              type="color" 
              value={color} 
              onChange={e => setColor(e.target.value)} 
              style={{ width: "100%", height: "40px", marginTop: "5px", border: "none", cursor: "pointer" }}
            />
          </label>

          <label style={{ fontSize: "14px", fontWeight: "bold" }}>شكل المنطقة:</label>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            <button 
              onClick={() => updateZone(zone.id, { shape: 'rect' })}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: zone.shape !== 'circle' && zone.shape !== 'polygon' ? "2px solid #FF4FA3" : "1px solid #ccc", background: zone.shape !== 'circle' && zone.shape !== 'polygon' ? "#FF4FA322" : "white", cursor: "pointer" }}
            >
              🔲 مربع
            </button>
            <button 
              onClick={() => updateZone(zone.id, { shape: 'circle' })}
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: zone.shape === 'circle' ? "2px solid #FF4FA3" : "1px solid #ccc", background: zone.shape === 'circle' ? "#FF4FA322" : "white", cursor: "pointer" }}
            >
              ⭕ دائرة
            </button>
            {zone.shape === 'polygon' && (
              <button 
                disabled
                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "2px solid #FF4FA3", background: "#FF4FA322", cursor: "not-allowed" }}
              >
                ✍️ مضلع حر
              </button>
            )}
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={showIcon} onChange={e => {setShowIcon(e.target.checked); updateZone(zone.id, { showIcon: e.target.checked });}} />
              إظهار الأيقونة
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
              (إذا لم تقم بتفعيلها، ستكون المنطقة مخفية وتعمل بالضغط)
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>أنواع التفاعل (يمكن اختيار أكثر من نوع):</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {[
                { id: 'audio', label: 'صوت' },
                { id: 'video', label: 'فيديو' },
                { id: 'question', label: 'سؤال تفاعلي' },
                { id: 'note', label: 'ملاحظة' },
                { id: 'link', label: 'رابط خارجي' }
              ].map(opt => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={types.includes(opt.id as InteractionType)} 
                    onChange={() => toggleType(opt.id as InteractionType)} 
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {types.includes('video') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>رابط الفيديو (MP4/YouTube):</label>
              <input 
                type="text" 
                value={videoUrl} 
                onChange={e => {
                  setVideoUrl(e.target.value);
                  updateZone(zone.id, { content: { ...zone.content, videoUrl: e.target.value } });
                }} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                placeholder="الصق الرابط هنا..."
              />
              <div style={{ textAlign: 'center', margin: '5px 0', fontSize: '12px', color: '#666' }}>أو</div>
              <label style={{ background: '#FF4FA3', color: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', opacity: uploadingState.video ? 0.5 : 1 }}>
                {uploadingState.video ? 'جاري الرفع...' : 'رفع فيديو من الجهاز'}
                <input type="file" accept="video/*" style={{ display: 'none' }} disabled={uploadingState.video} onChange={e => handleUpload(e, 'video')} />
              </label>

              {videoUrl && (
                <VideoTrimmer 
                  url={videoUrl}
                  initialStart={zone.content.videoStartTime}
                  initialEnd={zone.content.videoEndTime}
                  onChange={(start, end) => {
                    setStartTimeStr(formatSecondsToTime(start));
                    setEndTimeStr(formatSecondsToTime(end));
                    updateZone(zone.id, { content: { ...zone.content, videoStartTime: start, videoEndTime: end } });
                  }}
                />
              )}
            </div>
          )}

          {types.includes('audio') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>رابط الصوت (MP3):</label>
              <input 
                type="text" 
                value={audioUrl} 
                onChange={e => setAudioUrl(e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                placeholder="الصق الرابط هنا..."
              />
              <div style={{ textAlign: 'center', margin: '5px 0', fontSize: '12px', color: '#666' }}>أو</div>
              <label style={{ background: '#FF4FA3', color: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', opacity: uploadingState.audio ? 0.5 : 1 }}>
                {uploadingState.audio ? 'جاري الرفع...' : 'رفع صوت من الجهاز'}
                <input type="file" accept="audio/*" style={{ display: 'none' }} disabled={uploadingState.audio} onChange={e => handleUpload(e, 'audio')} />
              </label>
            </div>
          )}

          {types.includes('question') && (
            <div style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px", border: "1px dashed var(--color-pink)", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                إعدادات الأسئلة (اختبار)
              </p>
              
              {/* List of existing questions */}
              {(() => {
                // Migrate legacy single question to the array for display
                let allQs: any[] = zone.content.questions || [];
                if (zone.content.question && allQs.length === 0) {
                  allQs = [zone.content.question];
                }
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {allQs.map((q, idx) => (
                      <div key={q.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>سؤال {idx + 1}: {q.title ? (q.title.length > 20 ? q.title.substring(0, 20) + '...' : q.title) : 'بدون عنوان'}</span>
                        <button 
                          onClick={() => setEditingQuestionIndex(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                        >
                          ✏️ تعديل
                        </button>
                      </div>
                    ))}
                    
                    {allQs.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>لم يتم إضافة أي أسئلة بعد.</p>
                    )}
                  </div>
                );
              })()}

              <button 
                onClick={() => setEditingQuestionIndex(-1)}
                style={{ 
                  background: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >
                + إضافة سؤال جديد
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={handleSave}>حفظ التغييرات</button>
        </div>
      </div>
      {editingQuestionIndex !== null && (
        <QuestionBuilderModal 
          initialQuestion={
            editingQuestionIndex === -1 
              ? {} 
              : ((zone.content.questions || (zone.content.question ? [zone.content.question] : []))[editingQuestionIndex] || {})
          } 
          onSave={(updatedQ) => {
            let allQs = [...(zone.content.questions || [])];
            // Migrate legacy if editing
            if (allQs.length === 0 && zone.content.question) {
              allQs = [zone.content.question];
            }
            
            if (editingQuestionIndex === -1) {
              allQs.push(updatedQ as any);
            } else {
              allQs[editingQuestionIndex] = updatedQ as any;
            }

            const newInteractions = new Set(types);
            newInteractions.add('question');
            const newTypes = Array.from(newInteractions);
            setTypes(newTypes);
            
            updateZone(zone.id, { 
              interactionTypes: newTypes,
              content: { 
                ...zone.content, 
                questions: allQs,
                question: undefined // Remove legacy to prefer array
              } 
            });
            setEditingQuestionIndex(null);
          }}
          onClose={() => setEditingQuestionIndex(null)}
        />
      )}
    </div>
  );
}
