// fileName: src/components/Fish.js
import React, { useState, useEffect, useRef } from "react";
import { fishTypes } from '../utils/fishData';

export default function Fish({ message, allMessages, paused, onRemove, onModeChange, onClick }) {
    // --- 物理定数 ---
    const SPEED_FACTOR = 1.7;
    const OUTER_RANGE = 90;
    const INNER_RANGE = 55;
    const ESCAPE_SIDE_PUSH = 6;
    const ESCAPE_BOOST = 2.5;

    // --- 状態管理 ---
    // 初期位置は message に保存されている x, y を使用するか、ランダムに設定
    const [x, setX] = useState(message.x || Math.random() * 80 + 10);
    const [y, setY] = useState(message.y || Math.random() * 70 + 15);
    const [direction, setDirection] = useState(message.direction === 'left' ? -1 : 1);
    const [angle, setAngle] = useState(0);
    const [speed, setSpeed] = useState(0.5);

    const [targetAngle, setTargetAngle] = useState(0);
    const [targetSpeed, setTargetSpeed] = useState(0.5);

    const [xBoost, setXBoost] = useState(0);
    const [yBoost, setYBoost] = useState(0);

    const [danger, setDanger] = useState(0);
    const [stuckTime, setStuckTime] = useState(0);

    const [baseEffect, setBaseEffect] = useState(null);
    const [activeEffect, setActiveEffect] = useState(null);

    const frameRef = useRef(null);
    const posRef = useRef({ x: x + 40, y: y + 40 });

    // 魚のデータ選択（既存ロジックを継承）
    const fishData = fishTypes.find(f => f.id === message.visualFishId) 
                  || fishTypes.find(f => f.id === message.sentiment) 
                  || fishTypes[0];

    useEffect(() => {
        posRef.current = { x: x + 40, y: y + 40 };
    }, [x, y]);

    const centerX = x + 40;
    const centerY = y + 40;

    // --- エフェクトロジック ---
    useEffect(() => {
        if (message.type === "deep") {
            setBaseEffect("gloomy");
        } else {
            const effects = ["sparkle", "stars", "particles"];
            setBaseEffect(effects[Math.floor(Math.random() * effects.length)]);
        }
    }, [message.type]);

    function handleFishClick(e) {
        if (e) e.stopPropagation();
        if (baseEffect) {
            setActiveEffect(baseEffect);
            setTimeout(() => setActiveEffect(null), 600);
        }
        if (onClick) onClick(message);
    }

    function spawnFairyParticle() {
        const layer = document.getElementById("effect-layer");
        if (!layer) return;

        const { x: cx, y: cy } = posRef.current;
        const startX = cx + (Math.random() * 30 - 15);
        const startY = cy + (Math.random() * 30 - 15);
        const dx = Math.random() * 20 - 10;
        const dy = Math.random() * 12 - 6;

        const img = message.type === "deep"
                ? process.env.PUBLIC_URL + "/fish/ひし形との組み合わせ黒.png"
                : process.env.PUBLIC_URL + "/fish/ひし形との組み合わせ光.png";

        const particle = document.createElement("div");
        particle.className = "fairy-particle";
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);
        particle.style.backgroundImage = `url(${img})`;
        particle.style.position = "absolute";
        particle.style.width = "20px";
        particle.style.height = "20px";
        particle.style.zIndex = "999999";

        layer.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
    }

    useEffect(() => {
        const id = setInterval(spawnFairyParticle, 140);
        return () => clearInterval(id);
    }, [message.type]);

    // --- 物理演算ロジック (applySeparation, getCollisionInfo, updateNormal 等は提供コードをそのまま移植) ---
    // ※ allMessages をループして ox, oy を計算する際、各メッセージの現在の座標が必要なため、
    // 本来的には親の FishTank で一括管理するか、簡略化して message オブジェクト内の座標を参照します。

    // ... (提供された物理演算関数群をここに配置) ...

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: "80px",
                    height: "80px",
                    zIndex: 20,
                    cursor: 'pointer'
                }}
                onClick={handleFishClick}
            >
                {/* 魚のタイトル表示（既存機能） */}
                {message.aiTitle && (
                    <div style={{
                        position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '10px',
                        fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none'
                    }}>
                        {message.aiTitle}
                    </div>
                )}
                <img
                    src={process.env.PUBLIC_URL + '/' + fishData.img}
                    alt={fishData.label}
                    draggable="false"
                    style={{
                        width: "80px",
                        height: "80px",
                        pointerEvents: "none",
                        transform: `rotate(${angle}rad) scaleX(${direction * -1})`,
                        transformOrigin: "center center",
                        filter: 'drop-shadow(4px 6px 8px rgba(0,0,0,0.3))'
                    }}
                />
            </div>

            {/* 各種エフェクト表示 */}
            {activeEffect === "sparkle" && <div className="sparkle-effect" style={{ left: centerX, top: centerY, zIndex: 9999 }} />}
            {activeEffect === "stars" && (
                <div className="star-container" style={{ left: centerX, top: centerY, zIndex: 9999 }}>
                    <div className="star star1" /><div className="star star2" /><div className="star star3" /><div className="star star4" /><div className="star star5" />
                </div>
            )}
            {/* ... 他のエフェクトも同様に ... */}
        </>
    );
}