<<<<<<< HEAD
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
=======
// fileName: App.js
import React from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase"; // firebase.js の場所に注意
import Line from "./components/Line";   // ./ の後にフォルダ名を追加
import SignIn from "./components/SignIn";
function App() {
  // ログイン状態を監視（react-firebase-hooksを使用）
  const [user, loading, error] = useAuthState(auth);

  // 読み込み中の表示
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>初期化エラー: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/* ログインしていればメイン画面(Line)、そうでなければログイン画面(SignIn)を表示 */}
      {user ? <Line /> : <SignIn />}
>>>>>>> oceanTest
    </div>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> oceanTest
