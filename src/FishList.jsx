/*import Fish from "./Fish";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";

function convertPostToFish(post) {
  return {
    id: uuidv4(),   // ← post.id は使わない
    img: "/fish/aji.png",
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speed: Math.random() * 0.3 + 0.5,
    angle: (Math.random() * 90) * (Math.PI / 180),
    direction: Math.random() > 0.5 ? 1 : -1,
    type: post.type
  };
}

export default function FishList({ posts }) {
  const [fishes, setFishes] = useState([]);

  // ✅ posts が変わったときだけ魚を生成する
  useEffect(() => {
    const generated = posts.map(post => convertPostToFish(post));
    setFishes(generated);
  }, [posts]);

  return (
    <>
      {fishes.map(fish => (
        <Fish key={fish.id} fish={fish} />
      ))}
    </>
  );
}*/