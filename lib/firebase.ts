import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl-P5Gcz1E0YMm_tJRGn3wi_E5OGBz_-Q",
  authDomain: "rehab-science-book.firebaseapp.com",
  projectId: "rehab-science-book",
  storageBucket: "rehab-science-book.firebasestorage.app",
  messagingSenderId: "179446131110",
  appId: "1:179446131110:web:0df1812dfca237ccae8767",
  measurementId: "G-N5DJWTSWG3"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const db = getFirestore(app);

export { app, storage, db };
