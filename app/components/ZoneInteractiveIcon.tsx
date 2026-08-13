"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zone, InteractionType } from "../store/bookStore";
import { FaPlay, FaQuestion, FaStickyNote, FaLink, FaPlus } from "react-icons/fa";
import { MdHeadphones } from "react-icons/md";

interface ZoneInteractiveIconProps {
  zone: Zone;
  onClick: (type: InteractionType) => void;
  isPlayingAudio: boolean;
  forceOpen?: boolean;
}

export default function ZoneInteractiveIcon({ zone, onClick, isPlayingAudio, forceOpen }: ZoneInteractiveIconProps) {
  const [isOpen, setIsOpen] = useState(forceOpen || false);

  // Normalize interactions to always be an array
  const interactions = zone.interactionTypes && zone.interactionTypes.length > 0 
    ? zone.interactionTypes 
    : (zone.interactionType !== 'none' ? [zone.interactionType] : []);

  const getIcon = (type: InteractionType) => {
    switch (type) {
      case 'audio': return <MdHeadphones size={24} />;
      case 'video': return <FaPlay size={20} style={{ marginLeft: "4px" }} />;
      case 'question': return <FaQuestion size={22} />;
      case 'note': return <FaStickyNote size={20} />;
      case 'link': return <FaLink size={20} />;
      default: return null;
    }
  };

  const IconContainer = ({ children, isPlaying, type }: { children: React.ReactNode, isPlaying?: boolean, type?: InteractionType }) => (
    <motion.div
      className="glass-icon-2026"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      style={{
        width: "60px",
        height: "60px",
        cursor: "pointer",
        zIndex: 20
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (type) onClick(type);
      }}
    >
      {isPlaying && type === 'audio' && (
        <>
          <div className="sound-wave-circle"></div>
          <div className="sound-wave-circle"></div>
          <div className="sound-wave-circle"></div>
        </>
      )}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </motion.div>
  );

  // Single Interaction
  if (interactions.length === 1) {
    const type = interactions[0];
    return (
      <IconContainer type={type} isPlaying={isPlayingAudio && type === 'audio'}>
        {getIcon(type)}
      </IconContainer>
    );
  }

  // If multiple interactions, show a generic "Journey" icon (e.g. Play)
  if (interactions.length > 1) {
    return (
      <IconContainer type={interactions[0]} isPlaying={false}>
        <FaPlay size={20} style={{ marginLeft: "4px" }} />
      </IconContainer>
    );
  }

  return null;
}
