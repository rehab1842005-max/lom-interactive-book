import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  authDomain: "rehab-science-book.firebaseapp.com",
  projectId: "rehab-science-book",
  storageBucket: "rehab-science-book.firebasestorage.app",
  messagingSenderId: "179446131110",
  appId: "1:179446131110:web:0df1812dfca237ccae8767",
  measurementId: "G-N5DJWTSWG3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const mainRef = doc(db, 'curriculums', 'main');
  const mainSnap = await getDoc(mainRef);
  
  if (mainSnap.exists()) {
    const data = mainSnap.data();
    console.log("Main Curriculum Data:");
    const curric = data.curriculum || {};
    
    // Extract lesson IDs
    const lessonIds = Object.values(curric).flatMap(units => 
      (units).flatMap(u => u.lessons.map(l => ({ id: l.id, title: l.title })))
    );
    
    console.log("Lessons found in curriculum:", lessonIds);
    
    for (const l of lessonIds) {
      console.log(`\nChecking pages for lesson ${l.id} (${l.title})...`);
      const pageSnap = await getDoc(doc(db, 'curriculums', `pages_${l.id}`));
      if (pageSnap.exists()) {
        const pData = pageSnap.data();
        console.log(`  Found pages doc! Pages count: ${pData.pages?.length || 0}`);
        if (pData.pages?.length > 0) {
          console.log(`  First page lessonId:`, pData.pages[0].lessonId);
        }
      } else {
        console.log(`  Pages doc NOT FOUND!`);
      }
    }
  } else {
    console.log("Main doc not found!");
  }
  
  // also check pages_unassigned
  const unSnap = await getDoc(doc(db, 'curriculums', 'pages_unassigned'));
  if (unSnap.exists()) {
    console.log("\nFound pages_unassigned doc! Pages count:", unSnap.data().pages?.length);
  }
  
  process.exit(0);
}

check();
