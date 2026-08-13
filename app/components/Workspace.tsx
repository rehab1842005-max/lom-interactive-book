"use client";

import { useBookStore } from "../store/bookStore";
import ZoneEditor from "./ZoneEditor";
import { FaImage } from "react-icons/fa";

export default function Workspace() {
  const { pages, activePageId, zones } = useBookStore();

  const activePage = pages.find((p) => p.id === activePageId);
  const activeZones = zones.filter((z) => z.pageId === activePageId);

  if (!activePage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)" }}>
        <FaImage size={60} color="#ddd" style={{ marginBottom: "1rem" }} />
        <h2>لم يتم اختيار أي صفحة</h2>
        <p>قم برفع صفحة من القائمة الجانبية للبدء بالتصميم</p>
      </div>
    );
  }

  return (
    <div style={{ 
      position: "relative", 
      background: "#fff", 
      boxShadow: "var(--shadow-md)",
      display: "inline-block" // To wrap tightly around the image
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={activePage.imageUrl} 
        alt="Page Canvas" 
        style={{ display: "block", maxWidth: "800px", maxHeight: "80vh", objectFit: "contain" }}
      />
      
      {activeZones.map((zone) => (
        <ZoneEditor key={zone.id} zone={zone} />
      ))}
    </div>
  );
}
