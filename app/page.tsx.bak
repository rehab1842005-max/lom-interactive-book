"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaPlay, FaVolumeUp, FaQuestionCircle, FaStar, FaBook, FaUpload, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdOutlineNotes } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useBookStore } from "./store/bookStore";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { curriculum, setActiveLesson } = useBookStore();
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('homeCustomImage');
    if (saved) setCustomImage(saved);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCustomImage(result);
        localStorage.setItem('homeCustomImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLessonSelect = () => {
    router.push('/student');
  };

  return (
    <main className={styles.container}>
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <FaBook size={28} color="#FF4FA3" />
          </div>
          <div className={styles.logoText}>
            <h1>Rehab Elsibai</h1>
            <p>رحاب السباعي</p>
          </div>
        </div>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>👧🏽</div>
          <span>مرحباً بك</span>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={styles.heroTitle}
          >
            أهلاً بك
            <br />
            <span>في عالم الكتب التفاعلية</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={styles.heroSubtitle}
          >
            تعلم بطريقة ممتعة وتفاعلية من خلال الكتب التي تجمع بين الصوت، الفيديو، والأسئلة الذكية
          </motion.p>
          
          <div className={styles.gradesContainer}>
            <div className={styles.gradesBadge}><FaStar color="#FFD700" /> اختر الصف للبدء <FaStar color="#FFD700" /></div>
            <div className={styles.gradesRow}>
              <div className={`${styles.gradeCard} ${selectedGrade === 4 ? styles.gradeCardActive : ''}`} onClick={() => setSelectedGrade(4)}>
                <div className={styles.gradeAvatar}>👦🏻</div>
                <span>الرابع الابتدائي</span>
              </div>
              <div className={`${styles.gradeCard} ${selectedGrade === 5 ? styles.gradeCardActive : ''}`} onClick={() => setSelectedGrade(5)}>
                <div className={styles.gradeAvatar}>👧🏻</div>
                <span>الخامس الابتدائي</span>
              </div>
              <div className={`${styles.gradeCard} ${selectedGrade === 6 ? styles.gradeCardActive : ''}`} onClick={() => setSelectedGrade(6)}>
                <div className={styles.gradeAvatar}>👦🏽</div>
                <span>السادس الابتدائي</span>
              </div>
            </div>

            <AnimatePresence>
              {selectedGrade && curriculum[selectedGrade] && curriculum[selectedGrade].length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.curriculumContainer}
                >
                  {curriculum[selectedGrade].map(unit => (
                    <div key={unit.id} className={styles.unitBlock}>
                      <div 
                        className={styles.unitHeader} 
                        onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                      >
                        <span>{unit.title}</span>
                        {expandedUnit === unit.id ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      
                      <AnimatePresence>
                        {expandedUnit === unit.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={styles.lessonsList}
                          >
                            {unit.lessons.map(lesson => (
                              <div 
                                key={lesson.id} 
                                className={styles.lessonItem} 
                                onClick={() => {
                                  setActiveLesson(lesson.id);
                                  router.push('/student');
                                }}
                              >
                                <FaPlay size={12} color="#FF4FA3" />
                                <span>{lesson.title}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              ) : selectedGrade ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.curriculumContainer}
                  style={{ padding: '20px', textAlign: 'center', color: '#888' }}
                >
                  لم يتم إضافة مناهج لهذا الصف بعد. (من فضلك أضفها من شاشة المعلم)
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

      </section>
    </main>
  );
}
