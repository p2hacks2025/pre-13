// fileName: src/components/FishTank.js
import Fish from './Fish'; 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached'; 
import { fishTypes } from '../utils/fishData';
import './FishTank.css';

const MAX_FISH_COUNT = 7;

function FishTank({ messages, onFishClick, showTitles, currentFilter, selectedGenre }) {
    const isDeep = currentFilter === 'deep';
    const bgImage = isDeep 
        ? `url(${process.env.PUBLIC_URL}/bg_deep.png)` 
        : `url(${process.env.PUBLIC_URL}/bg_shallow.png)`;

    const [displayMessages, setDisplayMessages] = useState([]);
    const [isReplacing, setIsReplacing] = useState(false);
    
    const timerRef = useRef(null);
    // 最新のメッセージリストを常に参照できるようにする
    const messagesRef = useRef(messages);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    const pickRandom = useCallback((source, count) => {
        if (!source || source.length === 0) return [];
        const shuffled = [...source].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }, []);

    const generateLanes = useCallback((count) => {
        const minY = 25; 
        const maxY = 85;
        const totalHeight = maxY - minY;
        const slotHeight = totalHeight / count; 
        const indices = Array.from({ length: count }, (_, i) => i);
        indices.sort(() => 0.5 - Math.random());
        return indices.map(i => {
            return minY + (i * slotHeight) + (Math.random() * (slotHeight * 0.8));
        });
    }, []);

    // 魚をリロードする共通関数
    const refreshFish = useCallback(() => {
        const currentMsgs = messagesRef.current || [];
        if (currentMsgs.length === 0) {
            setDisplayMessages([]);
            setIsReplacing(false);
            return;
        }

        const nextBatchRaw = pickRandom(currentMsgs, MAX_FISH_COUNT);
        const lanes = generateLanes(nextBatchRaw.length);

        const nextBatch = nextBatchRaw.map((m, index) => {
            const startFromLeft = Math.random() > 0.5;
            const startX = startFromLeft ? -20 : 120;
            return {
                ...m,
                uniqueKey: `${m.id}-${Date.now()}`, 
                mode: 'normal',
                x: startX, 
                y: lanes[index], 
                direction: startFromLeft ? 1 : -1 
            };
        });

        setDisplayMessages(nextBatch);
        setIsReplacing(false);
        timerRef.current = null;
    }, [pickRandom, generateLanes]);

    // ★ジャンルやフィルタが変わったら自動リロード
    useEffect(() => {
        // 退場アニメーション開始
        setIsReplacing(true);
        setDisplayMessages(prev => prev.map(m => ({ ...m, mode: 'exit' })));

        if (timerRef.current) clearTimeout(timerRef.current);

        // 0.6秒後に新しい魚を入場させる
        timerRef.current = setTimeout(() => {
            refreshFish();
        }, 600);
        
    }, [selectedGenre, currentFilter, refreshFish]);

    // ★メッセージデータ更新時の処理（新規投稿や初回ロード）
    useEffect(() => {
        // リロードアニメーション中は割り込まない
        if (isReplacing) return;

        const currentMsgs = messages || [];
        
        // 初回ロードなどで表示が空の場合、データがあれば即時表示
        if (displayMessages.length === 0 && currentMsgs.length > 0) {
            refreshFish();
            return;
        }

        // 新規投稿の検出
        const currentIds = new Set(displayMessages.map(m => m.id));
        const newPosts = currentMsgs.filter(m => !currentIds.has(m.id));

        if (newPosts.length > 0) {
            const addedFish = newPosts.map(m => {
                const startFromLeft = Math.random() > 0.5;
                const startX = startFromLeft ? -20 : 120;
                return {
                    ...m,
                    uniqueKey: m.id,
                    mode: 'normal',
                    x: startX, 
                    y: 20 + Math.random() * 60,
                    direction: startFromLeft ? 1 : -1,
                    speed: (m.speed || 1) * 1.5
                };
            });
            setDisplayMessages(prev => [...prev, ...addedFish]);
        }
    }, [messages, isReplacing, displayMessages, refreshFish]);

    // 手動リロードボタン
    const handleRefresh = (e) => {
        e.stopPropagation();
        if (isReplacing) return;
        setIsReplacing(true);

        setDisplayMessages(prev => prev.map(m => ({ ...m, mode: 'exit' })));

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            refreshFish();
        }, 600); 
    };

    return (
        <div className={`aquarium-container ${currentFilter}`} style={{ backgroundImage: bgImage }}>
            
            {displayMessages.map((m) => (
                <Fish 
                    key={m.uniqueKey || m.id} 
                    message={m} 
                    allMessages={displayMessages}
                    onClick={onFishClick}
                    showTitles={showTitles}
                />
            ))}

            <IconButton 
                onClick={handleRefresh}
                sx={{
                    position: 'fixed', 
                    bottom: 'calc(25px + env(safe-area-inset-bottom))', 
                    left: '80px',
                    zIndex: 2000, 
                    pointerEvents: 'auto',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                    width: '45px', 
                    height: '45px',
                    transition: 'transform 0.6s ease',
                    transform: isReplacing ? 'rotate(360deg)' : 'none'
                }}
            >
                <CachedIcon />
            </IconButton>

        </div>
    );
}

export default FishTank;