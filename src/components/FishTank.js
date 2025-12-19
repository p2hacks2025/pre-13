import React, { useState, useEffect } from 'react';
import { fishTypes } from '../utils/fishData';

/**
 * 個別の魚コンポーネント
 */
function Fish({ message, onClick, showTitles }) {
    // 初期のランダム位置
    const [pos, setPos] = useState({
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15
    });
    
    // 移動速度と向きのランダム設定
    const [speed] = useState(Math.random() * 0.05 + 0.02);
    const [direction, setDirection] = useState(Math.random() > 0.5 ? 1 : -1);

    // 【修正箇所】画像決定のロジック
    // 1. ユーザーが選んだ見た目 (visualFishId) を最優先
    // 2. なければ AI の判定 (sentiment) を使用
    // 3. それもなければデフォルトを表示
    const fish = fishTypes.find(f => f.id === message.visualFishId) 
              || fishTypes.find(f => f.id === message.sentiment) 
              || fishTypes[0];

    useEffect(() => {
        const moveFish = setInterval(() => {
            setPos(prev => {
                let nextX = prev.x + speed * direction;
                
                // 壁に当たったら反転
                if (nextX > 85) { 
                    setDirection(-1);
                    return { ...prev, x: 85 };
                }
                if (nextX < 5) {
                    setDirection(1);
                    return { ...prev, x: 5 };
                }
                return { ...prev, x: nextX };
            });
        }, 50);

        return () => clearInterval(moveFish);
    }, [speed, direction]);

    return (
        <div 
            onClick={() => onClick(message)} 
            style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transition: 'top 3s ease-in-out, left 0.05s linear',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
            }}
        >
            {/* タイトル表示（GPTが生成したもの） */}
            {showTitles && message.aiTitle && (
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                    border: '1px solid rgba(0,0,0,0.1)'
                }}>
                    {message.aiTitle}
                </div>
            )}

            {/* 魚の画像本体 */}
            <img 
                src={process.env.PUBLIC_URL + '/' + fish.img} 
                alt={fish.label}
                style={{
                    width: '150px',
                    height: 'auto',
                    transform: `scaleX(${direction * -1})`,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                    display: 'block',
                    transition: 'transform 0.4s ease'
                }}
                onError={(e) => { e.target.style.opacity = 0; }}
            />
        </div>
    );
}

/**
 * 水槽全体を管理するコンポーネント
 */
function FishTank({ messages, onFishClick, showTitles }) {
    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            overflow: 'hidden' 
        }}>
            {messages.map((m) => (
                <Fish 
                    key={m.id} 
                    message={m} 
                    onClick={onFishClick}
                    showTitles={showTitles}
                />
            ))}
        </div>
    );
}

export default FishTank;