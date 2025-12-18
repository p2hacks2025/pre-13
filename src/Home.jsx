import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import Fish from "./Fish";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [fishes, setFishes] = useState([]);

  useEffect(() => {
    const q = collection(db, "messages");
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });//-  text, type, sentiment, uid, createdAtなどが入ってる
  }, []);

  //messagesが変わったときだけ魚を生成する
  useEffect(() => {
    const generated = messages.map(msg => ({
      id: uuidv4(), // ← ここでユニークIDを生成
      img: msg.type === "shallow" ? "/fish/aji.png" : "/fish/ankou.png",
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      direction: 1,
      speed: 2,
      type: msg.type
    }));
    setFishes(generated);
  }, [messages]);

  return (
    <div className="ocean">
      {fishes.map(fish => (
        <Fish key={fish.id} fish={fish} />
      ))}
    </div>
  );
}