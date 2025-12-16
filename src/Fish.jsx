import { useState, useEffect } from "react";

export default function Fish({ fish }) {
    const [x, setX] = useState(fish.x);//魚の位置を管理する状態
    const [y, setY] = useState(fish.y);//魚の位置を管理する状態
    const [direction, setDirection] = useState(fish.direction);//魚の進行方向を管理する状態
    const [angle, setAngle] = useState(0);//魚の傾きを管理する状態
    const [speed, setSpeed] = useState(fish.speed);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() < 0.01) {
                // 1% の確率で角度を変える
                const newAngle = (Math.random() * 20 - 10) * (Math.PI / 180);
                setAngle(newAngle);
            }
            if (Math.random() < 0.01) {
                const newSpeed = speed * (0.8 + Math.random() * 0.4);
                setSpeed(newSpeed);
            }
            setX(prev => {
                const nextX = prev + speed * Math.cos(angle) * direction;//現在位置 + 速度 ×　角度 × 向き

                // 右端に到達したら反転
                if (nextX > window.innerWidth - 80) {
                    setDirection(-1);
                    return window.innerWidth - 80;//魚の幅を考慮して調整
                }

                // 左端に到達したら反転
                if (nextX < 0) {
                    setDirection(1);
                    return 0;
                }

                return nextX;
            });
            // y方向にも少し動かす（自然な揺れ）
            setY(prevY => {
                const nextY = prevY + speed * Math.sin(angle);

                // 上下に行きすぎないように制限
                if (nextY < 0) return 0;
                if (nextY > window.innerHeight - 80) return window.innerHeight - 80;

                return nextY;
            });

        }, 30);

        return () => clearInterval(interval);
    }, [direction, angle, fish.speed]);

    return (
        <img
            src={fish.img}
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: "80px",
                transform: direction === -1 ? "scaleX(1)" : "scaleX(-1)",//向きに応じて魚の画像を反転
                transition: "transform 0.5s"//回転の速さ
            }}
        />
    );
}