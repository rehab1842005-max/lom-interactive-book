"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaPlay, FaUserAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <main className={styles.container}>
      {/* Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            🔬
          </div>
          <div className={styles.logoText}>
            <h1>رحاب السباعي</h1>
            <p>العلوم أسهل لما نفهمها ونكتشفها</p>
          </div>
        </div>
        
        <nav className={styles.navLinks}>
          <Link href="#">الرئيسية</Link>
          <Link href="#subjects">الدروس</Link>
          <Link href="#interactive">الملزمة التفاعلية</Link>
          <Link href="#videos">الفيديوهات</Link>
          <Link href="#quiz">الاختبارات</Link>
        </nav>

        <div className={styles.userProfile}>
          <FaUserAlt color="#8b5cf6" />
          <span>ملف الطالب</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className={styles.heroTitle}
          >
            اكتشف عالم العلوم بطريقة مختلفة! <span>🔬</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.heroSubtitle}
          >
            تعلّم، شاهد، جرّب، واختبر نفسك من خلال دروس العلوم التفاعلية. رحلتك في عالم الاكتشاف تبدأ هنا.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroButtons}
          >
            <button className={styles.primaryBtn} onClick={() => router.push('/student')}>
              ابدأ التعلم الآن
            </button>
            <button className={styles.secondaryBtn} onClick={() => {
              document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              استكشف الدروس
            </button>
          </motion.div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.glowBall}></div>
          <motion.div 
            className={styles.bookContainer}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            📖
          </motion.div>
          
          <div className={styles.floatingElements}>
            <motion.div className={styles.floatingItem} style={{ top: '10%', left: '20%' }} animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>🌍</motion.div>
            <motion.div className={styles.floatingItem} style={{ top: '20%', right: '15%' }} animate={{ y: [0, -25, 0], rotate: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>🔬</motion.div>
            <motion.div className={styles.floatingItem} style={{ bottom: '20%', left: '10%' }} animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}>🌱</motion.div>
            <motion.div className={styles.floatingItem} style={{ bottom: '15%', right: '25%' }} animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}>⚛️</motion.div>
            <motion.div className={styles.floatingItem} style={{ top: '50%', left: '5%' }} animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}>🦠</motion.div>
            <motion.div className={styles.floatingItem} style={{ top: '40%', right: '5%' }} animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, delay: 1.2 }}>🧪</motion.div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section id="subjects" className={styles.subjectsSection}>
        <h2 className={styles.sectionTitle}>اختار درسَك وابدأ المغامرة</h2>
        <div className={styles.subjectsGrid}>
          <div className={styles.subjectCard} onClick={() => router.push('/student')}>
            <div className={styles.subjectIcon}>🧬</div>
            <h3>الأحياء</h3>
            <p>اكتشف عالم الكائنات الحية</p>
          </div>
          <div className={styles.subjectCard} onClick={() => router.push('/student')}>
            <div className={styles.subjectIcon}>⚗️</div>
            <h3>الكيمياء</h3>
            <p>افهم المادة والتفاعلات</p>
          </div>
          <div className={styles.subjectCard} onClick={() => router.push('/student')}>
            <div className={styles.subjectIcon}>🌍</div>
            <h3>علوم الأرض</h3>
            <p>اكتشف كوكبنا</p>
          </div>
          <div className={styles.subjectCard} onClick={() => router.push('/student')}>
            <div className={styles.subjectIcon}>⚡</div>
            <h3>الفيزياء</h3>
            <p>افهم الحركة والطاقة</p>
          </div>
        </div>
      </section>

      {/* Interactive Book Section */}
      <section id="interactive" className={styles.featureSection}>
        <div className={styles.featureText}>
          <h2>الملزمة بتتكلم! 📖</h2>
          <p>اضغط على المعلومة واسمع شرحها وشاهد الفيديو التفاعلي مباشرة من داخل الملزمة دون عناء البحث.</p>
          <button className={styles.primaryBtn} onClick={() => router.push('/student')}>افتح الملزمة</button>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.book3D}>📚</div>
          <motion.div 
            className={styles.playIcon}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => router.push('/student')}
          >
            <FaPlay />
          </motion.div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz" className={`${styles.featureSection} ${styles.reverse}`}>
        <div className={styles.featureText}>
          <h2>اختبر نفسك 🧠</h2>
          <p>أسئلة تفاعلية ذكية تقيس مدى فهمك للدرس، مع تصحيح فوري وتقييم مستواك لمساعدتك على التفوق.</p>
          <button className={styles.secondaryBtn} onClick={() => router.push('/student')}>ابدأ الاختبار</button>
        </div>
        <div className={styles.featureVisual}>
          <div className={styles.brain3D}>🧠</div>
          <motion.div 
            className={styles.floatingItem} 
            style={{ top: '10%', right: '10%', fontSize: '4rem' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <motion.div 
            className={styles.floatingItem} 
            style={{ bottom: '15%', left: '15%', fontSize: '3rem' }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            💡
          </motion.div>
        </div>
      </section>

      {/* Action Footer */}
      <section className={styles.startAction}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>هل أنت مستعد لبدء التعلم؟</h2>
        <button className={styles.primaryBtn} onClick={() => router.push('/student')} style={{ padding: '1.2rem 4rem', fontSize: '1.5rem' }}>
          دخول كطالب
        </button>
      </section>
    </main>
  );
}
