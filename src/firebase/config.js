import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDh8G_YeZBaXODPXOZeHtGk2smHMt-2n50",
  authDomain: "miniblog-83d4f.firebaseapp.com",
  projectId: "miniblog-83d4f",
  storageBucket: "miniblog-83d4f.firebasestorage.app",
  messagingSenderId: "274304454579",
  appId: "1:274304454579:web:63991d16c126f0e91605c6"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };