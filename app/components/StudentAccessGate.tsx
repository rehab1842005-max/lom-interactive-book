"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useBookStore } from "../store/bookStore";
import { FaLock, FaUserClock, FaUnlock } from "react-icons/fa";

interface StudentAccessGateProps {
  lessonId: string;
  grade: number;
  unitId: string;
  onAccessGranted: () => void;
  onCancel: () => void;
}

export default function StudentAccessGate({ lessonId, grade, unitId, onAccessGranted, onCancel }: StudentAccessGateProps) {
  const { curriculum } = useBookStore();
  
  const [studentId, setStudentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'free' | 'unregistered' | 'pending' | 'approved' | 'blocked'>('checking');
  const [isGlobalChecked, setIsGlobalChecked] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to global settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists() && snap.data().globalFreeAccess === true) {
        setStatus('free');
        onAccessGranted();
      }
      setIsGlobalChecked(true);
    });
    return () => unsub();
  }, [onAccessGranted]);

  // Check if lesson is free
  useEffect(() => {
    if (!isGlobalChecked) return; // Wait for global check first to avoid flashing "unregistered" screen
    if (status === 'free') return; // Already granted by global access

    let isFree = false;
    const units = curriculum[grade] || [];
    for (const u of units) {
      if (u.id === unitId) {
        const l = u.lessons.find(l => l.id === lessonId);
        if (l && l.isFree) isFree = true;
      }
    }

    if (isFree) {
      setStatus('free');
      onAccessGranted();
      return;
    }

    // Not free, check local storage
    const localId = localStorage.getItem('rehab_student_id');
    if (!localId) {
      setStatus('unregistered');
    } else {
      setStudentId(localId);
    }
  }, [lessonId, grade, unitId, curriculum, onAccessGranted, isGlobalChecked, status]);

  // Listen to Firebase status if registered
  useEffect(() => {
    if (!studentId || status === 'free') return;
    
    setStatus('checking');
    
    const unsub = onSnapshot(doc(db, 'students', studentId), (snap) => {
      if (!snap.exists()) {
        localStorage.removeItem('rehab_student_id');
        setStatus('unregistered');
        return;
      }
      
      const data = snap.data();
      
      if (data.status === 'blocked') {
        setStatus('blocked');
        return;
      }
      
      if (data.status === 'pending') {
        setStatus('pending');
        return;
      }
      
      if (data.status === 'approved') {
        // Check permissions
        const perms = data.permissions || {};
        const hasGrade = perms.grades?.includes(grade);
        const hasUnit = perms.units?.includes(unitId);
        const hasLesson = perms.lessons?.includes(lessonId);
        
        if (hasGrade || hasUnit || hasLesson) {
          setStatus('approved');
          onAccessGranted();
        } else {
          // Approved but no permission for this specific lesson yet
          setStatus('pending'); // Just show pending review for this content
        }
      }
    });
    
    return () => unsub();
  }, [studentId, grade, unitId, lessonId, status, onAccessGranted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    const newId = uuidv4();
    
    try {
      await setDoc(doc(db, 'students', newId), {
        name,
        phone,
        status: 'pending',
        requestedAt: Date.now()
      });
      localStorage.setItem('rehab_student_id', newId);
      setStudentId(newId);
    } catch (err) {
      alert("حدث خطأ أثناء إرسال الطلب. تأكد من اتصالك بالإنترنت.");
    }
    setIsSubmitting(false);
  };

  if (status === 'checking') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div className="loader" style={{ margin: '0 auto 20px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
          <p>جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (status === 'free' || status === 'approved') {
    return null; // Should not render, onAccessGranted handles it
  }

  if (status === 'pending') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <FaUserClock size={60} color="#f59e0b" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#f59e0b', marginBottom: '15px' }}>طلبك قيد المراجعة</h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '25px' }}>
            يرجى الانتظار لحين موافقة أ. رحاب السباعي. بمجرد الموافقة، سيفتح الدرس تلقائياً ولن تحتاج لتحديث الصفحة.
          </p>
          <button onClick={onCancel} className="btn-secondary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <FaLock size={60} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>تم رفض الطلب</h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '25px' }}>
            عذراً، لم يتم منحك صلاحية الوصول لهذا المحتوى.
          </p>
          <button onClick={onCancel} className="btn-secondary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <FaLock size={50} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>هذا المحتوى حصري لطلاب أ. رحاب السباعي</h2>
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '25px', fontSize: '14px' }}>
          للوصول إلى هذه الدروس، يرجى إدخال بياناتك لإرسال طلب دخول لـ أ. رحاب السباعي.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="الاسم الثلاثي (مطلوب)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="رقم الهاتف (اختياري)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={isSubmitting || !name.trim()} className="btn-primary" style={{ padding: '12px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 'bold' }}>
            {isSubmitting ? 'جاري الإرسال...' : 'طلب دخول'}
          </button>
        </form>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#888', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}>
          إلغاء والعودة للرئيسية
        </button>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  padding: '20px'
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: '40px',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '450px',
  textAlign: 'center',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '16px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s'
};
