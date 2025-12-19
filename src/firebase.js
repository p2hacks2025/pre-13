// fileName: firebase.js
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyDsQiv-iCyMdlF9wnu724GoBZq7FVAS3vA",
  authDomain: "line-clone-ebe25.firebaseapp.com",
  projectId: "line-clone-ebe25",
  storageBucket: "line-clone-ebe25.firebasestorage.app",
  messagingSenderId: "773793154608",
  appId: "1:773793154608:web:bd8285631ca3d918e8cff5"
};

// 重複初期化を防ぐ
const firebaseApp = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

const db = firebaseApp.firestore();
const auth = firebaseApp.auth(); // ここを firebaseApp.auth() に
const storage = firebaseApp.storage();

export { db, auth, storage };