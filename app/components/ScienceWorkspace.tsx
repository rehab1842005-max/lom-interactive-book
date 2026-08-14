"use client";

import { useBookStore } from "../store/bookStore";
import ZoneEditor from "./ZoneEditor";
import { useState } from "react";

export default function ScienceWorkspace() {
  const { 
    pages, zones, activePageId, 
    updatePage, updateZone, removeZone, addZone,
    drawingMode, draftPolygon 
  } = useBookStore();
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId);
  const activeZones = zones.filter((z) => z.pageId === activePageId);

  const handleZoomIn = () => setZoom(z => Math.min(z + 10, 200));

  const handleZoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const handleZoomReset = () => setZoom(100);

  return (
    <section className="canvas-workspace">
      {/* Canvas Toolbar */}
      <div className="canvas-toolbar" style={{ flexWrap: 'wrap', gap: '15px', height: 'auto', minHeight: '44px', padding: '8px 16px' }}>
        <div className="zoom-controls">
          <button className="tool-btn" onClick={handleZoomOut} title="تصغير الصفحة">
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <span className="zoom-text">{zoom}%</span>
          <button className="tool-btn" onClick={handleZoomIn} title="تكبير الصفحة">
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button className="tool-btn" onClick={handleZoomReset} title="ملائمة الشاشة">
            <i className="fa-solid fa-compress"></i> ملائمة
          </button>
        </div>

        <div className="canvas-tools-group">
          <label className="toggle-switch-label" title="إظهار شبكة المحاذاة">
            <input 
              type="checkbox" 
              checked={showGrid} 
              onChange={e => setShowGrid(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
            <span className="switch-text"><i className="fa-solid fa-border-top-left"></i> شبكة المحاذاة</span>
          </label>
        </div>

          <div className="canvas-tools-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '5px 10px', borderRadius: '8px', border: '3px solid red' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="fa-brands fa-youtube" style={{ color: '#ef4444', fontSize: '20px' }}></i>
              <input 
                type="text" 
                placeholder="رابط فيديو شرح الصفحة"
                value={activePage?.pageVideoUrl || ''}
                onChange={e => activePage && updatePage(activePage.id, { pageVideoUrl: e.target.value })}
                style={{ width: '200px', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            {activePage?.pageVideoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderRight: '1px solid #cbd5e1', paddingRight: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>تقسيم كل:</span>
                <input 
                  type="number"
                  min="1"
                  placeholder="8"
                  value={activePage.videoSplitInterval || ''}
                  onChange={e => updatePage(activePage.id, { videoSplitInterval: parseInt(e.target.value) || undefined })}
                  style={{ width: '50px', fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>ثواني</span>
              </div>
            )}
          </div>

        <div className="canvas-page-info">
          <span className="page-badge-indicator">
            {pages.length > 0 ? `الصفحة ${pages.findIndex(p => p.id === activePageId) + 1} من ${pages.length}` : "لا توجد صفحات"}
          </span>
        </div>
      </div>

      {/* Viewport */}
      <div className="canvas-viewport" style={{ overflow: "auto" }}>
        <div 
          className="page-sheet" 
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: "top center",
            transition: "transform 0.2s",
            backgroundImage: showGrid ? "linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)" : "none",
            backgroundSize: "20px 20px"
          }}
        >
          {activePage ? (
            <div 
              style={{ position: "relative", display: "inline-block", cursor: drawingMode ? 'crosshair' : 'default' }}
              onMouseDown={(e) => {
                if (drawingMode) {
                  useBookStore.getState().clearDraftPolygon();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / (zoom / 100);
                  const y = (e.clientY - rect.top) / (zoom / 100);
                  useBookStore.getState().addDraftPoint({ x, y });
                  e.currentTarget.dataset.isDrawing = "true";
                }
              }}
              onMouseMove={(e) => {
                if (drawingMode && e.currentTarget.dataset.isDrawing === "true") {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / (zoom / 100);
                  const y = (e.clientY - rect.top) / (zoom / 100);
                  
                  const draft = useBookStore.getState().draftPolygon;
                  const lastPoint = draft[draft.length - 1];
                  if (!lastPoint || Math.hypot(lastPoint.x - x, lastPoint.y - y) > 5) {
                    useBookStore.getState().addDraftPoint({ x, y });
                  }
                }
              }}
              onMouseUp={(e) => {
                if (drawingMode) {
                  e.currentTarget.dataset.isDrawing = "false";
                  useBookStore.getState().finishDraftPolygon(activePage.id);
                }
              }}
              onMouseLeave={(e) => {
                if (drawingMode && e.currentTarget.dataset.isDrawing === "true") {
                  e.currentTarget.dataset.isDrawing = "false";
                  useBookStore.getState().finishDraftPolygon(activePage.id);
                }
              }}
              onTouchStart={(e) => {
                if (drawingMode) {
                  e.preventDefault(); // Prevent scrolling
                  useBookStore.getState().clearDraftPolygon();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = (touch.clientX - rect.left) / (zoom / 100);
                  const y = (touch.clientY - rect.top) / (zoom / 100);
                  useBookStore.getState().addDraftPoint({ x, y });
                  e.currentTarget.dataset.isDrawing = "true";
                }
              }}
              onTouchMove={(e) => {
                if (drawingMode && e.currentTarget.dataset.isDrawing === "true") {
                  e.preventDefault(); // Prevent scrolling
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = (touch.clientX - rect.left) / (zoom / 100);
                  const y = (touch.clientY - rect.top) / (zoom / 100);
                  
                  const draft = useBookStore.getState().draftPolygon;
                  const lastPoint = draft[draft.length - 1];
                  // Reduce throttle distance to ensure we capture points
                  if (!lastPoint || Math.hypot(lastPoint.x - x, lastPoint.y - y) > 2) {
                    useBookStore.getState().addDraftPoint({ x, y });
                  }
                }
              }}
              onTouchEnd={(e) => {
                if (drawingMode) {
                  e.currentTarget.dataset.isDrawing = "false";
                  useBookStore.getState().finishDraftPolygon(activePage.id);
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activePage.imageUrl} 
                alt="Canvas" 
                style={{ display: "block", width: "100%", height: "auto", boxShadow: "var(--shadow-canvas)", pointerEvents: drawingMode ? 'none' : 'auto' }} 
              />
              {activeZones.map(zone => (
                <ZoneEditor key={zone.id} zone={zone} />
              ))}

              {/* Draft Polygon Overlay */}
              {drawingMode && draftPolygon.length > 0 && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
                  <polyline 
                    points={draftPolygon.map(p => `${p.x},${p.y}`).join(' ')} 
                    fill="none" 
                    stroke="#FF4FA3" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ) : (
            <div className="empty-page-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-file-circle-plus placeholder-icon" style={{ fontSize: "4rem", marginBottom: "1rem" }}></i>
              <h3>الصفحة فارغة</h3>
              <p>اضغط على تبويب "الصفحات" لإضافة صفحة للكتاب</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
