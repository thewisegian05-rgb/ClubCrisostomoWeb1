// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 

// --- NEW: ADD FIRESTORE AUTHENTICATION IMPORTS ---
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa6BmyhMJC5g6AdBvfyrzzZtJgtV4QGNE",
  authDomain: "clubcrisostomo.firebaseapp.com",
  projectId: "clubcrisostomo",
  storageBucket: "clubcrisostomo.firebasestorage.app",
  messagingSenderId: "412010443275",
  appId: "1:412010443275:web:4c1b20fa90489f275c8d0e",
  measurementId: "G-16YCELQRGG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); 

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app); 

// --- NEW: INITIALIZE AND EXPORT AUTH & GOOGLE PROVIDER ---
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();