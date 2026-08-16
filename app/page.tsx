"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useBookStore } from "./store/bookStore";
import { FaChevronDown, FaPlay } from "react-icons/fa";

// Static array of stars to prevent hydration mismatch
const STAR_DATA = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  top: `${Math.floor(Math.random() * 100)}%`,
  left: `${Math.floor(Math.random() * 100)}%`,
  size: Math.random() * 1.5 + 0.8, // Size between 0.8rem and 2.3rem
  delay: Math.random() * 2,
  char: Math.random() > 0.5 ? '✨' : '🌟'
}));

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { curriculum, setActiveGrade } = useBookStore();
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Navbar Scroll State
  const [scrolled, setScrolled] = useState(false);
  
  // To prevent hydration errors, we only render random stars after client mount
  const [stars, setStars] = useState<{id: number, top: string, left: string, size: number, delay: number}[]>([]);

  useEffect(() => {
    setIsClient(true);
    setStars(STAR_DATA);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. HERO SECTION SCROLL
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroExitX = useTransform(heroProgress, [0, 1], ["0vw", "100vw"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  
  const atomX = useTransform(heroProgress, [0, 1], ["80vw", "10vw"]);
  const microscopeX = useTransform(heroProgress, [0, 1], ["-10vw", "20vw"]);
  const dnaX = useTransform(heroProgress, [0, 1], ["60vw", "30vw"]);

  // 2. TEXT SECTION SCROLL
  const textRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: textProgress } = useScroll({
    target: textRef,
    offset: ["start start", "end start"]
  });
  const textExitX = useTransform(textProgress, [0, 1], ["0vw", "-100vw"]);
  const textOpacity = useTransform(textProgress, [0, 0.8], [1, 0]);

  // 3. CANDLE SECTION SCROLL (Moved before book)
  const candleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: candleProgress } = useScroll({
    target: candleRef,
    offset: ["start start", "end start"]
  });
  const candleExitX = useTransform(candleProgress, [0, 1], ["0vw", "100vw"]);
  const candleOpacity = useTransform(candleProgress, [0, 0.8], [1, 0]);

  // 4. BOOK SECTION SCROLL
  const bookRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: bookProgress } = useScroll({
    target: bookRef,
    offset: ["start start", "end start"]
  });
  const bookExitX = useTransform(bookProgress, [0, 1], ["0vw", "-100vw"]);
  const bookOpacity = useTransform(bookProgress, [0, 0.8], [1, 0]);

  if (!isClient) return null;

  return (
    <main className={styles.container}>
      
      {/* 🌟 Starry Background */}
      <div className={styles.starryBackground}>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className={styles.glowingStar}
            style={{ top: star.top, left: star.left, fontSize: `${star.size}rem` }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: star.delay }}
          >
            {star.char}
          </motion.div>
        ))}
      </div>

      {/* NAVBAR */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navLinks}>
          <a href="#">الرئيسية</a>
          <a href="#grades">الصفوف الدراسية</a>
          <a href="#book">الملزمة التفاعلية</a>
        </div>
      </nav>

      {/* ================= 1. HERO SCENE ================= */}
      <section ref={heroRef} className={styles.scene1Container}>
        {/* Decorative Background Elements */}
        <div className={styles.heroBackgroundOrb}></div>
        <div className={styles.heroGrid}></div>

        <motion.div 
          style={{ x: heroExitX, opacity: heroOpacity, textAlign: 'center', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
        >
          <div className={styles.titleWrapper}>
            <h1 className={styles.heroTitle}>رحاب السباعي</h1>
          </div>
          <p className={styles.heroSubtitle}>منصة العلوم التفاعلية</p>
          <p className={styles.heroTagline}>تعلّم • اكتشف • جرّب</p>
          
          <motion.a 
            href="#grades"
            className={styles.heroCta}
            whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(236,72,153,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            ابدأ رحلتك الآن 🚀
          </motion.a>
        </motion.div>

        <motion.div 
          className={styles.heroScrollHint}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ x: heroExitX, opacity: heroOpacity }}
        >
          اسحب لاكتشاف المنصة ↓
        </motion.div>

        {/* Parallax Science Objects */}
        <motion.div className={`${styles.scienceParticle} ${styles.atom}`} style={{ x: atomX, opacity: heroOpacity, zIndex: 1 }}>⚛️</motion.div>
        <motion.div className={`${styles.scienceParticle} ${styles.microscope}`} style={{ x: microscopeX, opacity: heroOpacity, zIndex: 1 }}>🔬</motion.div>
        <motion.div className={`${styles.scienceParticle} ${styles.dna}`} style={{ x: dnaX, opacity: heroOpacity, zIndex: 1 }}>🧬</motion.div>
      </section>

      {/* ================= 2. REVEAL TEXT SCENE ================= */}
      <section ref={textRef} className={styles.scene1TextContainer}>
        <motion.div 
          style={{ x: textExitX, opacity: textOpacity }}
          className={styles.scrollText}
        >
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            مش مجرد شرح...
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className={styles.scrollTextHighlight}>دي تجربة.</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ================= 3. CANDLE EXPERIMENT SCENE (Reordered) ================= */}
      <section ref={candleRef} className={styles.scene4Container}>
        <motion.div style={{ x: candleExitX, opacity: candleOpacity }} className={styles.candleContainer}>
          <div className={styles.candleBody}></div>
          <div className={styles.candleWick}></div>
          
          <motion.div 
            className={styles.candleSpark}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: [0, 1, 0] }}
            viewport={{ once: false, amount: 0.6 }}
          ></motion.div>
          
          <motion.div 
            className={styles.candleFlame}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: [0, 1, 1.4, 1.2] }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ 
              opacity: { duration: 0.5 },
              scale: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 0.2 }
            }}
          ></motion.div>

          {/* Oxygen Particles */}
          <motion.div 
            className={styles.oxygenParticle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.6 }}
          >O₂</motion.div>
          <motion.div 
            className={styles.oxygenParticle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.6 }}
          >O₂</motion.div>
          <motion.div 
            className={styles.oxygenParticle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.6 }}
          >O₂</motion.div>
        </motion.div>

        <motion.div 
          className={styles.scene4Text}
          style={{ x: candleExitX, opacity: candleOpacity }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.6 }}
          >
            الأكسجين يساعد على الاحتراق.
          </motion.div>
        </motion.div>
      </section>

      {/* ================= 4. INTERACTIVE BOOK SCENE ================= */}
      <section id="book" ref={bookRef} className={styles.scene2Container}>
        <motion.div 
          className={styles.bookMockup}
          style={{ x: bookExitX, opacity: bookOpacity }}
        >
          <div className={styles.bookTextLine} style={{ width: '80%' }}></div>
          <div className={styles.bookTextLine} style={{ width: '100%' }}></div>
          <div className={styles.bookTextLine} style={{ width: '60%' }}></div>

          <motion.div 
            className={styles.bookCursor}
            initial={{ opacity: 0, scale: 2 }}
            whileInView={{ 
              opacity: [0, 1, 1, 0],
              scale: [2, 1, 0.8, 1]
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.5, times: [0, 0.4, 0.7, 1] }}
          >
            👆
          </motion.div>

          <motion.div className={styles.bookVideoMock}>
            <FaPlay />
          </motion.div>
        </motion.div>

        <motion.div 
          className={styles.scene2Text}
          style={{ x: bookExitX, opacity: bookOpacity }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
          >
            اضغط على المعلومة... <br/> <span style={{ color: '#ec4899' }}>وخليها تشرح نفسها.</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ================= 5. GRADES SCENE (Stays visible) ================= */}
      <section id="grades" className={styles.scene5Container}>
        <h2 className={styles.gradesTitle}>اختر صفك الدراسي</h2>
        <div className={styles.gradesWrapper}>
          {[4, 5, 6].map((grade, index) => (
            <motion.div 
              key={grade}
              className={styles.gradeCard}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className={styles.gradeName}>
                الصف {grade === 4 ? "الرابع" : grade === 5 ? "الخامس" : "السادس"} الابتدائي
              </h3>
              
              <div className={styles.accordionList}>
                {curriculum[grade]?.map((unit) => (
                  <div key={unit.id}>
                    <button 
                      className={styles.unitHeader}
                      onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                    >
                      <span>{unit.title}</span>
                      <motion.div animate={{ rotate: expandedUnit === unit.id ? 180 : 0 }}>
                        <FaChevronDown />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedUnit === unit.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {unit.lessons.map(lesson => (
                            <div 
                              key={lesson.id} 
                              className={styles.lessonItem}
                              onClick={() => {
                                setActiveGrade(grade);
                                router.push('/student');
                              }}
                            >
                              {lesson.title}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ================= SCENE 5: FOOTER ================= */}
      <section className={styles.scene5Container}>
        <h2 className={styles.footerBrand}>رحاب السباعي</h2>
        <p className={styles.footerSlogan}>العلوم أسهل لما نفهمها ونكتشفها.</p>
        <button 
          className={styles.startBtn}
          onClick={() => document.getElementById('grades')?.scrollIntoView({ behavior: 'smooth' })}
        >
          ابدأ التعلم →
        </button>

        {/* Floating Pink Particles */}
        <motion.div className={styles.pinkParticle} style={{ width: 20, height: 20, top: '20%', left: '20%' }} animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
        <motion.div className={styles.pinkParticle} style={{ width: 30, height: 30, top: '40%', right: '25%' }} animate={{ y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
        <motion.div className={styles.pinkParticle} style={{ width: 15, height: 15, bottom: '20%', left: '40%' }} animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} />
      </section>

    </main>
  );
}
