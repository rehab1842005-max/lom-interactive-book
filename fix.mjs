import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  projectId: "rehab-science-book",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
  const mainDocRef = doc(db, 'curriculums', 'main');
  const mainSnap = await getDoc(mainDocRef);
  const data = mainSnap.data();
  
  if (!data || !data.zones) return console.log("No zones found");
  
  let modified = false;
  data.zones.forEach((z) => {
    if (z.name === '1' || z.name.includes('1')) {
      if (z.content && z.content.questions) {
        const oldLen = z.content.questions.length;
        // Remove questions that are just "---"
        z.content.questions = z.content.questions.filter(q => q.title !== '---' && !/^[\-\*]{3,}$/.test(q.title));
        if (z.content.questions.length !== oldLen) {
          console.log(`Cleaned zone ${z.id} (${z.name}) from ${oldLen} to ${z.content.questions.length} questions`);
          modified = true;
        }
      }
    }
  });

  if (modified) {
    await setDoc(mainDocRef, data, { merge: true });
    console.log("Saved to Firebase successfully");
  } else {
    console.log("No zones needed cleaning");
  }
  
  process.exit(0);
}

fix();
