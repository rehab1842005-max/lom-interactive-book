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
  const initialLoadMain = useRef(false);
  const initialLoadPages = useRef<{ [lessonId: string]: boolean }>({});

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
        
        // If teacher has already loaded the app, DO NOT let Firebase overwrite their active session!
        if (isTeacher && initialLoadMain.current) {
          return;
        }
        initialLoadMain.current = true;
        
        const remoteHasData = Object.keys(data.curriculum || {}).length > 0;
        const localHasData = Object.keys(localState.curriculum || {}).length > 0;
        
        if (!remoteHasData && localHasData) {
          if (isTeacher) {
            setDoc(docRef, {
              curriculum: localState.curriculum || {},
              zones: localState.zones || [],
              games: localState.games || []
            }, { merge: true });
          }
          return;
        }

        isUpdatingFromFirebase.current = true;
        
        const localZones = localState.zones || [];
        const remoteZones = data.zones || [];
        const mergedZones = remoteZones.map((rz: any) => {
          const lz = localZones.find(z => z.id === rz.id);
          if (lz && lz.content && lz.content.questions && lz.content.questions.length > 0) {
            if (!rz.content?.questions || rz.content.questions.length < lz.content.questions.length) {
              return {
                ...rz,
                content: {
                  ...rz.content,
                  questions: lz.content.questions
                }
              };
            }
          }
          return rz;
        });

        // Ensure newly created local zones that haven't reached Firebase yet aren't wiped out!
        localZones.forEach((lz: any) => {
          if (!mergedZones.some((mz: any) => mz.id === lz.id)) {
            mergedZones.push(lz);
          }
        });

        if (JSON.stringify(localState.curriculum) !== JSON.stringify(data.curriculum) || 
            JSON.stringify(localState.zones) !== JSON.stringify(mergedZones) ||
            JSON.stringify(localState.games) !== JSON.stringify(data.games || [])) {
          useBookStore.setState({
            curriculum: data.curriculum || {},
            zones: mergedZones.length > 0 ? mergedZones : localZones,
            games: data.games || []
          });
          
          setTimeout(() => {
            isUpdatingFromFirebase.current = false;
          }, 500);
        }
      }
    });

    // 2. Fetch specific lesson's pages (For BOTH Teacher and Student)
    const fetchLessonPages = (lessonId: string) => {
      if (studentPagesUnsub) studentPagesUnsub();
      console.log('[Sync] Fetching pages for lesson:', lessonId);
      studentPagesUnsub = onSnapshot(doc(db, 'curriculums', `pages_${lessonId}`), (snap) => {
        if (snap.exists()) {
          // If teacher has already loaded this lesson, DO NOT overwrite!
          if (isTeacher && initialLoadPages.current[lessonId]) {
            return;
          }
          initialLoadPages.current[lessonId] = true;

          const lessonPages = snap.data().pages || [];
          const currentState = useBookStore.getState();
          
          // Preserve local page questions if local has more questions (protects against stale remote data)
          const cleanLessonPages = lessonPages.map((rp: any) => {
            const lp = currentState.pages.find(p => p.id === rp.id);
            if (lp && lp.questions && lp.questions.length > 0) {
              if (!rp.questions || rp.questions.length < lp.questions.length) {
                return { ...rp, questions: lp.questions };
              }
            }
            return rp;
          });

          // Ensure newly created local pages that haven't reached Firebase yet aren't wiped out!
          currentState.pages.filter(p => p.lessonId === lessonId).forEach(lp => {
            if (!cleanLessonPages.some((rp: any) => rp.id === lp.id)) {
              cleanLessonPages.push(lp);
            }
          });

          // Merge remote pages for this lesson with local pages for other lessons
          const otherPages = currentState.pages.filter(p => p.lessonId !== lessonId);
          const newPages = [...otherPages, ...cleanLessonPages];
          
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
          const currentState = useBookStore.getState();
          const cleanPages = (currentState.pages || []).filter(p => !p.imageUrl?.includes('via.placeholder.com'));
          const cleanZones = (currentState.zones || []).map(z => {
            const newZ = { ...z, content: { ...z.content } };
            if (newZ.content.videoUrl && newZ.content.videoUrl.length > 100000) newZ.content.videoUrl = "";
            if (newZ.content.audioUrl && newZ.content.audioUrl.length > 100000) newZ.content.audioUrl = "";
            return newZ;
          });

          const rawDataToSave = {
            curriculum: currentState.curriculum || {},
            zones: cleanZones,
            games: currentState.games || []
          };
          const dataToSave = JSON.parse(JSON.stringify(rawDataToSave));
          
          try {
            await setDoc(docRef, dataToSave, { merge: true });
            const allLessonIds = Object.values(state.curriculum || {}).flatMap(units => (units as any[]).flatMap(u => u.lessons.map((l:any) => l.id)));
            for (const lId of allLessonIds) {
              const lPages = cleanPages.filter(p => p.lessonId === lId);
              const safePages = JSON.parse(JSON.stringify({ pages: lPages }));
              await setDoc(doc(db, 'curriculums', `pages_${lId}`), safePages, { merge: true });
            }
            const unassignedPages = cleanPages.filter(p => !p.lessonId);
            if (unassignedPages.length > 0) {
              const safeUnassigned = JSON.parse(JSON.stringify({ pages: unassignedPages }));
              await setDoc(doc(db, 'curriculums', `pages_unassigned`), safeUnassigned, { merge: true });
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
