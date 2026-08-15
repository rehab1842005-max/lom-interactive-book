"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useBookStore } from '@/app/store/bookStore';

export default function FirebaseSync() {
  const pathname = usePathname();
  const isTeacher = pathname?.includes('/rehab-elsibai');
  
  // Ref to prevent echo loops when updating Zustand from Firebase
  const isUpdatingFromFirebase = useRef(false);

  useEffect(() => {
    // We store curriculum and zones in main doc, pages in separate docs
    const docRef = doc(db, 'curriculums', 'main');
    let timeoutId: NodeJS.Timeout;
    let unsubStore: () => void;
    let studentPagesUnsub: () => void;

    // 1. ALWAYS listen to Firebase main doc
    const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const localState = useBookStore.getState();
        
        const remoteHasData = Object.keys(data.curriculum || {}).length > 0;
        const localHasData = Object.keys(localState.curriculum || {}).length > 0;
        
        if (!remoteHasData && localHasData) {
          if (isTeacher) {
            setDoc(docRef, {
              curriculum: localState.curriculum || {},
              zones: localState.zones || []
            }, { merge: true });
          }
          return;
        }

        isUpdatingFromFirebase.current = true;
        
        useBookStore.setState({
          curriculum: data.curriculum || {},
          zones: data.zones || []
        });
        
        setTimeout(() => {
          isUpdatingFromFirebase.current = false;
        }, 500);
      }
    });

    // 2. Fetch specific lesson's pages (For BOTH Teacher and Student)
    const fetchLessonPages = (lessonId: string) => {
      if (studentPagesUnsub) studentPagesUnsub();
      console.log('[Sync] Fetching pages for lesson:', lessonId);
      studentPagesUnsub = onSnapshot(doc(db, 'curriculums', `pages_${lessonId}`), (snap) => {
        if (snap.exists()) {
          const lessonPages = snap.data().pages || [];
          const currentState = useBookStore.getState();
          // Merge remote pages for this lesson with local pages for other lessons
          const otherPages = currentState.pages.filter(p => p.lessonId !== lessonId);
          const newPages = [...otherPages, ...lessonPages];
          
          // Only update if there's an actual change to avoid infinite loops
          if (JSON.stringify(currentState.pages) !== JSON.stringify(newPages)) {
            isUpdatingFromFirebase.current = true;
            useBookStore.setState({ pages: newPages });
            setTimeout(() => { isUpdatingFromFirebase.current = false; }, 500);
          }
        }
      });
    };

    // Subscribe to lesson changes
    unsubStore = useBookStore.subscribe((state, prevState) => {
      if (state.activeLessonId !== prevState.activeLessonId && state.activeLessonId) {
        console.log('[Sync] Lesson changed to:', state.activeLessonId);
        fetchLessonPages(state.activeLessonId);
      }
      
        // 3. If Teacher, push local changes UP
      if (isTeacher && !isUpdatingFromFirebase.current) {
        clearTimeout(timeoutId);
        
        const saveToFirebase = async () => {
          const cleanPages = (state.pages || []).filter(p => !p.imageUrl?.includes('via.placeholder.com'));
          const cleanZones = (state.zones || []).map(z => {
            const newZ = { ...z, content: { ...z.content } };
            if (newZ.content.videoUrl && newZ.content.videoUrl.length > 100000) newZ.content.videoUrl = "";
            if (newZ.content.audioUrl && newZ.content.audioUrl.length > 100000) newZ.content.audioUrl = "";
            return newZ;
          });

          const dataToSave = {
            curriculum: state.curriculum || {},
            zones: cleanZones
          };
          
          try {
            await setDoc(docRef, dataToSave, { merge: true });
            const allLessonIds = Object.values(state.curriculum || {}).flatMap(units => (units as any[]).flatMap(u => u.lessons.map((l:any) => l.id)));
            for (const lId of allLessonIds) {
              const lPages = cleanPages.filter(p => p.lessonId === lId);
              await setDoc(doc(db, 'curriculums', `pages_${lId}`), { pages: lPages }, { merge: true });
            }
            const unassignedPages = cleanPages.filter(p => !p.lessonId);
            if (unassignedPages.length > 0) {
              await setDoc(doc(db, 'curriculums', `pages_unassigned`), { pages: unassignedPages }, { merge: true });
            }
          } catch (e) {
            console.error("Firebase sync error:", e);
          }
        };

        // Auto save after 1.5s
        timeoutId = setTimeout(saveToFirebase, 1500);
        
        // Expose to window so we can force save if needed
        (window as any).forceFirebaseSync = saveToFirebase;
      }
    });

    // Trigger initial load if activeLessonId is already set
    const initialLesson = useBookStore.getState().activeLessonId;
    if (initialLesson) {
      console.log('[Sync] Initial lesson load:', initialLesson);
      fetchLessonPages(initialLesson);
    }


    
    return () => {
      unsubscribeSnapshot();
      if (unsubStore) unsubStore();
      if (studentPagesUnsub) studentPagesUnsub();
      // If there's a pending save, execute it immediately before unmounting
      if (timeoutId && isTeacher) {
        clearTimeout(timeoutId);
        if ((window as any).forceFirebaseSync) {
          (window as any).forceFirebaseSync();
        }
      }
    };
  }, [isTeacher]);

  return null; // This component has no UI, it works silently in the background
}
