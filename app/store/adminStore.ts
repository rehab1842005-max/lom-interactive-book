import { create } from 'zustand';

export interface AdminPermissions {
  manageCurriculum: boolean;
  manageStudents: boolean;
  manageAdmins: boolean;
}

export interface AdminUser {
  id: string; // Document ID (usually phone number)
  phone: string;
  name: string;
  role: 'owner' | 'moderator';
  permissions: AdminPermissions;
}

interface AdminState {
  currentAdmin: AdminUser | null;
  setCurrentAdmin: (admin: AdminUser | null) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  currentAdmin: null,
  setCurrentAdmin: (admin) => set({ currentAdmin: admin }),
  logout: () => {
    localStorage.removeItem('rehab_admin_token');
    set({ currentAdmin: null });
  }
}));
