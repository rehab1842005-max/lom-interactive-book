"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import styles from './SkeletonStory.module.css';

// Helper component for fading text in and out based on progress
function StoryText({ 
  progress, 
  range, 
  children 
}: { 
  progress: MotionValue<number>; 
  range: [number, number, number, number]; 
  children: React.ReactNode 
}) {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, [range[0], range[1]], [20, 0]);
  
  return (
    <motion.div className={styles.storyText} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

export default function SkeletonStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // TIMELINE POINTS:
  // 0.00: Assembly & Intro
  // 0.12: Exploded View
  // 0.25: Skull Zoom
  // 0.37: Ribcage Zoom
  // 0.50: Spine Zoom
  // 0.62: Arms Movement
  // 0.75: Jelly Body
  // 0.88: Reassembly & Finale
  // 1.00: End
  
  const T = [0, 0.12, 0.25, 0.37, 0.50, 0.62, 0.75, 0.88, 1];

  // OPACITIES
  // parts fade out when other specific parts zoom in.
  const skullOpacity = useTransform(scrollYProgress, T, [1, 1, 1, 0, 0, 0, 0, 1, 1]);
  const ribOpacity = useTransform(scrollYProgress, T,   [1, 1, 0, 1, 0, 0, 0, 1, 1]);
  const spineOpacity = useTransform(scrollYProgress, T, [1, 1, 0, 0, 1, 0, 0, 1, 1]);
  const armsOpacity = useTransform(scrollYProgress, T,  [1, 1, 0, 0, 0, 1, 0, 1, 1]);
  const legsOpacity = useTransform(scrollYProgress, T,  [1, 1, 0, 0, 0, 0, 0, 1, 1]);
  const jellyOpacity = useTransform(scrollYProgress, T, [0, 0, 0, 0, 0, 0, 1, 0, 0]);

  // SCALES (Zooming in)
  const skullScale = useTransform(scrollYProgress, T, [1, 1, 2.5, 1, 1, 1, 1, 1, 1]);
  const ribScale = useTransform(scrollYProgress, T,   [1, 1, 1, 2.5, 1, 1, 1, 1, 1]);
  const spineScale = useTransform(scrollYProgress, T, [1, 1, 1, 1, 2.5, 1, 1, 1, 1]);
  const armLScale = useTransform(scrollYProgress, T,  [1, 1, 1, 1, 1, 2.5, 1, 1, 1]);
  const armRScale = useTransform(scrollYProgress, T,  [1, 1, 1, 1, 1, 2.5, 1, 1, 1]);

  // POSITIONS (Exploding and centering during zoom)
  
  // Skull: explode slightly up, center during zoom (y: 100)
  const skullY = useTransform(scrollYProgress, T, [0, -30, 150, 0, 0, 0, 0, 0, 0]);
  
  // Ribcage: center during zoom (y: 50)
  const ribY = useTransform(scrollYProgress, T, [0, 0, 0, 50, 0, 0, 0, 0, 0]);
  
  // Spine: center during zoom (y: -50)
  const spineY = useTransform(scrollYProgress, T, [0, 0, 0, 0, -50, 0, 0, 0, 0]);

  // Arms: explode out, move to center during zoom
  const armLX = useTransform(scrollYProgress, T, [0, -40, 0, 0, 0, 100, 0, 0, 0]);
  const armRX = useTransform(scrollYProgress, T, [0, 40, 0, 0, 0, -100, 0, 0, 0]);
  
  // Legs: explode out and down
  const legLX = useTransform(scrollYProgress, T, [0, -50, 0, 0, 0, 0, 0, 0, 0]);
  const legRX = useTransform(scrollYProgress, T, [0, 50, 0, 0, 0, 0, 0, 0, 0]);
  const legY = useTransform(scrollYProgress, T, [0, 40, 0, 0, 0, 0, 0, 0, 0]);

  // ARM MOVEMENT (Stage 6)
  const armLRot = useTransform(scrollYProgress, [0.60, 0.66, 0.72], [0, -45, 0]);
  const armRRot = useTransform(scrollYProgress, [0.60, 0.66, 0.72], [0, 45, 0]);

  // INDICATORS (Stage 8)
  const indicatorsOpacity = useTransform(scrollYProgress, [0.85, 0.90], [0, 1]);

  return (
    <div ref={containerRef} className={styles.storyContainer}>
      <div className={styles.stickyStage}>
        
        {/* TEXT OVERLAYS */}
        <div className={styles.textWrapper}>
          <StoryText progress={scrollYProgress} range={[0.00, 0.03, 0.09, 0.11]}>
            كام عظمة موجودة في جسمك؟
          </StoryText>
          
          <StoryText progress={scrollYProgress} range={[0.11, 0.14, 0.22, 0.24]}>
            العظام مش مجرد أجزاء صلبة... <br/>
            <span className={styles.subText}>كل جزء له وظيفة.</span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.24, 0.27, 0.35, 0.37]}>
            <span className={styles.highlight}>الجمجمة</span> <br/>
            <span className={styles.subText}>صندوق صلب يحمي المخ.</span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.37, 0.40, 0.47, 0.49]}>
            <span className={styles.highlight}>القفص الصدري</span> <br/>
            <span className={styles.subText}>يحمي أعضاء مهمة مثل القلب والرئتين.</span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.49, 0.52, 0.59, 0.61]}>
            <span className={styles.highlight}>العمود الفقري</span> <br/>
            <span className={styles.subText}>يدعم الجسم ويساعده على الحركة.</span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.61, 0.64, 0.72, 0.74]}>
            إزاي بنقدر نحرك جسمنا؟ <br/>
            <span className={styles.subText}>العظم + المفصل + العضلة = <span className={styles.highlight}>حركة</span></span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.74, 0.77, 0.85, 0.87]}>
            تفتكر جسمنا يقدر يتحرك من غير عظام؟ <br/>
            <span className={styles.subText} style={{ color: '#ef4444', fontSize: '2rem' }}>❌ لا!</span>
          </StoryText>

          <StoryText progress={scrollYProgress} range={[0.87, 0.90, 1.00, 1.00]}>
            جسمك <span className={styles.highlight}>نظام متكامل</span> <br/>
            <span className={styles.subText}>اكتشفه... بدل ما تحفظه.</span>
          </StoryText>
        </div>

        {/* 3D COMPOSITE ANATOMY */}
        <div className={styles.anatomyArea}>
          
          <motion.div className={`${styles.bonePart} ${styles.skull}`} style={{ y: skullY, scale: skullScale, opacity: skullOpacity }}>
            💀
            <motion.div className={`${styles.indicator} ${styles.indSkull}`} style={{ opacity: indicatorsOpacity }}>الجمجمة</motion.div>
          </motion.div>
          
          <motion.div className={`${styles.bonePart} ${styles.ribcage}`} style={{ y: ribY, scale: ribScale, opacity: ribOpacity }}>
            🫁
            <motion.div className={`${styles.indicator} ${styles.indRibs}`} style={{ opacity: indicatorsOpacity }}>القفص الصدري</motion.div>
          </motion.div>
          
          <motion.div className={`${styles.bonePart} ${styles.spine}`} style={{ y: spineY, scale: spineScale, opacity: spineOpacity }}>
            🦴
            <motion.div className={`${styles.indicator} ${styles.indSpine}`} style={{ opacity: indicatorsOpacity }}>العمود الفقري</motion.div>
          </motion.div>
          
          <motion.div className={`${styles.bonePart} ${styles.armLeft}`} style={{ x: armLX, scale: armLScale, rotate: armLRot, opacity: armsOpacity }}>
            💪
          </motion.div>
          
          <motion.div className={`${styles.bonePart} ${styles.armRight}`} style={{ x: armRX, scale: armRScale, rotate: armRRot, opacity: armsOpacity }}>
            💪
            <motion.div className={`${styles.indicator} ${styles.indArms}`} style={{ opacity: indicatorsOpacity }}>الأطراف</motion.div>
          </motion.div>

          <motion.div className={`${styles.bonePart} ${styles.legLeft}`} style={{ x: legLX, y: legY, opacity: legsOpacity }}>
            🦵
          </motion.div>

          <motion.div className={`${styles.bonePart} ${styles.legRight}`} style={{ x: legRX, y: legY, opacity: legsOpacity }}>
            🦵
          </motion.div>

          <motion.div className={`${styles.bonePart} ${styles.jelly}`} style={{ opacity: jellyOpacity }}>
            🫠
          </motion.div>

        </div>

      </div>
    </div>
  );
}
