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
          img: msg.type === "shallow" ? "/fish/aji.png" : "/fish/ankou.png",
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          direction: Math.random() < 0.5 ? -1 : 1,
          speed: 2,
          type: msg.type,
          mode: "normal",
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

  function handleRemoveFish(id) {
    setFishes(prev => prev.filter(f => f.id !== id));
  }

  function handleModeChange(id, newMode) {
    setFishes(prev =>
      prev.map(f => (f.id === id ? { ...f, mode: newMode } : f))
    );
  }

  function updateFishes() {
    if (isUpdating) return;
    setIsUpdating(true);

    setFishes(prev => prev.map(f => ({ ...f, mode: "exit" })));

    setTimeout(() => {
      const base = allFishes.length > 0 ? allFishes : fishes;

      const newOnes = base
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(f => {
          const dir = Math.random() < 0.5 ? 1 : -1;

          const startX = dir === 1 ? -400 : window.innerWidth + 400;
          const startY = Math.random() * window.innerHeight;

          return {
            ...f,
            id: uuidv4(),
            direction: dir,
            x: startX,
            y: startY,
            mode: "enter",
          };
        });

      setFishes(prev => [...prev, ...newOnes]);
    }, 300);

    setTimeout(() => setIsUpdating(false), 1000);
  }

  return (
    <div>
      <button onClick={updateFishes} disabled={isUpdating}>
        魚を更新する
      </button>

      <div className="ocean">
        {fishes.map(fish => (
          <Fish
            key={fish.id}
            fish={fish}
            onRemove={handleRemoveFish}
            onModeChange={handleModeChange}
          />
        ))}
      </div>
    </div>
  );
}