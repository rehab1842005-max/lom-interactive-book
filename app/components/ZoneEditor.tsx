"use client";

import { Rnd } from "react-rnd";
import { useBookStore, Zone } from "../store/bookStore";
import { FaTrash, FaEdit, FaVolumeUp, FaVideo, FaQuestionCircle, FaLink } from "react-icons/fa";
import { useState } from "react";
import InteractionModal from "./InteractionModal";

export default function ZoneEditor({ zone }: { zone: Zone }) {
  const { updateZone, removeZone, setSelectedZone } = useBookStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getIcon = () => {
    if (!zone.showIcon) return null;
    switch (zone.interactionType) {
      case 'audio': return <FaVolumeUp />;
      case 'video': return <FaVideo />;
      case 'question': return <FaQuestionCircle />;
      case 'link': return <FaLink />;
      default: return null;
    }
  };

  return (
    <>
      <Rnd
        size={{ width: zone.width, height: zone.height }}
        position={{ x: zone.x, y: zone.y }}
        onDragStart={() => setSelectedZone(zone.id)}
        onDragStop={(e, d) => {
          const parent = d.node.parentElement;
          if (!parent) {
            updateZone(zone.id, { x: d.x, y: d.y });
            return;
          }
          const pw = parent.offsetWidth;
          const ph = parent.offsetHeight;
          updateZone(zone.id, { 
            x: d.x, 
            y: d.y,
            xPercent: (d.x / pw) * 100,
            yPercent: (d.y / ph) * 100
          });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          const parent = ref.parentElement;
          const w = ref.offsetWidth;
          const h = ref.offsetHeight;
          if (!parent) {
            updateZone(zone.id, {
              width: w,
              height: h,
              ...position
            });
            return;
          }
          const pw = parent.offsetWidth;
          const ph = parent.offsetHeight;
          updateZone(zone.id, {
            width: w,
            height: h,
            x: position.x,
            y: position.y,
            xPercent: (position.x / pw) * 100,
            yPercent: (position.y / ph) * 100,
            widthPercent: (w / pw) * 100,
            heightPercent: (h / ph) * 100
          });
        }}
        bounds="parent"
        style={{
          border: zone.shape === 'polygon' ? "none" : `2px dashed ${zone.color}`,
          backgroundColor: zone.shape === 'polygon' ? "transparent" : `${zone.color}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          cursor: zone.shape === 'polygon' ? "default" : "move",
          borderRadius: zone.shape === 'circle' ? "50%" : "8px",
          zIndex: 50,
          pointerEvents: zone.shape === 'polygon' ? "none" : "auto"
        }}
        resizeHandleStyles={{
          bottom: { pointerEvents: 'auto' },
          bottomLeft: { pointerEvents: 'auto' },
          bottomRight: { pointerEvents: 'auto' },
          left: { pointerEvents: 'auto' },
          right: { pointerEvents: 'auto' },
          top: { pointerEvents: 'auto' },
          topLeft: { pointerEvents: 'auto' },
          topRight: { pointerEvents: 'auto' }
        }}
      >
        {zone.shape === 'polygon' && zone.polygonPoints && (
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }} preserveAspectRatio="none">
            <polygon 
              points={zone.polygonPoints.map(p => `${p.x},${p.y}`).join(' ')} 
              fill={`${zone.color}33`} 
              stroke={zone.color} 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'auto', cursor: 'move' }}
            />
          </svg>
        )}

        <div style={{ position: "absolute", top: -25, right: 0, display: "flex", gap: "5px", pointerEvents: 'auto' }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ background: "#8E44AD", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
          >
            <FaEdit />
          </button>
          <button 
            onClick={() => removeZone(zone.id)}
            style={{ background: "#ff4d4f", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
          >
            <FaTrash />
          </button>
        </div>
        
        {(() => {
          let cx = 50;
          let cy = 50;
          if (zone.shape === 'polygon' && zone.polygonPoints && zone.polygonPoints.length > 0) {
            cx = zone.polygonPoints.reduce((sum, p) => sum + p.x, 0) / zone.polygonPoints.length;
            cy = zone.polygonPoints.reduce((sum, p) => sum + p.y, 0) / zone.polygonPoints.length;
          }
          const isVideo = !!zone.content?.videoUrl;

          return (
            <div style={{ 
              position: 'absolute', 
              top: `${cy}%`, 
              left: `${cx}%`, 
              transform: 'translate(-50%, -50%)', 
              pointerEvents: 'none',
              zIndex: 60 
            }}>
              {isVideo && (
                <div style={{ position: 'absolute', top: '-75px', left: '-50px', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', zIndex: 61 }}>
                  <span style={{ fontFamily: 'var(--font-arabic)', color: '#ff4fa3', fontWeight: 'bold', fontSize: '18px', textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '12px' }}>فيديو</span>
                  <svg width="40" height="40" viewBox="0 0 100 100" style={{ transform: 'rotate(-10deg)', marginTop: '2px' }}>
                    <path d="M 80 10 Q 40 20 20 80 M 20 80 L 10 55 M 20 80 L 45 70" stroke="#ff4fa3" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {zone.showIcon && (
                <div style={{ pointerEvents: 'auto', fontSize: "24px", color: zone.color, cursor: 'pointer' }}>
                  {getIcon()}
                </div>
              )}
            </div>
          );
        })()}
      </Rnd>
      
      {isModalOpen && (
        <InteractionModal zone={zone} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
