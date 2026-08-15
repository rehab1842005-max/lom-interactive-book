import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  projectId: "rehab-science-book",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const mainDocRef = doc(db, 'curriculums', 'main');
  const mainSnap = await getDoc(mainDocRef);
  const data = mainSnap.data();
  
  if (!data || !data.zones) return console.log("No zones found");
  
  console.log("Total zones:", data.zones.length);
  const zone1 = data.zones.filter(z => z.name === '1' || z.name.includes('1'));
  
  console.log("Zones named 1:", zone1.length);
  zone1.forEach((z, i) => {
    console.log(`\nZone [${i}]: id=${z.id}, pageId=${z.pageId}, name=${z.name}`);
    console.log(`Questions count:`, z.content?.questions?.length || 0);
    if (z.content?.questions) {
      z.content.questions.forEach((q, j) => {
        console.log(`  Q${j+1}: ${q.title}`);
      });
    }
  });

  process.exit(0);
}

check();
