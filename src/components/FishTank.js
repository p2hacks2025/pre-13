import React, { useState, useEffect, useRef } from 'react';
import { fishTypes } from '../utils/fishData';

function Fish({ message, allMessages, onClick, showTitles }) {
    const SPEED_FACTOR = 0.15; // %ベースなので数値を小さく調整
    const INNER_RANGE = 15;    // %ベースの衝突距離
    const SEPARATION_FORCE = 0.05;

    // --- 修正：初期位置を水槽全体（15%〜85%）に散らす ---
    const [x, setX] = useState(message.x || 10 + Math.random() * 80);
    const [y, setY] = useState(message.y || 20 + Math.random() * 60);
    
    const [direction, setDirection] = useState(Math.random() > 0.5 ? 1 : -1);
    const [angle, setAngle] = useState(0);

    const frameRef = useRef();
    
    const fish = fishTypes.find(f => f.id === message.visualFishId) 
              || fishTypes.find(f => f.id === message.sentiment) 
              || fishTypes[0];

    useEffect(() => {
        // 他の魚が参照できるように座標を更新
        message.x = x;
        message.y = y;
    }, [x, y, message]);

    useEffect(() => {
        const update = () => {
            // 移動範囲の制限（%）
            const minX = 5, maxX = 95;
            const minY = 15, maxY = 85; // 上下15%のマージン

            let vx = (message.speed || 1) * direction * SPEED_FACTOR;
            let vy = Math.sin(angle) * 0.1;

            // 衝突回避（%ベースの距離計算）
            allMessages.forEach(other => {
                if (other.id === message.id) return;
                const dx = x - (other.x || 50);
                const dy = y - (other.y || 50);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < INNER_RANGE && dist > 0) {
                    const push = (INNER_RANGE - dist) * SEPARATION_FORCE;
                    vx += (dx / dist) * push;
                    vy += (dy / dist) * push;
                }
            });

            // 位置更新
            setX(prev => {
                let nextX = prev + vx;
                if (nextX > maxX) { setDirection(-1); return maxX; }
                if (nextX < minX) { setDirection(1); return minX; }
                return nextX;
            });

            setY(prev => {
                let nextY = prev + vy;
                if (nextY > maxY) return maxY;
                if (nextY < minY) return minY;
                return nextY;
            });

            if (Math.random() < 0.02) {
                setAngle((Math.random() * 20 - 10) * (Math.PI / 180));
            }

            frameRef.current = requestAnimationFrame(update);
        };

        frameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameRef.current);
    }, [x, y, direction, angle, allMessages, message]);

    return (
        <div
            onClick={() => onClick(message)}
            style={{
                position: 'absolute',
                left: `${x}%`, // %で指定
                top: `${y}%`,  // %で指定
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
            }}
        >
            {showTitles && message.aiTitle && (
                <div className="fish-title">{message.aiTitle}</div>
            )}
            <img 
                src={process.env.PUBLIC_URL + '/' + fish.img} 
                alt=""
                draggable="false"
                style={{
                    width: 'min(120px, 25vw)', // スマホでも大きすぎないように
                    height: 'auto',
                    transform: `rotate(${angle}rad) scaleX(${direction * -1})`,
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
                    transition: 'transform 0.4s ease'
                }}
            />
        </div>
    );
}

function FishTank({ messages, onFishClick, showTitles }) {
    return (
        <div className="aquarium-container">
            {messages.map((m) => (
                <Fish 
                    key={m.id} 
                    message={m} 
                    allMessages={messages}
                    onClick={onFishClick}
                    showTitles={showTitles}
                />
            ))}
        </div>
    );
}

export default FishTank;