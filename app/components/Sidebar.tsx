"use client";

import { useDropzone } from "react-dropzone";
import { useCallback } from "react";
import { useBookStore } from "../store/bookStore";
import { FaPlus, FaImage, FaTrash, FaVolumeUp, FaVideo, FaQuestionCircle, FaLink } from "react-icons/fa";

export default function Sidebar({ styles }: { styles: any }) {
  const { pages, activePageId, addPage, setActivePage, removePage, addZone } = useBookStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          addPage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [addPage]);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] } 
  });

  const handleAddZone = (type: any, defaultName: string) => {
    if (!activePageId) return alert("الرجاء إضافة صفحة أولاً");
    addZone({
      pageId: activePageId,
      x: 50,
      y: 50,
      width: 150,
      height: 100,
      color: "#FF4FA3",
      name: defaultName,
      interactionType: type,
      showIcon: true,
      content: {}
    });
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>أدوات المعلم</h2>
      </div>

      <div className={styles.toolSection}>
        <h3>إدارة الصفحات</h3>
        <div {...getRootProps()} className={styles.toolButton} style={{ justifyContent: "center", borderStyle: "dashed", borderColor: "var(--color-pink)" }}>
          <input {...getInputProps()} />
          <FaPlus className={styles.toolIcon} /> رفع صفحة (صورة)
        </div>
      </div>

      <div className={styles.toolSection}>
        <h3>المناطق التفاعلية</h3>
        <button className={styles.toolButton} onClick={() => handleAddZone('audio', 'منطقة صوت')}>
          <FaVolumeUp className={styles.toolIcon} /> إضافة صوت
        </button>
        <button className={styles.toolButton} onClick={() => handleAddZone('video', 'منطقة فيديو')}>
          <FaVideo className={styles.toolIcon} /> إضافة فيديو
        </button>
        <button className={styles.toolButton} onClick={() => handleAddZone('question', 'سؤال تفاعلي')}>
          <FaQuestionCircle className={styles.toolIcon} /> إضافة سؤال
        </button>
        <button className={styles.toolButton} onClick={() => handleAddZone('link', 'رابط خارجي')}>
          <FaLink className={styles.toolIcon} /> إضافة رابط
        </button>
      </div>

      <div className={styles.toolSection} style={{ flex: 1, overflowY: "auto" }}>
        <h3>الصفحات ({pages.length})</h3>
        <div className={styles.pagesList}>
          {pages.map((page, index) => (
            <div 
              key={page.id} 
              className={`${styles.pageThumb} ${activePageId === page.id ? styles.active : ''}`}
              style={{ backgroundImage: `url(${page.imageUrl})` }}
              onClick={() => setActivePage(page.id)}
            >
              <div className={styles.pageNumber} style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(0,0,0,0.5)", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: "0.8rem" }}>
                {index + 1}
              </div>
              <button 
                className={styles.deletePageBtn} 
                onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
