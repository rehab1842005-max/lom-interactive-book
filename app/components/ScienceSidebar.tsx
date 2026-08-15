"use client";

import { useState, useEffect } from "react";
import { useBookStore } from "../store/bookStore";
import { useDropzone } from "react-dropzone";
import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaEdit, FaMagic } from "react-icons/fa";
import QuestionBuilderModal from "./QuestionBuilderModal";
import PageQuestionsModal from "./PageQuestionsModal";
import SmartImporterModal from "./SmartImporterModal";



import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useAdminStore, AdminUser } from "../store/adminStore";

interface Student {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'blocked';
  permissions?: {
    grades?: number[];
    units?: string[]; // unitIds
    lessons?: string[]; // lessonIds
  };
  requestedAt: number;
}

function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [globalFreeAccess, setGlobalFreeAccess] = useState<boolean>(false);
  const { curriculum } = useBookStore();

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      const data: Student[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as Student));
      data.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
      setStudents(data);
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setGlobalFreeAccess(snap.data().globalFreeAccess === true);
      }
    });
    
    return () => {
      unsubStudents();
      unsubSettings();
    };
  }, []);

  const toggleGlobalAccess = async () => {
    try {
      // Use setDoc with merge to ensure the document is created if it doesn't exist
      await updateDoc(doc(db, 'settings', 'general'), { globalFreeAccess: !globalFreeAccess }).catch(async () => {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'general'), { globalFreeAccess: !globalFreeAccess }, { merge: true });
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, status: Student['status']) => {
    await updateDoc(doc(db, 'students', id), { status });
  };

  const savePermissions = async () => {
    if (!editingStudent) return;
    await updateDoc(doc(db, 'students', editingStudent.id), {
      status: 'approved',
      permissions: editingStudent.permissions || {}
    });
    setEditingStudent(null);
  };

  const toggleGrade = (grade: number) => {
    if (!editingStudent) return;
    const current = editingStudent.permissions?.grades || [];
    const newGrades = current.includes(grade) ? current.filter(g => g !== grade) : [...current, grade];
    setEditingStudent({ ...editingStudent, permissions: { ...editingStudent.permissions, grades: newGrades } });
  };

  const toggleUnit = (unitId: string) => {
    if (!editingStudent) return;
    const current = editingStudent.permissions?.units || [];
    const newUnits = current.includes(unitId) ? current.filter(u => u !== unitId) : [...current, unitId];
    setEditingStudent({ ...editingStudent, permissions: { ...editingStudent.permissions, units: newUnits } });
  };

  const toggleLesson = (lessonId: string) => {
    if (!editingStudent) return;
    const current = editingStudent.permissions?.lessons || [];
    const newLessons = current.includes(lessonId) ? current.filter(l => l !== lessonId) : [...current, lessonId];
    setEditingStudent({ ...editingStudent, permissions: { ...editingStudent.permissions, lessons: newLessons } });
  };

  const pending = students.filter(s => s.status === 'pending');
  const approved = students.filter(s => s.status === 'approved');

  return (
    <div className="tab-panel active">
      <div className="panel-header">
        <h3><i className="fa-solid fa-users"></i> إدارة الطلاب والصلاحيات</h3>
      </div>
      
      <div style={{ padding: '15px', background: globalFreeAccess ? '#ecfdf5' : '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${globalFreeAccess ? '#10b981' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, color: globalFreeAccess ? '#059669' : '#334155' }}>
            <i className={`fa-solid ${globalFreeAccess ? 'fa-lock-open' : 'fa-lock'}`} style={{ marginRight: '8px' }}></i>
            الإتاحة العامة للجميع
          </h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            {globalFreeAccess ? 'المنصة الآن مفتوحة للجميع بدون الحاجة لموافقتك.' : 'المنصة مغلقة، يجب الموافقة على كل طالب ليدخل.'}
          </p>
        </div>
        <button 
          onClick={toggleGlobalAccess}
          style={{ 
            background: globalFreeAccess ? '#10b981' : '#cbd5e1', 
            color: globalFreeAccess ? 'white' : '#475569', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {globalFreeAccess ? 'مفعل (مجاني للجميع)' : 'معطل (مغلق)'}
        </button>
      </div>

      {editingStudent ? (
        <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '2px solid var(--primary-color)' }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>تعديل صلاحيات: {editingStudent.name}</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
            {[4, 5, 6].map(grade => {
              const units = curriculum[grade] || [];
              if (units.length === 0) return null;
              
              const isGradeChecked = editingStudent.permissions?.grades?.includes(grade);
              
              return (
                <div key={grade} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', background: 'white' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px', color: 'var(--primary-color)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isGradeChecked} onChange={() => toggleGrade(grade)} />
                    الصف {grade} (السماح بجميع الوحدات)
                  </label>
                  
                  {!isGradeChecked && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '20px', marginTop: '10px', borderRight: '2px solid #e2e8f0' }}>
                      {units.map(unit => {
                        const isUnitChecked = editingStudent.permissions?.units?.includes(unit.id);
                        return (
                          <div key={unit.id} style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                              <input type="checkbox" checked={isUnitChecked} onChange={() => toggleUnit(unit.id)} />
                              {unit.title} (جميع الدروس)
                            </label>
                            
                            {!isUnitChecked && unit.lessons.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '20px', marginTop: '5px', borderRight: '2px dashed #e2e8f0' }}>
                                {unit.lessons.map(lesson => (
                                  <label key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                    <input type="checkbox" checked={editingStudent.permissions?.lessons?.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} />
                                    {lesson.title} {lesson.isFree ? '(مجاني)' : ''}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn-secondary" onClick={() => setEditingStudent(null)}>إلغاء</button>
            <button className="btn-primary" onClick={savePermissions}>حفظ الصلاحيات والموافقة</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#f59e0b', marginBottom: '10px' }}>طلبات جديدة ({pending.length})</h4>
            {pending.length === 0 ? <p style={{ fontSize: '12px', color: '#666' }}>لا توجد طلبات معلقة.</p> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pending.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{s.phone || 'بدون رقم'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setEditingStudent(s)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>مراجعة وموافقة</button>
                    <button onClick={() => updateStatus(s.id, 'blocked')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>رفض</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>الطلاب المعتمدون ({approved.length})</h4>
            {approved.length === 0 ? <p style={{ fontSize: '12px', color: '#666' }}>لا يوجد طلاب معتمدون.</p> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {approved.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{s.phone || 'بدون رقم'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setEditingStudent(s)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>تعديل الصلاحيات</button>
                    <button onClick={() => updateStatus(s.id, 'blocked')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>حظر</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminsManager() {
  const { currentAdmin } = useAdminStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ phone: '', name: '', password: '', permissions: { manageCurriculum: false, manageStudents: false, manageAdmins: false } });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      const data: AdminUser[] = [];
      snap.forEach(d => {
        const adminData = d.data() as AdminUser;
        // Don't show password in state normally, but we need it for adding, so we just store the user object
        data.push({ ...adminData, id: d.id });
      });
      setAdmins(data);
    });
    return () => unsub();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.phone || !newAdmin.name || !newAdmin.password) {
      alert("الرجاء إدخال جميع البيانات");
      return;
    }
    try {
      const adminData = {
        phone: newAdmin.phone,
        name: newAdmin.name,
        password: newAdmin.password,
        role: 'moderator',
        permissions: newAdmin.permissions
      };
      await setDoc(doc(db, 'admins', newAdmin.phone), adminData);
      setIsAdding(false);
      setNewAdmin({ phone: '', name: '', password: '', permissions: { manageCurriculum: false, manageStudents: false, manageAdmins: false } });
    } catch (e) {
      alert("حدث خطأ أثناء إضافة المدير");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (id === currentAdmin?.id) {
      alert("لا يمكنك حذف حسابك الحالي");
      return;
    }
    if (confirm("هل أنت متأكد من حذف هذا المدير؟")) {
      await deleteDoc(doc(db, 'admins', id));
    }
  };

  return (
    <div className="tab-panel active">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3><i className="fa-solid fa-user-shield"></i> إدارة المديرين 👑</h3>
        {!isAdding && currentAdmin?.permissions?.manageAdmins && (
          <button className="btn-primary" onClick={() => setIsAdding(true)}>إضافة مدير</button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddAdmin} style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '2px solid var(--primary-color)', marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>إضافة مدير جديد</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="الاسم" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="tel" placeholder="رقم الهاتف (سيستخدم لتسجيل الدخول)" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', direction: 'ltr' }} />
            <input type="text" placeholder="كلمة المرور" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', direction: 'ltr' }} />
            
            <div style={{ marginTop: '10px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>صلاحيات المدير:</strong>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <input type="checkbox" checked={newAdmin.permissions.manageCurriculum} onChange={e => setNewAdmin({...newAdmin, permissions: {...newAdmin.permissions, manageCurriculum: e.target.checked}})} />
                إدارة المنهج والدروس والتفاعلات
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <input type="checkbox" checked={newAdmin.permissions.manageStudents} onChange={e => setNewAdmin({...newAdmin, permissions: {...newAdmin.permissions, manageStudents: e.target.checked}})} />
                إدارة الطلاب (قبول ورفض)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <input type="checkbox" checked={newAdmin.permissions.manageAdmins} onChange={e => setNewAdmin({...newAdmin, permissions: {...newAdmin.permissions, manageAdmins: e.target.checked}})} />
                إضافة وإدارة مديرين آخرين
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>إلغاء</button>
              <button type="submit" className="btn-primary">حفظ</button>
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {admins.map(admin => (
          <div key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: admin.role === 'owner' ? '#fdf2f8' : '#f8fafc', borderRadius: '8px', border: `1px solid ${admin.role === 'owner' ? '#fbcfe8' : '#e2e8f0'}` }}>
            <div>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {admin.name} {admin.role === 'owner' && <span style={{ fontSize: '12px', background: '#ec4899', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>المالك</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', direction: 'ltr', textAlign: 'right' }}>{admin.phone}</div>
              {admin.role !== 'owner' && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {admin.permissions.manageCurriculum && <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>المنهج</span>}
                  {admin.permissions.manageStudents && <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>الطلاب</span>}
                  {admin.permissions.manageAdmins && <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>المديرين</span>}
                </div>
              )}
            </div>
            
            {(admin.role !== 'owner' || admin.id === '01000000000') && currentAdmin?.permissions?.manageAdmins && (
              <button onClick={() => handleDeleteAdmin(admin.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScienceSidebar() {
  const [activeTab, setActiveTab] = useState("curriculum-tab");
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingGrade, setEditingGrade] = useState<number>(4);
  const [editingPageQuestionsId, setEditingPageQuestionsId] = useState<string | null>(null);
  const [showSmartImporter, setShowSmartImporter] = useState(false);
  const { currentAdmin, logout } = useAdminStore();
  
  useEffect(() => {
    if (currentAdmin) {
      if (currentAdmin.permissions.manageCurriculum) {
        setActiveTab("curriculum-tab");
      } else if (currentAdmin.permissions.manageStudents) {
        setActiveTab("students-tab");
      } else if (currentAdmin.permissions.manageAdmins) {
        setActiveTab("admins-tab");
      }
    }
  }, [currentAdmin]);

  const { 
    pages, activePageId, zones, selectedZoneId, activeLessonId, curriculum,
    addPage, setActivePage, removePage, addZone, updateZone,
    addUnit, updateUnit, removeUnit,
    addLesson, updateLesson, removeLesson,
    setActiveLesson
  } = useBookStore();

  const currentLessonPages = pages.filter(p => p.lessonId === activeLessonId);
  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const handleAddZone = (type: any, defaultName: string) => {
    if (!activePageId) return alert("الرجاء إضافة صفحة أولاً");
    
    // Calculate a visible X and Y position based on current scroll
    let startX = 100;
    let startY = 100;
    const boxWidth = 150;
    const boxHeight = 100;
    
    try {
      const viewport = document.querySelector('.canvas-viewport');
      const pageSheet = document.querySelector('.page-sheet') as HTMLElement;
      
      if (viewport) {
        const zoomText = document.querySelector('.zoom-text')?.textContent || '100';
        const zoom = (parseInt(zoomText) || 100) / 100;
        
        // Calculate the center of the visible area vertically
        startY = (viewport.scrollTop + (viewport.clientHeight / 2)) / zoom - (boxHeight / 2);
        
        if (pageSheet) {
          // Exact horizontal center of the page
          startX = (pageSheet.offsetWidth / 2) - (boxWidth / 2);
        } else {
          startX = (viewport.scrollLeft + (viewport.clientWidth / 2)) / zoom - (boxWidth / 2);
        }
        
        // Ensure it doesn't go off-screen entirely on the left/top edges
        startX = Math.max(10, startX);
        startY = Math.max(10, startY);
      }
    } catch (e) {
      console.error(e);
    }

    addZone({
      pageId: activePageId,
      x: startX,
      y: startY,
      width: boxWidth,
      height: boxHeight,
      color: "#FF4FA3",
      name: defaultName,
      interactionType: type,
      interactionTypes: [type],
      showIcon: false,
      content: {}
    });
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const uploadFile = async (file: File): Promise<string> => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    // 1. Try Cloudinary first (supports BOTH images AND videos, unlimited)
    try {
      setUploadMessage(isVideo ? "جاري رفع الفيديو... قد يستغرق دقيقة" : "جاري رفع الصورة...");
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'bqwntt08');
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/hruezreb/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data && data.secure_url) {
        setUploadMessage("");
        console.log('[Upload] Cloudinary success:', data.secure_url);
        return data.secure_url;
      }
      console.warn('[Upload] Cloudinary failed:', JSON.stringify(data));
      if (isVideo && data?.error?.message) {
        alert("خطأ في رفع الفيديو: " + data.error.message);
      }
    } catch (e) {
      console.warn("[Upload] Cloudinary failed, trying fallback", e);
    }

    // 2. For images only: try ImgBB as fallback
    if (isImage) {
      try {
        setUploadMessage("جاري رفع الصورة (بديل)...");
        const formData = new FormData();
        formData.append('key', 'b869219ac2eb0d475c25f6dc00016b17');
        formData.append('image', file);
        
        const res = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (data && data.success && data.data && data.data.url) {
          setUploadMessage("");
          console.log('[Upload] ImgBB success:', data.data.url);
          return data.data.url;
        }
      } catch (e) {
        console.warn("[Upload] ImgBB failed, falling back to local", e);
      }
    }

    // 3. Last resort: Local compression (images only)
    if (isImage) {
      return new Promise((resolve, reject) => {
        setUploadMessage("جاري الضغط المحلي...");
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 1000;
            if (width > MAX_SIZE || height > MAX_SIZE) {
              const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("فشل معالجة الصورة"));
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            setUploadMessage("");
            resolve(canvas.toDataURL("image/jpeg", 0.4));
          };
          img.onerror = () => reject(new Error("فشل قراءة الصورة"));
          img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error("فشل الرفع"));
        reader.readAsDataURL(file);
      });
    }

    // If video upload failed completely
    setUploadMessage("");
    throw new Error("فشل رفع الفيديو. تأكدي من اتصال الإنترنت وحاولي مرة أخرى.");
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        try {
          const url = await uploadFile(file);
          addPage(url);
        } catch (e) {
          alert('فشل رفع الصورة');
        }
      }
      setIsUploading(false);
    }
  });

  const handleAddPage = () => {
    if (!activeLessonId) {
      alert("الرجاء اختيار درس أولاً");
      return;
    }
    
    // Capture the intended lesson ID right now, before the user can switch lessons during upload
    const intendedLessonId = activeLessonId;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      if (e.target.files && e.target.files[0]) {
        setIsUploading(true);
        try {
          const url = await uploadFile(e.target.files[0]);
          addPage(url, intendedLessonId);
        } catch (err) {
          alert("فشل رفع الصورة");
        }
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <aside className="left-sidebar">
      <nav className="sidebar-tabs">
        {currentAdmin?.permissions?.manageCurriculum && (
          <>
            <button className={`tab-btn ${activeTab === 'curriculum-tab' ? 'active' : ''}`} onClick={() => setActiveTab('curriculum-tab')} title="إدارة المنهج">
              <i className="fa-solid fa-sitemap"></i>
              <span>المنهج</span>
            </button>
            <button className={`tab-btn ${activeTab === 'pages-tab' ? 'active' : ''}`} onClick={() => setActiveTab('pages-tab')} title="إدارة الصفحات">
              <i className="fa-solid fa-layer-group"></i>
              <span>الصفحات</span>
            </button>
            <button className={`tab-btn ${activeTab === 'add-hotspot-tab' ? 'active' : ''}`} onClick={() => setActiveTab('add-hotspot-tab')} title="إضافة تفاعل">
              <i className="fa-solid fa-plus-circle"></i>
              <span>تفاعل</span>
            </button>
            <button className={`tab-btn ${activeTab === 'properties-tab' ? 'active' : ''}`} onClick={() => setActiveTab('properties-tab')} title="الخصائص">
              <i className="fa-solid fa-sliders"></i>
              <span>الخصائص</span>
            </button>
          </>
        )}
        
        {currentAdmin?.permissions?.manageStudents && (
          <button className={`tab-btn ${activeTab === 'students-tab' ? 'active' : ''}`} onClick={() => setActiveTab('students-tab')} title="إدارة الطلاب">
            <i className="fa-solid fa-users"></i>
            <span>الطلاب</span>
          </button>
        )}

        {currentAdmin?.permissions?.manageAdmins && (
          <button className={`tab-btn ${activeTab === 'admins-tab' ? 'active' : ''}`} onClick={() => setActiveTab('admins-tab')} title="إدارة المديرين">
            <i className="fa-solid fa-user-shield"></i>
            <span>المديرين</span>
          </button>
        )}
        
        <button className="tab-btn" onClick={() => logout()} title="تسجيل الخروج" style={{ marginTop: 'auto', color: '#ef4444' }}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>خروج</span>
        </button>
      </nav>

      <div className="sidebar-content-area">
        {activeTab === 'curriculum-tab' && (
          <div className="tab-panel active">
            <div className="panel-header">
              <h3><i className="fa-solid fa-sitemap"></i> بناء المنهج</h3>
            </div>
            
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px', color: '#1976d2' }}><i className="fa-solid fa-image"></i> صورة واجهة المنصة</h4>
              <label style={{ display: 'inline-block', background: '#1976d2', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: isUploading ? 0.5 : 1 }}>
                {isUploading ? 'جاري الرفع...' : 'تغيير صورة الغلاف للطلاب'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  disabled={isUploading}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setIsUploading(true);
                      try {
                        const url = await uploadFile(e.target.files[0]);
                        localStorage.setItem('heroImage', url);
                        alert('تم تغيير الصورة بنجاح! ستظهر للطلاب الآن.');
                      } catch (err) { alert('فشل الرفع'); }
                      setIsUploading(false);
                    }
                  }} 
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
              {[4, 5, 6].map(g => (
                <button 
                  key={g} 
                  onClick={() => setEditingGrade(g)}
                  style={{ flex: 1, padding: '8px', background: editingGrade === g ? '#FF4FA3' : '#eee', color: editingGrade === g ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  الصف {g}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(curriculum[editingGrade] || []).map(unit => (
                <div key={unit.id} style={{ background: '#FFF0F5', border: '1px solid #FFD6E8', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      value={unit.title} 
                      onChange={(e) => updateUnit(editingGrade, unit.id, e.target.value)}
                      style={{ flex: 1, padding: '5px', border: '1px solid #ddd', borderRadius: '4px', fontWeight: 'bold' }}
                    />
                    <button onClick={() => removeUnit(editingGrade, unit.id)} style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                  </div>

                  <div style={{ paddingRight: '15px', borderRight: '2px solid #FF4FA3', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {unit.lessons.map(lesson => (
                      <div key={lesson.id} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <button 
                          onClick={() => updateLesson(editingGrade, unit.id, lesson.id, { isFree: !lesson.isFree })}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '16px',
                            color: lesson.isFree ? '#4ade80' : '#f43f5e',
                            padding: '0 5px'
                          }}
                          title={lesson.isFree ? 'الدرس مجاني للجميع (اضغط للإغلاق)' : 'الدرس يحتاج موافقة (اضغط للفتح)'}
                        >
                          {lesson.isFree ? '🔓' : '🔒'}
                        </button>
                        <input 
                          type="text" 
                          value={lesson.title} 
                          onChange={(e) => updateLesson(editingGrade, unit.id, lesson.id, { title: e.target.value })}
                          style={{ flex: 1, padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        />
                        <button 
                          onClick={() => {
                            setActiveLesson(lesson.id);
                            setActiveTab('pages-tab');
                          }}
                          style={{ background: activeLessonId === lesson.id ? '#4caf50' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                          title="تعديل محتوى الدرس"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> المحتوى
                        </button>
                        <button onClick={() => removeLesson(editingGrade, unit.id, lesson.id)} style={{ background: 'transparent', color: '#ff4d4f', border: 'none', cursor: 'pointer' }}><i className="fa-solid fa-times"></i></button>
                      </div>
                    ))}
                    <button onClick={() => addLesson(editingGrade, unit.id, 'درس جديد')} style={{ background: 'transparent', color: '#FF4FA3', border: '1px dashed #FF4FA3', borderRadius: '4px', padding: '4px', marginTop: '5px', cursor: 'pointer', fontSize: '12px' }}>
                      + إضافة درس
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => addUnit(editingGrade, 'وحدة جديدة')} className="w-full-btn primary-outline-btn">
                <i className="fa-solid fa-plus"></i> إضافة وحدة جديدة
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pages-tab' && (
          <div className="tab-panel active">
            <div style={{ padding: '10px', background: 'red', color: 'white', marginBottom: '10px' }}>
              DEBUG activeLessonId: {activeLessonId || 'NULL'}
            </div>
            <div className="panel-header">
              <h3><i className="fa-solid fa-layer-group"></i> صفحات الدرس ({currentLessonPages.length})</h3>
            </div>
            
            {!activeLessonId ? (
              <div style={{ padding: '20px', textAlign: 'center', background: '#fff3cd', color: '#856404', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                <p>الرجاء اختيار درس من تبويب "المنهج" للبدء في تعديل محتواه.</p>
              </div>
            ) : (
              <>
                <div className="pages-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentLessonPages.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`page-thumbnail-item ${activePageId === p.id ? 'active' : ''}`}
                      onClick={() => setActivePage(p.id)}
                      style={{ backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', height: '120px', borderRadius: '8px', position: 'relative', border: activePageId === p.id ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
                    >
                      <span style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{idx + 1}</span>
                      <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: '5px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingPageQuestionsId(p.id); }} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }} title="إعداد أسئلة الصفحة">
                          <i className="fa-solid fa-clipboard-question"></i> أسئلة
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removePage(p.id); }} style={{ background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                  <div className="panel-actions-footer">
                    <div {...getRootProps()} className="w-full-btn primary-outline-btn" style={{ textAlign: 'center', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}>
                      <input {...getInputProps()} disabled={isUploading} />
                      <i className="fa-solid fa-file-circle-plus"></i> {isUploading ? (uploadMessage || 'جاري الرفع...') : 'إضافة صفحة للكتاب من ملف'}
                    </div>
                    {uploadMessage && <div style={{color: 'red', marginTop: '10px', fontSize: '12px', textAlign: 'center'}}>{uploadMessage}</div>}
                  </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'add-hotspot-tab' && (
          <div className="tab-panel active">
            <div className="panel-header">
              <h3><i className="fa-solid fa-bullseye"></i> اختر نوع المنطقة التفاعلية</h3>
            </div>
            <div className="hotspot-types-grid">
              <button className="hotspot-type-card" onClick={() => handleAddZone('audio', 'صوت')}>
                <div className="type-icon audio-bg"><i className="fa-solid fa-volume-high"></i></div>
                <div className="type-info"><h4>صوت</h4><p>شرح بالصوت</p></div>
              </button>
              <button className="hotspot-type-card" onClick={() => handleAddZone('video', 'فيديو')}>
                <div className="type-icon video-bg"><i className="fa-solid fa-video"></i></div>
                <div className="type-info"><h4>فيديو</h4><p>مقطع فيديو</p></div>
              </button>
              <button className="hotspot-type-card" onClick={() => handleAddZone('question', 'سؤال')}>
                <div className="type-icon quiz-bg"><i className="fa-solid fa-circle-question"></i></div>
                <div className="type-info"><h4>سؤال تفاعلي</h4><p>اختبار سريع</p></div>
              </button>
              <button className="hotspot-type-card" onClick={() => handleAddZone('link', 'رابط')}>
                <div className="type-icon link-bg"><i className="fa-solid fa-link"></i></div>
                <div className="type-info"><h4>رابط</h4><p>موقع خارجي</p></div>
              </button>
              <button className="hotspot-type-card" style={{ gridColumn: "1 / -1", background: "var(--color-light-pink)" }} onClick={() => useBookStore.getState().setDrawingMode(true)}>
                <div className="type-icon" style={{ background: "var(--color-pink)" }}><i className="fa-solid fa-pen-clip"></i></div>
                <div className="type-info"><h4>رسم يدوي (بالقلم)</h4><p>لرسم الأشكال المتعرجة كالأعضاء بالماوس</p></div>
              </button>
              <button 
                className="hotspot-type-card" 
                style={{ 
                  gridColumn: "1 / -1", 
                  background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
                  border: "1.5px solid #f472b6"
                }} 
                onClick={() => setShowSmartImporter(true)}
              >
                <div className="type-icon" style={{ background: "linear-gradient(135deg, #ec4899, #db2777)", color: "white" }}>
                  <FaMagic />
                </div>
                <div className="type-info">
                  <h4 style={{ color: "#be185d" }}>منظم الأسئلة التلقائي 🪄</h4>
                  <p>لصق وتوزيع الأسئلة تلقائياً على كل المربعات</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'properties-tab' && (
          <div className="tab-panel active">
            <div className="panel-header">
              <h3><i className="fa-solid fa-sliders"></i> خصائص المنطقة</h3>
            </div>
            {selectedZone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>اسم المنطقة</label>
                  <input 
                    type="text" 
                    value={selectedZone.name} 
                    onChange={e => updateZone(selectedZone.id, { name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>لون التمييز</label>
                  <input 
                    type="color" 
                    value={selectedZone.color} 
                    onChange={e => updateZone(selectedZone.id, { color: e.target.value })}
                    style={{ width: '100%', height: '40px', padding: '2px', cursor: 'pointer' }}
                  />
                </div>
                {selectedZone.interactionType === 'audio' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط الصوت</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={selectedZone.content.audioUrl || ''} 
                      onChange={e => updateZone(selectedZone.id, { content: { ...selectedZone.content, audioUrl: e.target.value } })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      <i className="fa-solid fa-file-audio"></i> أجيب من الجهاز
                      <input 
                        type="file" 
                        accept="audio/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIsUploading(true);
                            try {
                              const url = await uploadFile(e.target.files[0]);
                              updateZone(selectedZone.id, { content: { ...selectedZone.content, audioUrl: url } });
                            } catch (err) {
                              alert('فشل رفع الصوت');
                            }
                            setIsUploading(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
                {selectedZone.interactionType === 'video' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رابط الفيديو (YouTube أو مباشر)</label>
                    <input 
                      type="url" 
                      placeholder="https://youtube.com/..."
                      value={selectedZone.content.videoUrl || ''} 
                      onChange={e => updateZone(selectedZone.id, { content: { ...selectedZone.content, videoUrl: e.target.value } })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px', background: 'var(--primary-color)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      <i className="fa-solid fa-file-video"></i> أجيب من الجهاز
                      <input 
                        type="file" 
                        accept="video/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIsUploading(true);
                            try {
                              const url = await uploadFile(e.target.files[0]);
                              updateZone(selectedZone.id, { content: { ...selectedZone.content, videoUrl: url } });
                            } catch (err) {
                              alert('فشل رفع الفيديو');
                            }
                            setIsUploading(false);
                          }
                        }} 
                      />
                    </label>
                  </div>
                )}
                {selectedZone.interactionType === 'question' && (
                  <div style={{ background: 'var(--primary-light)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--primary-color)' }}><i className="fa-solid fa-clipboard-question"></i> إعدادات الأسئلة (اختبار)</h4>
                    
                    {/* List of existing questions */}
                    {(() => {
                      // Migrate legacy single question to the array for display
                      let allQs: any[] = selectedZone.content.questions || [];
                      if (selectedZone.content.question && allQs.length === 0) {
                        allQs = [selectedZone.content.question];
                      }
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {allQs.map((q, idx) => (
                            <div key={q.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>سؤال {idx + 1}: {q.title ? (q.title.length > 20 ? q.title.substring(0, 20) + '...' : q.title) : 'بدون عنوان'}</span>
                              <button 
                                onClick={() => setEditingQuestionIndex(idx)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                              >
                                <FaEdit size={16} />
                              </button>
                            </div>
                          ))}
                          
                          {allQs.length === 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>لم يتم إضافة أي أسئلة بعد.</p>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setEditingQuestionIndex(-1)}
                        style={{ 
                          background: 'var(--primary-color)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '10px 15px', 
                          borderRadius: '20px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          flex: 1,
                          minWidth: '140px'
                        }}
                      >
                        <i className="fa-solid fa-plus"></i> 
                        سؤال جديد
                      </button>
                      <button 
                        onClick={() => setShowSmartImporter(true)}
                        style={{ 
                          background: 'var(--color-pink)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '10px 15px', 
                          borderRadius: '20px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          flex: 1,
                          minWidth: '140px'
                        }}
                      >
                        <FaMagic /> استيراد ذكي
                      </button>
                    </div>
                    
                    {editingQuestionIndex !== null && (
                      <QuestionBuilderModal 
                        initialQuestion={
                          editingQuestionIndex === -1 
                            ? {} 
                            : ((selectedZone.content.questions || (selectedZone.content.question ? [selectedZone.content.question] : []))[editingQuestionIndex] || {})
                        } 
                        onSave={(updatedQ) => {
                          let allQs = [...(selectedZone.content.questions || [])];
                          // Migrate legacy if editing
                          if (allQs.length === 0 && selectedZone.content.question) {
                            allQs = [selectedZone.content.question];
                          }
                          
                          if (editingQuestionIndex === -1) {
                            // Add new
                            allQs.push(updatedQ as any);
                          } else {
                            // Update existing
                            allQs[editingQuestionIndex] = updatedQ as any;
                          }
                          
                          const newInteractions = new Set(selectedZone.interactionTypes || []);
                          newInteractions.add('question');

                          updateZone(selectedZone.id, { 
                            interactionTypes: Array.from(newInteractions),
                            content: { 
                              ...selectedZone.content, 
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
                )}
              </div>
            ) : (
              <p className="panel-hint" style={{ marginTop: '15px' }}>اضغط على أي منطقة في مساحة العمل لتعديل خصائصها.</p>
            )}
          </div>
        )}

        {currentAdmin?.permissions?.manageStudents && activeTab === 'students-tab' && <StudentsManager />}
        
        {currentAdmin?.permissions?.manageAdmins && activeTab === 'admins-tab' && <AdminsManager />}

        {activeTab === 'quiz-tab' && (
          <div className="tab-panel active">
            <div className="panel-header">
              <h3><i className="fa-solid fa-circle-question"></i> إدارة أسئلة الصفحة</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(142, 68, 173, 0.08) 0%, rgba(255, 79, 163, 0.12) 100%)', padding: '16px', borderRadius: '12px', border: '1.5px solid #fbcfe8' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#db2777', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaMagic /> منظم الأسئلة التلقائي
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                  الصقي نص الأسئلة الكامل للدرس دفعة واحدة، وسيقوم النظام بتوزيعها على المربعات وحفظ اختبار الصفحة تلقائياً!
                </p>
                <button 
                  className="btn-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ff4fa3 0%, #db2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.95rem' }}
                  onClick={() => setShowSmartImporter(true)}
                >
                  <FaMagic /> لصق وتوزيع الأسئلة الآن
                </button>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-clipboard-check"></i> اختبار الصفحة كاملة
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b' }}>
                  الأسئلة الشاملة التي تظهر في زر (اختبر نفسك) أسفل الصفحة.
                </p>
                <button 
                  className="btn-secondary"
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => setEditingPageQuestionsId(activePageId || pages[0]?.id)}
                >
                  <FaEdit /> تعديل أسئلة اختبار الصفحة
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media-tab' && (
          <div className="tab-panel active">
            <div className="panel-header">
              <h3><i className="fa-solid fa-hammer"></i> مكتبة الوسائط</h3>
            </div>
            <p className="panel-hint" style={{ marginTop: '15px' }}>يمكنك رفع الصور ومقاطع الصوت مباشرة من تبويب العناصر.</p>
          </div>
        )}
      </div>

      {editingPageQuestionsId && (
        <PageQuestionsModal
          pageId={editingPageQuestionsId}
          onClose={() => setEditingPageQuestionsId(null)}
        />
      )}

      {showSmartImporter && activePageId && (
        <SmartImporterModal
          pageId={activePageId}
          onClose={() => setShowSmartImporter(false)}
        />
      )}
    </aside>
  );
}

