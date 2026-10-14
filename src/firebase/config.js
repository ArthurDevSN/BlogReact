import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDh8G_YeZBaXODPXOZeHtGk2smHMt-2n50",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "miniblog-83d4f.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "miniblog-83d4f",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "miniblog-83d4f.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "274304454579",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:274304454579:web:63991d16c126f0e91605c6"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };
