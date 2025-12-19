import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import Fish from "./Fish";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [allFishes, setAllFishes] = useState([]);
  const [fishes, setFishes] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Firestore監視
  useEffect(() => {
    const q = collection(db, "messages");
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
  }, []);

  // 新規メッセージから魚データを生成
  useEffect(() => {
    setAllFishes(prev => {
      const newOnes = messages
        .filter(msg => !prev.some(f => f.msgId === msg.id))
        .map(msg => ({
          msgId: msg.id,
          id: uuidv4(),
          img: msg.type === "shallow" ? "/fish/aji.png" : "/fish/ankou.png",
          // 初期位置が重なりにくいように散らす
          x: 10 + Math.random() * 80,
          y: 15 + Math.random() * 70,
          direction: Math.random() < 0.5 ? -1 : 1,
          speed: 0.1 + Math.random() * 0.1, // 自然なスピード
          type: msg.type,
          mode: "normal",
          aiTitle: msg.aiTitle
        }));
      return [...prev, ...newOnes];
    });
  }, [messages]);

  // 初回表示
  useEffect(() => {
    if (fishes.length === 0 && allFishes.length > 0) {
      const shuffled = [...allFishes].sort(() => Math.random() - 0.5);
      setFishes(shuffled.slice(0, 5));
    }
  }, [allFishes]);

  // 魚の更新（入れ替え）
  function updateFishes() {
    if (isUpdating) return;
    setIsUpdating(true);

    // 既存の魚を退場させる
    setFishes(prev => prev.map(f => ({ ...f, mode: "exit" })));

    setTimeout(() => {
      const base = allFishes.length > 0 ? allFishes : fishes;
      const nextOnes = base
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(f => ({
          ...f,
          id: uuidv4(),
          direction: Math.random() < 0.5 ? 1 : -1,
          x: Math.random() < 0.5 ? -10 : 110, // 画面外から登場
          y: 10 + Math.random() * 80,
          mode: "enter",
        }));
      setFishes(nextOnes);
    }, 500);

    setTimeout(() => setIsUpdating(false), 1500);
  }

  return (
    <div className="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', background: 'linear-gradient(#e0f7fa, #80deea)', overflow: 'hidden' }}>
      <button 
        onClick={updateFishes} 
        disabled={isUpdating}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}
      >
        魚を更新する
      </button>

      <div className="ocean" style={{ width: '100%', height: '100%' }}>
        {fishes.map(fish => (
          <Fish
            key={fish.id}
            initialData={fish}
            allFishes={fishes} // 他の魚の位置を参照するために渡す
          />
        ))}
      </div>
    </div>
  );
}