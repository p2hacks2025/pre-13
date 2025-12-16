import Fish from "./Fish";

function convertPostToFish(post) {
  return {
    id: post.id,
    img: "/fish/aji.png", // とりあえず仮の画像
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speed: Math.random() * 0.8 + 0.5, // 0.3〜0.8 のゆっくり速度
    angle: (Math.random() * 90) * (Math.PI / 180), // 0〜20° をラジアンに変換
    direction: Math.random() > 0.5 ? 1 : -1
  };
}

export default function FishList({ posts }) {
  const fishes = posts.map(post => convertPostToFish(post));

  return (
    <>
      {fishes.map(fish => (
        <Fish key={fish.id} fish={fish} />
      ))}
    </>
  );
}