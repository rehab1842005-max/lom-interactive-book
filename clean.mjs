import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  projectId: "rehab-science-book",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clean() {
  const mainDocRef = doc(db, 'curriculums', 'main');
  const mainSnap = await getDoc(mainDocRef);
  const data = mainSnap.data();
  
  if (!data || !data.zones) return console.log("No zones found");
  
  let modified = false;
  data.zones.forEach((z) => {
    if (!isNaN(Number(z.name)) && Number(z.name) > 0) {
      if (z.content && z.content.videoUrl) {
        console.log(`Cleaning videoUrl from zone ${z.name} (was: ${z.content.videoUrl.substring(0,30)})`);
        z.content.videoUrl = "";
        modified = true;
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

clean();
