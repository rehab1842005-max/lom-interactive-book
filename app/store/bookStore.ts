import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';

// Custom storage object using idb-keyval for unlimited storage
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    if (value) return value;
    // Fallback/Migrate from localStorage
    const localValue = localStorage.getItem(name);
    if (localValue) {
      await set(name, localValue);
      return localValue;
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
      localStorage.removeItem(name); // Free up quota
    } catch (e: any) {
      console.error("IDB Set Error:", e);
      alert("تحذير هام: مساحة تخزين المتصفح ممتلئة! المتصفح يرفض حفظ أي تعديلات جديدة. الصور التي ستضيفينها الآن ستختفي عند التحديث. يرجى مسح بعض الصور القديمة من الدرس الأول.");
    }
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
    localStorage.removeItem(name);
  },
};

export type InteractionType = 'audio' | 'video' | 'question' | 'note' | 'link' | 'page' | 'image' | 'none';

export type QuestionType = 'mcq' | 'multiselect' | 'tf' | 'text' | 'essay' | 'audio_q' | 'video_q';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  points: number;
  options?: string[];
  correctAnswer: string | string[] | number | boolean;
  successMessage?: string;
  errorMessage?: string;
  showAnswer?: boolean;
  maxAttempts?: number;
  randomizeOptions?: boolean;
  mediaUrl?: string;
}

export interface Zone {
  id: string;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  shape?: 'rect' | 'circle' | 'polygon'; // The shape of the zone
  polygonPoints?: { x: number, y: number }[]; // Array of points (0 to 100 percentage relative to bounding box)
  color: string;
  name: string;
  interactionType: InteractionType; // Legacy single type
  interactionTypes?: InteractionType[]; // New multiple types
  showIcon: boolean;
  content: {
    audioUrl?: string;
    videoUrl?: string;
    videoStartTime?: number;
    videoEndTime?: number;
    linkUrl?: string;
    noteText?: string;
    targetPageId?: string;
    imageUrl?: string;
    question?: Question; // legacy
    questions?: Question[]; // array of questions
  };
}

export interface Page {
  id: string;
  imageUrl: string;
  order: number;
  lessonId?: string; // Links page to a specific lesson
  questions?: Question[]; // Page-level questions
}

export interface Lesson {
  id: string;
  title: string;
  isFree?: boolean; // If true, accessible without approval
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export type Curriculum = {
  [grade: number]: Unit[];
};

interface BookState {
  curriculum: Curriculum;
  activeGrade: number | null;
  activeLessonId: string | null;
  pages: Page[];
  zones: Zone[];
  activePageId: string | null;
  selectedZoneId: string | null;
  
  // Curriculum Actions
  setActiveGrade: (grade: number | null) => void;
  setActiveLesson: (lessonId: string | null) => void;
  addUnit: (grade: number, title: string) => void;
  updateUnit: (grade: number, unitId: string, title: string) => void;
  removeUnit: (grade: number, unitId: string) => void;
  addLesson: (grade: number, unitId: string, title: string) => void;
  updateLesson: (grade: number, unitId: string, lessonId: string, updates: Partial<Lesson>) => void;
  removeLesson: (grade: number, unitId: string, lessonId: string) => void;

  // Page/Zone Actions
  addPage: (imageUrl: string, specificLessonId?: string) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  removePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  setSelectedZone: (zoneId: string | null) => void;
  
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  
  exportBook: () => string;
  importBook: (jsonString: string) => void;
  
  // Polygon Drawing State
  drawingMode: boolean;
  draftPolygon: {x: number, y: number}[];
  setDrawingMode: (mode: boolean) => void;
  addDraftPoint: (point: {x: number, y: number}) => void;
  finishDraftPolygon: (pageId: string) => void;
  clearDraftPolygon: () => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      curriculum: {},
      activeGrade: null,
      activeLessonId: null,
      pages: [],
      zones: [],
      activePageId: null,
      selectedZoneId: null,
      drawingMode: false,
      draftPolygon: [],

      setDrawingMode: (mode) => set({ drawingMode: mode, draftPolygon: [] }),
      addDraftPoint: (point) => set((state) => ({ draftPolygon: [...state.draftPolygon, point] })),
      clearDraftPolygon: () => set({ draftPolygon: [] }),
      finishDraftPolygon: (pageId) => set((state) => {
        if (state.draftPolygon.length < 3) {
          return { drawingMode: false, draftPolygon: [] };
        }
        
        // Calculate bounding box
        const xs = state.draftPolygon.map(p => p.x);
        const ys = state.draftPolygon.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Normalize points to percentages within the bounding box
        const normalizedPoints = state.draftPolygon.map(p => ({
          x: ((p.x - minX) / width) * 100,
          y: ((p.y - minY) / height) * 100
        }));
        
        const newZone: Zone = {
          id: uuidv4(),
          pageId,
          x: minX,
          y: minY,
          width,
          height,
          shape: 'polygon',
          polygonPoints: normalizedPoints,
          color: '#FF4FA3',
          name: 'منطقة حرة',
          interactionType: 'none',
          interactionTypes: [],
          showIcon: false,
          content: {}
        };
        
        return {
          zones: [...state.zones, newZone],
          drawingMode: false,
          draftPolygon: []
        };
      }),

      setActiveGrade: (grade) => set({ activeGrade: grade }),
      setActiveLesson: (lessonId) => set({ activeLessonId: lessonId, activePageId: null }),

      addUnit: (grade, title) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        const newUnit: Unit = { id: uuidv4(), title, lessons: [] };
        return {
          curriculum: { ...state.curriculum, [grade]: [...gradeUnits, newUnit] }
        };
      }),

      updateUnit: (grade, unitId, title) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        return {
          curriculum: {
            ...state.curriculum,
            [grade]: gradeUnits.map(u => u.id === unitId ? { ...u, title } : u)
          }
        };
      }),

      removeUnit: (grade, unitId) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        return {
          curriculum: {
            ...state.curriculum,
            [grade]: gradeUnits.filter(u => u.id !== unitId)
          }
        };
      }),

      addLesson: (grade, unitId, title) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        const newLessonId = uuidv4();
        return {
          curriculum: {
            ...state.curriculum,
            [grade]: gradeUnits.map(u => {
              if (u.id === unitId) {
                return { ...u, lessons: [...u.lessons, { id: newLessonId, title }] };
              }
              return u;
            })
          },
          activeLessonId: newLessonId,
          activePageId: null, // Clear page when switching lesson
        };
      }),

      updateLesson: (grade, unitId, lessonId, updates) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        return {
          curriculum: {
            ...state.curriculum,
            [grade]: gradeUnits.map(u => {
              if (u.id === unitId) {
                return { ...u, lessons: u.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) };
              }
              return u;
            })
          }
        };
      }),

      removeLesson: (grade, unitId, lessonId) => set((state) => {
        const gradeUnits = state.curriculum[grade] || [];
        return {
          curriculum: {
            ...state.curriculum,
            [grade]: gradeUnits.map(u => {
              if (u.id === unitId) {
                return { ...u, lessons: u.lessons.filter(l => l.id !== lessonId) };
              }
              return u;
            })
          }
        };
      }),

      setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),

      addPage: (imageUrl, specificLessonId) => set((state) => {
        const targetLessonId = specificLessonId || state.activeLessonId;
        const newPage: Page = {
          id: uuidv4(),
          imageUrl,
          order: state.pages.filter(p => p.lessonId === targetLessonId).length,
          lessonId: targetLessonId || undefined
        };
        return {
          pages: [...state.pages, newPage],
          activePageId: state.activePageId || newPage.id, // Auto-select if first page
        };
      }),

      updatePage: (pageId, updates) => set((state) => ({
        pages: state.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
      })),

      removePage: (pageId) => set((state) => ({
        pages: state.pages.filter(p => p.id !== pageId),
        zones: state.zones.filter(z => z.pageId !== pageId),
        activePageId: state.activePageId === pageId 
          ? (state.pages.find(p => p.id !== pageId)?.id || null) 
          : state.activePageId
      })),

      setActivePage: (pageId) => set({ activePageId: pageId }),

      addZone: (zoneData) => set((state) => ({
        zones: [...state.zones, { ...zoneData, id: uuidv4() }]
      })),

      updateZone: (id, updates) => set((state) => {
        // Prevent huge base64 strings from crashing localStorage
        const cleanUpdates = { ...updates };
        if (cleanUpdates.content) {
          if (cleanUpdates.content.videoUrl && cleanUpdates.content.videoUrl.startsWith('data:video') && cleanUpdates.content.videoUrl.length > 500000) {
            cleanUpdates.content.videoUrl = '';
            alert("تم إزالة الفيديو القديم لأنه كان يستهلك مساحة الذاكرة بالكامل. يرجى رفع الفيديو من جديد عبر النظام الحديث.");
          }
          if (cleanUpdates.content.audioUrl && cleanUpdates.content.audioUrl.startsWith('data:audio') && cleanUpdates.content.audioUrl.length > 500000) {
            cleanUpdates.content.audioUrl = '';
            alert("تم إزالة الصوت القديم لأنه كان يستهلك مساحة الذاكرة بالكامل. يرجى رفع الصوت من جديد عبر النظام الحديث.");
          }
        }
        return { zones: state.zones.map(z => z.id === id ? { ...z, ...cleanUpdates } : z) };
      }),

      removeZone: (id) => set((state) => ({
        zones: state.zones.filter(z => z.id !== id)
      })),

      exportBook: () => {
        const { curriculum, pages, zones } = get();
        return JSON.stringify({ curriculum, pages, zones });
      },

      importBook: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.pages && data.zones) {
            set({ 
              curriculum: data.curriculum || {}, 
              pages: data.pages, 
              zones: data.zones, 
              activePageId: data.pages[0]?.id || null 
            });
          }
        } catch (e) {
          console.error("Failed to import book data", e);
        }
      }
    }),
    {
      name: 'interactive-book-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['drawingMode', 'draftPolygon'].includes(key))
      ),
    }
  )
);
