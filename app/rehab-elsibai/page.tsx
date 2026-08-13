"use client";

import { useEffect, useState } from "react";
import ScienceTopBar from "../components/ScienceTopBar";
import ScienceSidebar from "../components/ScienceSidebar";
import ScienceWorkspace from "../components/ScienceWorkspace";
import AdminAuthGate from "../components/AdminAuthGate";
import { useAdminStore } from "../store/adminStore";

export default function TeacherMode() {
  const [isClient, setIsClient] = useState(false);
  const { currentAdmin } = useAdminStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <AdminAuthGate>
      <div className="app-wrapper editor-mode">
        <ScienceTopBar />
        <main className="main-editor-layout">
          <ScienceSidebar />
          {currentAdmin?.permissions?.manageCurriculum && <ScienceWorkspace />}
        </main>
      </div>
    </AdminAuthGate>
  );
}
