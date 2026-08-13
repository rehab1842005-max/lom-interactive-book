"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { useAdminStore, AdminUser } from "../store/adminStore";
import { FaLock, FaUserShield } from "react-icons/fa";

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { currentAdmin, setCurrentAdmin } = useAdminStore();
  const [status, setStatus] = useState<'loading' | 'checking' | 'unauthenticated' | 'authenticated'>('loading');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('rehab_admin_token');
      if (!token) {
        // No token, check if we need to setup first owner
        try {
          const ownerDocRef = doc(db, 'admins', '01020203751');
          const ownerDoc = await getDoc(ownerDocRef);
          if (!ownerDoc.exists()) {
            // Create default owner admin
            const defaultAdmin: AdminUser = {
              id: '01020203751',
              phone: '01020203751',
              name: 'رحاب السباعي (المالك)',
              role: 'owner',
              permissions: { manageCurriculum: true, manageStudents: true, manageAdmins: true }
            };
            await setDoc(ownerDocRef, { ...defaultAdmin, password: 'R1842005' });
          }
        } catch (e) {
          console.error("Failed to check admins", e);
        }
        setStatus('unauthenticated');
        return;
      }

      // Check token in DB
      try {
        const docSnap = await getDoc(doc(db, 'admins', token));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentAdmin({
            id: docSnap.id,
            phone: data.phone,
            name: data.name,
            role: data.role,
            permissions: data.permissions
          });
          setStatus('authenticated');
        } else {
          localStorage.removeItem('rehab_admin_token');
          setStatus('unauthenticated');
        }
      } catch (e) {
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, [setCurrentAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Find admin by phone
      const docSnap = await getDoc(doc(db, 'admins', phone));
      
      if (!docSnap.exists()) {
        setError('رقم الهاتف غير مسجل كمدير.');
        setIsSubmitting(false);
        return;
      }

      const data = docSnap.data();
      if (data.password !== password) {
        setError('كلمة المرور غير صحيحة.');
        setIsSubmitting(false);
        return;
      }

      // Login success
      localStorage.setItem('rehab_admin_token', docSnap.id);
      setCurrentAdmin({
        id: docSnap.id,
        phone: data.phone,
        name: data.name,
        role: data.role,
        permissions: data.permissions
      });
      setStatus('authenticated');
      
    } catch (e) {
      setError('حدث خطأ أثناء تسجيل الدخول. تأكد من اتصالك بالإنترنت.');
    }
    
    setIsSubmitting(false);
  };

  if (status === 'loading' || status === 'checking') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-secondary)' }}>
        <div style={{ color: 'var(--primary-color)', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-spinner fa-spin"></i> جاري التحقق...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--color-pink-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'var(--color-pink)',
            fontSize: '32px'
          }}>
            <FaUserShield />
          </div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: '10px' }}>لوحة تحكم المعلم</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>قم بتسجيل الدخول للوصول إلى أدوات الإدارة</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)', fontSize: '14px' }}>رقم الهاتف</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="أدخل رقم هاتفك"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  direction: 'ltr'
                }}
              />
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)', fontSize: '14px' }}>كلمة المرور</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  direction: 'ltr'
                }}
              />
            </div>
            
            {error && (
              <div style={{ color: '#ef4444', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '14px',
                fontSize: '16px',
                marginTop: '10px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin"></i> جاري الدخول...</> : <><FaLock /> تسجيل الدخول</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
