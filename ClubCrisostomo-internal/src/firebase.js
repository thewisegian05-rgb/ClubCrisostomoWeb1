import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your exact real Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa6BmyhMJC5g6AdBvfyrzzZtJgtV4QGNE",
  authDomain: "clubcrisostomo.firebaseapp.com",
  projectId: "clubcrisostomo",
  storageBucket: "clubcrisostomo.firebasestorage.app",
  messagingSenderId: "412010443275",
  appId: "1:412010443275:web:4c1b20fa90489f275c8d0e",
  measurementId: "G-16YCELQRGG"
};

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Initialize the Database and Auth
// THESE TWO LINES AT THE BOTTOM FIX THE VITE ERROR!
export const db = getFirestore(app);
export const auth = getAuth(app);