"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
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
    const isTeacherDevice = typeof window !== 'undefined' ? localStorage.getItem('isTeacherDevice') === 'true' : false;

    // 1. ALWAYS listen to Firebase main doc
    const unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const localState = useBookStore.getState();
        const localHasData = Object.keys(localState.curriculum || {}).length > 0;
        
        // If this is the teacher's device, DO NOT let Firebase overwrite their local data!
        // The teacher's local device is the source of truth.
        if (isTeacherDevice) {
          if (localHasData) {
            // Push to Firebase just in case it's missing there
            setDoc(docRef, {
              curriculum: localState.curriculum || {},
              zones: localState.zones || [],
              games: localState.games || []
            }, { merge: true }).catch(() => {});
            return; // EXIT! Do not overwrite local!
          }
          // If local has no data (e.g. new device), allow it to load once
          if (initialLoadMain.current) return;
        }
        
        initialLoadMain.current = true;
        
        const remoteHasData = Object.keys(data.curriculum || {}).length > 0;

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
      
      const q = query(collection(db, 'pages'), where('lessonId', '==', lessonId));
      
      studentPagesUnsub = onSnapshot(q, (snapshot: any) => {
        if (!snapshot.empty) {
          const lessonPages = snapshot.docs.map((doc: any) => doc.data());
          const currentState = useBookStore.getState();
          const localLessonPages = currentState.pages.filter(p => p.lessonId === lessonId);
          
          // If this is the teacher's device, DO NOT let Firebase overwrite their local pages!
          if (isTeacherDevice) {
            if (localLessonPages.length > 0) {
              return; // EXIT! The local pages are the source of truth for the teacher.
            }
            if (initialLoadPages.current[lessonId]) return;
          }
          
          initialLoadPages.current[lessonId] = true;

          // Preserve local page questions if local has more questions (protects against stale remote data)
          const cleanLessonPages = lessonPages.map((rp: any) => {
            const lp = currentState.pages.find(p => p.id === rp.id);
            if (lp && lp.questions && rp.questions && lp.questions.length > rp.questions.length) {
              return { ...rp, questions: lp.questions };
            }
            return rp;
          });

          // Merge fetched pages with existing pages from OTHER lessons
          const otherPages = currentState.pages.filter(p => p.lessonId !== lessonId);
          const newPages = [...otherPages, ...cleanLessonPages];
          
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
            // Save each page individually to bypass 1MB Firestore limit
            for (const p of cleanPages) {
              if (!p.id) continue;
              const safePage = JSON.parse(JSON.stringify(p));
              await setDoc(doc(db, 'pages', p.id), safePage, { merge: true });
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
