import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  projectId: "rehab-science-book",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  const pid = "51846ba8-a9bc-4f92-839f-08feda82b46d";
  // The pages are stored in a document per lesson. Wait, the lesson ID is what we need, not the page ID.
  // We can just fetch all page documents from curriculums collection.
  const curriculumsRef = doc(db, 'curriculums', 'main');
  const mainSnap = await getDoc(curriculumsRef);
  const data = mainSnap.data();
  
  let lessonId = null;
  for (const [unitId, lessons] of Object.entries(data.curriculum || {})) {
    for (const l of lessons) {
      // we need to find which lesson contains page 5184...
      // wait, pages have lessonId. but we don't have all pages.
      // let's just fetch all documents starting with pages_
    }
  }

  // Quick hack: just fetch pages_ for all lessons
  const allLessonIds = Object.values(data.curriculum || {}).flatMap(units => units.flatMap(u => u.lessons.map(l => l.id)));
  for (const lId of allLessonIds) {
    const pDoc = await getDoc(doc(db, 'curriculums', `pages_${lId}`));
    if (pDoc.exists()) {
      const p = (pDoc.data().pages || []).find(p => p.id === pid);
      if (p) {
        console.log(`\nFound Page!`);
        console.log(`pageVideoUrl:`, p.pageVideoUrl);
        console.log(`videoSplitInterval:`, p.videoSplitInterval);
        break;
      }
    }
  }

  process.exit(0);
}

inspect();
