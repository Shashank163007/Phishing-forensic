// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4kEtPVKkAQsTL1aIFEHQyu1j1DBqrqNw",
  authDomain: "phishing-forensics.firebaseapp.com",
  projectId: "phishing-forensics",
  storageBucket: "phishing-forensics.firebasestorage.app",
  messagingSenderId: "518550743449",
  appId: "1:518550743449:web:56ef6f36fb582191654b08",
  measurementId: "G-50749XGCTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithRedirect, getRedirectResult, collection, addDoc, getDocs, query, orderBy, where };
