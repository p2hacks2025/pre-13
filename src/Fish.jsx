import { useState, useEffect } from "react";
import "./App.css";

export default function Fish({ fish }) {
    const [x, setX] = useState(fish.x);// 魚の現在のX座標
    const [y, setY] = useState(fish.y);// 魚の現在のY座標
    const [direction, setDirection] = useState(fish.direction); // 1: 右向き, -1: 左向き
    const [angle, setAngle] = useState(0); // 魚の進行方向の角度
    const [speed, setSpeed] = useState(fish.speed); // 魚の速度
    const [targetAngle, setTargetAngle] = useState(0); // 次に向かいたい目標の角度
    const [targetSpeed, setTargetSpeed] = useState(speed);// 次に向かいたい目標の速度

    const [baseEffect, setBaseEffect] = useState(null); // 魚の種類に応じた基本エフェクト
    const [activeEffect, setActiveEffect] = useState(null); // クリック時に一時的に表示するエフェクト

    // type に応じてタッチのエフェクトを決める
    useEffect(() => {
        if (fish.type === "deep") {
            setBaseEffect("gloomy"); //一つのタッチエフェクト
        } else if (fish.type === "shallow") {
            const shallowEffects = ["sparkle", "stars", "particles"]; //ランダムに3つのタッチエフェクト
            const randomEffect = shallowEffects[Math.floor(Math.random() * shallowEffects.length)];
            setBaseEffect(randomEffect);
        }
    }, [fish.type]); // fish.type が変わったときに実行

    function handleClick() {
        setActiveEffect(baseEffect); // 基本エフェクトをアクティブにする
        setTimeout(() => setActiveEffect(null), 600); // 0.6秒後にエフェクトを消す
    } //クリック・タッチ時のエフェクト処理

    function spawnFairyParticle(color) {
        const fishEl = document.querySelector(`#fish-${fish.id}`); //id を使って魚の要素を取得
        if (!fishEl) return;

        const rect = fishEl.getBoundingClientRect(); // 魚の位置とサイズを取得

        const baseX = rect.left + rect.width / 2; // 魚のXの中心位置
        const baseY = rect.top + rect.height / 2; // 魚のyの中心位置

        const startX = baseX + (Math.random() * 30 - 15); // 魚の中心からx軸から少しランダムにずらす
        const startY = baseY + (Math.random() * 30 - 15); // 魚の中心からy軸から少しランダムにずらす

        const dx = Math.random() * 20 - 10; // パーティクルのx軸方向の移動量
        const dy = Math.random() * 12 - 6; // パーティクルのy軸方向の移動量

        const particle = document.createElement("div");
        particle.className = "fairy-particle";
        particle.style.background = color;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);
        particle.style.zIndex = "300";

        const ocean = document.querySelector(".ocean"); // 魚の親要素である ocean を取得
        ocean.appendChild(particle); // ocean に漂っているキラキラを追加

        setTimeout(() => particle.remove(), 180); // 0.18秒後に漂っているキラキラを削除
    }

    // 魚の動き
    useEffect(() => {
        const interval = setInterval(() => {

            let newAngle = angle;// ローカル変数で新しい angle を計算
            let newSpeed = speed;// ローカル変数で新しい speed を計算

            const maxAngle = 5 * (Math.PI / 180);// 最大角度を5度に制限

            //ランダムに次に向かいたい目標の角度を決める（±5°）
            if (Math.random() < 0.01) {// 1% の確率で新しい目標角度を決定
                const randomDeg = (Math.random() * 10 - 5); // -5〜+5
                const newTarget = randomDeg * (Math.PI / 180);
                setTargetAngle(newTarget);
            }

            //angle を targetAngle に向かってゆっくり（1秒くらい）近づける
            const angleLerpSpeed = 0.05;
            newAngle = newAngle + (targetAngle - newAngle) * angleLerpSpeed;
            newAngle = Math.max(-maxAngle, Math.min(maxAngle, newAngle));

            //ランダムに次に向かいたい目標の速度を決める（0.8〜1.4）
            if (Math.random() < 0.01) {
                const newTarget = 0.8 + Math.random() * 0.6;
                setTargetSpeed(newTarget);
            }

            //speed を targetSpeed に向かってゆっくり近づける
            const speedLerp = 0.03;
            newSpeed = newSpeed + (targetSpeed - newSpeed) * speedLerp;

            //X方向の移動
            setX(prev => {
                const nextX = prev + newSpeed * Math.cos(newAngle) * direction;

                if (nextX > window.innerWidth - 80) {
                    setDirection(-1);
                    newAngle = -newAngle;
                    return window.innerWidth - 80;
                }// 画面右端に到達したら左向きに反転

                if (nextX < 0) {
                    setDirection(1);
                    newAngle = -newAngle;
                    return 0;
                }// 画面左端に到達したら右向きに反転

                return nextX;
            });

            //Y方向の移動
            setY(prevY => {
                const nextY = prevY + newSpeed * Math.sin(newAngle);
                if (nextY < 0) return 0;
                if (nextY > window.innerHeight - 80) return window.innerHeight - 80;
                return nextY;
            });

            //最後に state を更新
            setAngle(newAngle);
            setSpeed(newSpeed);

        }, 30);

        return () => clearInterval(interval);
    }, [direction, angle, speed, targetAngle, targetSpeed]);

    return (
        <>
            {/*ここに id を付けるのが最重要 */}
            <div
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                }}
            >
                <div
                    style={{
                        position: "relative",   // ← これが z-index の基準になる
                        width: "80px",
                        height: "80px",
                    }}
                >
                    {/* 透明ボタン */}
                    <div
                        onClick={handleClick}
                        onTouchStart={handleClick}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            zIndex: 20,
                            background: "transparent",
                        }}
                    />

                    {/* 魚の画像 */}
                    <img
                        id={`fish-${fish.id}`}
                        src={fish.img}
                        alt=""
                        draggable="false"
                        style={{
                            width: "80px",
                            height: "80px",
                            pointerEvents: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            WebkitTouchCallout: "none",
                            position: "absolute",
                            zIndex: 10,
                            transform: `rotate(${angle}rad) scaleX(${direction * -1})`,
                            transformOrigin: "center center",
                        }}
                    />
                </div>
            </div>

            {activeEffect === "sparkle" && (
                <div className="sparkle-effect" style={{ left: x, top: y }} />
            )}

            {activeEffect === "stars" && (
                <div className="star-container" style={{ left: x + 50, top: y + 30 }}>
                    <div className="star star1"></div>
                    <div className="star star2"></div>
                    <div className="star star3"></div>
                    <div className="star star4"></div>
                    <div className="star star5"></div>
                </div>
            )}

            {activeEffect === "particles" && (
                <div className="particle-container" style={{ left: x + 50, top: y + 30 }}>
                    <div className="particle particle1"></div>
                    <div className="particle particle2"></div>
                    <div className="particle particle3"></div>
                    <div className="particle particle4"></div>
                    <div className="particle particle5"></div>
                </div>
            )}

            {activeEffect === "gloomy" && (
                <div className="gloomy-effect" style={{ left: x, top: y }} />
            )}
        </>
    );
}