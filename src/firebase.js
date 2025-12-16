import { initializeApp } from "firebase/app";//firebase/app";
import { getFirestore } from "firebase/firestore";//firebase/firestore";
import { getAuth } from "firebase/auth";//firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsQiv-iCyMdlF9wnu724GoBZq7FVAS3vA",
  authDomain: "line-clone-ebe25.firebaseapp.com",
  projectId: "line-clone-ebe25",
  storageBucket: "line-clone-ebe25.firebasestorage.app",
  messagingSenderId: "773793154608",
  appId: "1:773793154608:web:bd8285631ca3d918e8cff5"
};// line web app's Firebase configuration

const app = initializeApp(firebaseConfig);// Initialize Firebase

export const db = getFirestore(app);// Initialize Firestore
export const auth = getAuth(app);// Initialize Firebase Authentication