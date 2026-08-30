"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StudentViewer from "../components/StudentViewer";
import styles from "./page.module.css";

import StudentAccessGate from "../components/StudentAccessGate";
import { useBookStore } from "../store/bookStore";

export default function StudentMode() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState("light");
  const [accessGranted, setAccessGranted] = useState(false);
  const { curriculum, activeLessonId } = useBookStore();

  useEffect(() => {
    setIsClient(true);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (activeLessonId) {
      let foundAndVisible = false;
      for (const [g, units] of Object.entries(curriculum)) {
        for (const u of (units as any[])) {
          const lesson = u.lessons.find((l: any) => l.id === activeLessonId);
          if (lesson && lesson.isPublished !== false) {
             foundAndVisible = true;
          }
        }
      }
      if (!foundAndVisible) {
         useBookStore.getState().setActiveLesson(null);
      }
    }
  }, [activeLessonId, curriculum]);

  if (!isClient) return null;

  // Find grade and unit for active lesson
  let lessonGrade = 0;
  let lessonUnit = '';
  
  if (activeLessonId) {
    for (const [g, units] of Object.entries(curriculum)) {
      for (const u of (units as any[])) {
        if (u.lessons.some((l: any) => l.id === activeLessonId)) {
          lessonGrade = Number(g);
          lessonUnit = u.id;
          break;
        }
      }
    }
  }

  return (
    <div className="app-wrapper preview-mode">
      {/* Student Mode Top Bar */}
      <header className="top-navbar" style={{ background: "var(--bg-header)" }}>
        <div className="brand-section">
          <div className="logo-badge" title="Interactive Book Builder">
            <i className="fa-solid fa-graduation-cap logo-icon"></i>
          </div>
          <div className="book-title-container" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>وضع المعاينة كطالب</span>
            <select 
              value={activeLessonId || ''} 
              onChange={(e) => useBookStore.getState().setActiveLesson(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
            >
              <option value="" disabled>اختر الدرس...</option>
              {Object.entries(curriculum).map(([grade, units]) => {
                const visibleUnits = units.map((u: any) => ({
                  ...u,
                  lessons: u.lessons.filter((l: any) => l.isPublished !== false)
                })).filter((u: any) => u.lessons.length > 0);
                
                if (visibleUnits.length === 0) return null;
                
                return (
                  <optgroup key={grade} label={`الصف ${grade}`}>
                    {visibleUnits.map((u: any) => (
                      u.lessons.map((l: any) => (
                        <option key={l.id} value={l.id}>{u.title} - {l.title}</option>
                      ))
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className="header-actions">
          <Link href="/games" style={{ textDecoration: "none" }}>
            <button className="nav-btn" style={{ color: '#ec4899', fontWeight: 'bold' }}>
              <i className="fa-solid fa-gamepad"></i> <span className="btn-text">الألعاب التفاعلية</span>
            </button>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button className="nav-btn">
              <i className="fa-solid fa-home"></i> <span className="btn-text">الرئيسية</span>
            </button>
          </Link>
          <Link href="/rehab-elsibai" style={{ textDecoration: "none" }}>
            <button className="nav-btn primary-btn">
              <i className="fa-solid fa-pen-ruler"></i> <span className="btn-text">العودة كمعلم</span>
            </button>
          </Link>

          <div className="divider-v"></div>

          <button className="theme-toggle-btn" onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")} title="تبديل الوضع الليلي / النهاري">
            {theme === 'dark' ? <i className="fa-solid fa-sun icon-light"></i> : <i className="fa-solid fa-moon icon-dark"></i>}
          </button>
        </div>
      </header>

      {/* Student Viewer Content */}
      <div style={{ flex: 1, backgroundColor: "var(--canvas-bg)", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
        {activeLessonId && !accessGranted && (
          <StudentAccessGate
            lessonId={activeLessonId}
            grade={lessonGrade}
            unitId={lessonUnit}
            onAccessGranted={() => setAccessGranted(true)}
            onCancel={() => window.location.href = '/'}
          />
        )}
        {(accessGranted || !activeLessonId) && <StudentViewer styles={styles} />}
      </div>
    </div>
  );
}
