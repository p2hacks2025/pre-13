import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import FishTank from "./FishTank"; 
import { SEA_TYPES } from "../utils/constants";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [allFishes, setAllFishes] = useState([]);
  const [fishes, setFishes] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeep, setIsDeep] = useState(false); // 背景フラグ

  useEffect(() => {
    const q = collection(db, "messages");
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
  }, []);

  useEffect(() => {
    setAllFishes(prev => {
      const newOnes = messages
        .filter(msg => !prev.some(f => f.msgId === msg.id))
        .map(msg => ({
          msgId: msg.id,
          id: uuidv4(),
          visualFishId: msg.type === SEA_TYPES.SHALLOW ? "sakana1" : "sakana2",
          x: 10 + Math.random() * 80,
          y: 20 + Math.random() * 60,
          direction: Math.random() < 0.5 ? -1 : 1,
          speed: 0.1 + Math.random() * 0.1,
          sentiment: msg.type,
          aiTitle: msg.aiTitle
        }));
      return [...prev, ...newOnes];
    });
  }, [messages]);

  useEffect(() => {
    if (fishes.length === 0 && allFishes.length > 0) {
      const shuffled = [...allFishes].sort(() => Math.random() - 0.5);
      setFishes(shuffled.slice(0, 5));
    }
  }, [allFishes]);

  function updateFishes() {
    if (isUpdating) return;
    setIsUpdating(true);
    
    // ボタンクリックで背景を切り替える
    setIsDeep(!isDeep);

    const base = allFishes.length > 0 ? allFishes : fishes;
    const nextOnes = base
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(f => ({
        ...f,
        id: uuidv4(),
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 60,
      }));
    setFishes(nextOnes);
    setTimeout(() => setIsUpdating(false), 500);
  }

  return (
    // background: linear-gradient... を削除。これでFishTankの画像が見える。
    <div className="app-container">
      <button 
        onClick={updateFishes} 
        disabled={isUpdating}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}
      >
        背景と魚を更新
      </button>

      <FishTank 
        messages={fishes} 
        onFishClick={(f) => console.log(f)} 
        showTitles={true}
        isDeep={isDeep} 
      />
    </div>
  );
}
