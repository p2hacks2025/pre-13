import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage"; // ★1. これを追加（Storageを使えるようにする）

const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyDsQiv-iCyMdlF9wnu724GoBZq7FVAS3vA",
  authDomain: "line-clone-ebe25.firebaseapp.com",
  projectId: "line-clone-ebe25",
  storageBucket: "line-clone-ebe25.firebasestorage.app", // 正しく設定されています！
  messagingSenderId: "773793154608",
  appId: "1:773793154608:web:bd8285631ca3d918e8cff5"
});

const db = firebaseApp.firestore();
const auth = firebase.auth();
const storage = firebaseApp.storage(); // ★2. これを追加（インスタンス化）

// storage を追加してエクスポート
export { db, auth, storage };