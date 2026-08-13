"use client";
import { useState, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa";

interface VideoTrimmerProps {
  url: string;
  initialStart?: number;
  initialEnd?: number;
  onChange: (start?: number, end?: number) => void;
}

const formatTime = (secs: number) => {
  if (isNaN(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseTime = (str: string) => {
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
};

const TimeInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => {
  const [inputValue, setInputValue] = useState(formatTime(value));

  useEffect(() => {
    setInputValue(formatTime(value));
  }, [value]);

  const handleAdjust = (delta: number) => {
    const newSecs = Math.max(0, value + delta);
    onChange(newSecs);
    setInputValue(formatTime(newSecs));
  };

  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', overflow: 'hidden', height: '36px', direction: 'ltr' }}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)}
          onBlur={() => {
            const secs = parseTime(inputValue);
            onChange(secs);
            setInputValue(formatTime(secs));
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const secs = parseTime(inputValue);
              onChange(secs);
              setInputValue(formatTime(secs));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              handleAdjust(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              handleAdjust(-1);
            }
          }}
          style={{ flex: 1, minWidth: 0, padding: '8px', border: 'none', outline: 'none', textAlign: 'center', fontSize: '14px', background: 'transparent' }} 
          placeholder="0:00"
        />
        <div style={{ display: 'flex', flexDirection: 'column', width: '24px', height: '100%', borderLeft: '1px solid #cbd5e1', background: '#f8fafc' }}>
          <button 
            onClick={() => handleAdjust(1)}
            style={{ flex: 1, border: 'none', borderBottom: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: 0 }}
            title="زيادة ثانية"
          >
            ▲
          </button>
          <button 
            onClick={() => handleAdjust(-1)}
            style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: 0 }}
            title="تقليل ثانية"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VideoTrimmer({ url: rawUrl, initialStart, initialEnd, onChange }: VideoTrimmerProps) {
  const url = (rawUrl || "").trim();
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState<number>(initialStart || 0);
  const [end, setEnd] = useState<number>(initialEnd || 0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    if (initialStart !== undefined && initialStart !== start) setStart(initialStart);
    if (initialEnd !== undefined && initialEnd !== end) setEnd(initialEnd);
  }, [initialStart, initialEnd]);

  const handleDuration = (d: number) => {
    if (d === 0 || isNaN(d)) return;
    setDuration(d);
    if (!initialEnd || initialEnd === 0) {
      setEnd(d);
      onChange(start, d);
    }
  };

  const playPreview = (timeInSeconds: number) => {
    setIsPlaying(true);
    if (isYoutube) {
      setCurrentTime(timeInSeconds);
    } else if (videoRef.current) {
      if (videoRef.current.readyState > 0) {
        videoRef.current.currentTime = timeInSeconds;
      }
      videoRef.current.play().catch(e => console.log("Autoplay failed:", e));
    }
  };

  const getYoutubeId = (u: string) => {
    if (u.includes("v=")) return u.split("v=")[1].split("&")[0];
    if (u.includes("/shorts/")) return u.split("/shorts/")[1].split("?")[0];
    return u.split("/").pop()?.split("?")[0] || "";
  };

  const forceLoadMetadata = () => {
    if (!isYoutube && videoRef.current) {
      videoRef.current.play().then(() => {
        videoRef.current?.pause();
        setIsPlaying(true);
      }).catch(e => {
        console.error("Autoplay failed:", e);
      });
    } else {
      setIsPlaying(true);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement> | number) => {
    const val = typeof e === 'number' ? e : parseFloat(e.target.value) || 0;
    const newStart = duration > 0 ? Math.min(val, end - 1) : val;
    setStart(newStart);
    onChange(newStart, end);
    if (duration > 0 || isYoutube) playPreview(newStart);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement> | number) => {
    const val = typeof e === 'number' ? e : parseFloat(e.target.value) || 0;
    const newEnd = duration > 0 ? Math.max(val, start + 1) : val;
    setEnd(newEnd);
    onChange(start, newEnd);
    if (duration > 0 || isYoutube) playPreview(newEnd);
  };

  // Moved formatTime to the top so TimeInput can use it.

  return (
    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
      <style>{`
        .dual-slider {
          position: absolute;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
        }
        .dual-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 24px;
          height: 24px;
          background: #ff4fa3;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
        {!isPlaying && duration === 0 ? (
          <div 
            onClick={forceLoadMetadata}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7))' }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ff4fa3', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(255,79,163,0.5)', marginBottom: '15px' }}>
              <FaPlay color="white" size={24} style={{ marginLeft: '4px' }} />
            </div>
            <p style={{ color: 'white', fontWeight: 'bold', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>اضغط هنا لتحميل الفيديو والقص</p>
          </div>
        ) : null}

        {isYoutube ? (
          <iframe
            key={`${url}-${isPlaying ? currentTime : start}-${end}`}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${getYoutubeId(url)}?start=${Math.floor(isPlaying ? currentTime : start)}${end > start ? `&end=${Math.floor(end)}` : ''}&autoplay=${isPlaying ? 1 : 0}&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        ) : (
          <video
            key={url}
            ref={videoRef}
            src={url}
            controls
            playsInline
            preload="metadata"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onLoadedMetadata={(e) => {
              handleDuration(e.currentTarget.duration);
              if (start > 0) e.currentTarget.currentTime = start;
            }}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
              if (end > start && e.currentTarget.currentTime >= end) {
                e.currentTarget.pause();
                setIsPlaying(false);
                e.currentTarget.currentTime = start; // Reset to start for replay
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => console.error("Video loading error:", e)}
          />
        )}
      </div>

      <div style={{ marginTop: '15px' }}>
        
        {/* ALWAYS show manual inputs so she is never blocked */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', justifyContent: 'center' }}>
          <TimeInput label="بداية المقطع" value={start} onChange={handleStartChange} />
          <TimeInput label="نهاية المقطع" value={end} onChange={handleEndChange} />
        </div>

        <div style={{ marginBottom: '15px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>
            تقسيم سريع (كل 8 ثواني):
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>المقطع رقم</span>
            <input 
              type="number" 
              min="1" 
              defaultValue={Math.floor(start / 8) + 1}
              onChange={(e) => {
                const n = parseInt(e.target.value) || 1;
                const newStart = (n - 1) * 8;
                const newEnd = n * 8;
                setStart(newStart);
                setEnd(newEnd);
                onChange(newStart, newEnd);
                playPreview(newStart);
              }}
              style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
          <span>البداية: {formatTime(start)}</span>
          <span>الحالي: {formatTime(currentTime)}</span>
          <span>النهاية: {formatTime(end || duration)}</span>
        </div>

        {duration > 0 ? (
          <div style={{ position: 'relative', height: '8px', background: '#cbd5e1', borderRadius: '4px', margin: '15px 0', display: 'flex', alignItems: 'center' }}>
            <div 
              style={{ position: 'absolute', height: '100%', background: '#ff4fa3', borderRadius: '4px', opacity: 0.5, left: `${(start / duration) * 100}%`, width: `${((end - start) / duration) * 100}%` }} 
            />
            <input type="range" min={0} max={duration} step="0.1" value={start} onChange={handleStartChange} className="dual-slider" style={{ zIndex: 5 }} />
            <input type="range" min={0} max={duration} step="0.1" value={end} onChange={handleEndChange} className="dual-slider" style={{ zIndex: 6 }} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '15px', color: '#64748b', fontSize: '13px', background: '#e2e8f0', borderRadius: '8px', marginTop: '10px' }}>
            شريط السحب يظهر فقط عند تشغيل الفيديو بنجاح، لكن يمكنك كتابة الثواني يدوياً في الخانات بالأعلى.
          </div>
        )}
        
        {duration > 0 && (
          <p style={{ fontSize: '11px', textAlign: 'center', color: '#94a3b8', margin: 0, marginTop: '8px' }}>
            اسحب الدوائر لتحديد بداية ونهاية المقطع المطلوب.
          </p>
        )}
      </div>
    </div>
  );
}
