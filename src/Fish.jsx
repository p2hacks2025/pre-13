import { useState, useEffect } from "react";
import "./App.css";

export default function Fish({ fish, onRemove, onModeChange }) {
    const SPEED_FACTOR = 1.7;

    const [x, setX] = useState(fish.x);
    const [y, setY] = useState(fish.y);
    const [direction, setDirection] = useState(fish.direction);
    const [angle, setAngle] = useState(0);
    const [speed, setSpeed] = useState(fish.speed);
    const [targetAngle, setTargetAngle] = useState(0);
    const [targetSpeed, setTargetSpeed] = useState(speed);

    const [baseEffect, setBaseEffect] = useState(null);
    const [activeEffect, setActiveEffect] = useState(null);

    // ✅ shallow / deep のクリックエフェクト
    useEffect(() => {
        if (fish.type === "deep") {
            setBaseEffect("gloomy");
        } else if (fish.type === "shallow") {
            const shallowEffects = ["sparkle", "stars", "particles"];
            const randomEffect =
                shallowEffects[Math.floor(Math.random() * shallowEffects.length)];
            setBaseEffect(randomEffect);
        }
    }, [fish.type]);

    function handleClick() {
        setActiveEffect(baseEffect);
        setTimeout(() => setActiveEffect(null), 600);
    }

    // ✅ 妖精パーティクル（public の画像を使う）
    function spawnFairyParticle() {
        const fishEl = document.querySelector(`#fish-${fish.id}`);
        if (!fishEl) return;

        const rect = fishEl.getBoundingClientRect();

        const baseX = rect.left + rect.width / 2;
        const baseY = rect.top + rect.height / 2;

        const startX = baseX + (Math.random() * 30 - 15);
        const startY = baseY + (Math.random() * 30 - 15);

        const dx = Math.random() * 20 - 10;
        const dy = Math.random() * 12 - 6;

        // ✅ shallow → 光.png / deep → 黒.png
        const img =
            fish.type === "deep"
                ? "/fish/ひし形との組み合わせ黒.png"
                : "/fish/ひし形との組み合わせ光.png";

        const particle = document.createElement("div");
        particle.className = "fairy-particle";
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);

        // ✅ 画像を適用
        particle.style.backgroundImage = `url(${img})`;
        particle.style.backgroundSize = "contain";
        particle.style.backgroundRepeat = "no-repeat";

        // ✅ 魚より前に出す
        particle.style.zIndex = "9999";

        // ✅ body に追加（最も安定して前面に出る）
        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 2000);
    }

    // ✅ 常時パーティクル生成
    useEffect(() => {
        const interval = setInterval(() => {
            spawnFairyParticle();
        }, 140);

        return () => clearInterval(interval);
    }, [fish.id, fish.type]);

    // ✅ EXIT（退場）
    useEffect(() => {
        if (fish.mode !== "exit") return;

        const interval = setInterval(() => {
            setX((prev) => {
                const exitSpeed = fish.speed * 2.5 * SPEED_FACTOR;
                const nextX = prev + exitSpeed * direction;

                if (nextX < -800 || nextX > window.innerWidth + 800) {
                    onRemove(fish.id);
                    return prev;
                }

                return nextX;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [fish.mode, direction]);

    // ✅ ENTER（画面外 → 画面内）
    useEffect(() => {
        if (fish.mode !== "enter") return;

        const interval = setInterval(() => {
            setX((prev) => {
                const enterSpeed = fish.speed * 3 * SPEED_FACTOR;
                const nextX = prev + enterSpeed * direction;

                if (direction === 1 && nextX >= 0) {
                    onModeChange(fish.id, "normal");
                }
                if (direction === -1 && nextX <= window.innerWidth - 80) {
                    onModeChange(fish.id, "normal");
                }

                return nextX;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [fish.mode, direction]);

    // ✅ NORMAL（自然な泳ぎ）
    useEffect(() => {
        if (fish.mode !== "normal") return;

        const interval = setInterval(() => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            let newAngle = angle;
            let newSpeed = speed;

            const maxAngle = 5 * (Math.PI / 180);

            if (Math.random() < 0.01) {
                const randomDeg = Math.random() * 10 - 5;
                const newTarget = randomDeg * (Math.PI / 180);
                setTargetAngle(newTarget);
            }

            const angleLerpSpeed = 0.05 * SPEED_FACTOR;
            newAngle = newAngle + (targetAngle - newAngle) * angleLerpSpeed;
            newAngle = Math.max(-maxAngle, Math.min(maxAngle, newAngle));

            if (Math.random() < 0.01) {
                const newTarget = 0.8 + Math.random() * 0.6;
                setTargetSpeed(newTarget);
            }

            const speedLerp = 0.03 * SPEED_FACTOR;
            newSpeed = newSpeed + (targetSpeed - newSpeed) * speedLerp;

            setX((prev) => {
                const nextX =
                    prev + newSpeed * SPEED_FACTOR * Math.cos(newAngle) * direction;

                if (nextX > w - 80) {
                    setDirection(-1);
                    return w - 80;
                }
                if (nextX < 0) {
                    setDirection(1);
                    return 0;
                }

                return nextX;
            });

            setY((prevY) => {
                const nextY = prevY + newSpeed * SPEED_FACTOR * Math.sin(newAngle);
                if (nextY < 0) return 0;
                if (nextY > h - 80) return h - 80;
                return nextY;
            });

            setAngle(newAngle);
            setSpeed(newSpeed);
        }, 30);

        return () => clearInterval(interval);
    }, [fish.mode, direction, angle, speed, targetAngle, targetSpeed]);

    return (
        <>
            {/* ✅ 魚本体 */}
            <div
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                    }}
                >
                    {/* 当たり判定 */}
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

                    {/* 魚画像 */}
                    <img
                        id={`fish-${fish.id}`}
                        src={fish.img}
                        alt=""
                        draggable="false"
                        style={{
                            width: "80px",
                            height: "80px",
                            pointerEvents: "none",
                            position: "absolute",
                            zIndex: 10,
                            transform: `rotate(${angle}rad) scaleX(${direction * -1})`,
                            transformOrigin: "center center",
                        }}
                    />
                </div>
            </div>

            {/* ✅ クリックエフェクト */}
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