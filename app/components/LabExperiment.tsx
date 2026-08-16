"use client";

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Experiment } from '../store/bookStore';
import styles from './LabExperiment.module.css';

export default function LabExperiment({ experiment }: { experiment: Experiment }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Animation values mapped to scroll progress (0 to 1)
  
  // 1. Move particles towards center (0 -> 0.45)
  const particleLeftX = useTransform(scrollYProgress, [0, 0.45], ["-150px", "0px"]);
  const particleRightX = useTransform(scrollYProgress, [0, 0.45], ["150px", "0px"]);
  const particleLeftY = useTransform(scrollYProgress, [0, 0.45], ["50px", "0px"]);
  const particleRightY = useTransform(scrollYProgress, [0, 0.45], ["-50px", "0px"]);
  
  // 2. Opacity of the initial state (fades out right at 0.5)
  const initialOpacity = useTransform(scrollYProgress, [0.45, 0.5], [1, 0]);
  
  // 3. Result appears with a scale pop (0.48 -> 0.6)
  const resultOpacity = useTransform(scrollYProgress, [0.48, 0.52], [0, 1]);
  const resultScale = useTransform(scrollYProgress, [0.48, 0.6], [0.5, 1.2]);

  // 4. Text fades in and moves up (0.55 -> 0.7)
  const textOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.55, 0.7], [30, 0]);

  return (
    <div ref={containerRef} className={styles.labContainer}>
      <div className={styles.stickyStage}>
        
        <div className={styles.experimentArea}>
          {/* Initial State */}
          <motion.div className={styles.initialState} style={{ opacity: initialOpacity }}>
            <motion.div className={styles.particle} style={{ x: particleLeftX, y: particleLeftY }}>
              {experiment.emoji2}
            </motion.div>
            
            <div className={styles.centerItem}>
              {experiment.emoji1}
            </div>
            
            <motion.div className={styles.particle} style={{ x: particleRightX, y: particleRightY }}>
              {experiment.emoji2}
            </motion.div>
          </motion.div>

          {/* Result State */}
          <motion.div className={styles.resultState} style={{ opacity: resultOpacity, scale: resultScale }}>
            {experiment.resultEmoji}
          </motion.div>
        </div>

        {/* Explanation Text */}
        <motion.h3 className={styles.explanationText} style={{ opacity: textOpacity, y: textY }}>
          {experiment.text}
        </motion.h3>
        
      </div>
    </div>
  );
}
