import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeFirestore, collection, query, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4kEtPVKkAQsTL1aIFEHQyu1j1DBqrqNw",
  authDomain: "phishing-forensics.firebaseapp.com",
  projectId: "phishing-forensics",
  storageBucket: "phishing-forensics.firebasestorage.app",
  messagingSenderId: "518550743449",
  appId: "1:518550743449:web:56ef6f36fb582191654b08",
  measurementId: "G-50749XGCTJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export { app, auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, query, orderBy, onSnapshot, limit, getDocs };
