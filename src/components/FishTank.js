// fileName: src/components/FishTank.js
import Fish from './Fish'; 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SEA_TYPES } from '../utils/constants';
import './FishTank.css';

const MAX_FISH_COUNT = 7;

// ★修正: selectedQueryType を受け取る
function FishTank({ messages, onFishClick, showTitles, currentFilter, selectedGenre, selectedQueryType, refreshToken }) {
    const isDeep = currentFilter === SEA_TYPES.DEEP;
    const bgImage = isDeep 
        ? `url(${process.env.PUBLIC_URL}/bg_deep.png)` 
        : `url(${process.env.PUBLIC_URL}/bg_shallow.png)`;

    const [displayMessages, setDisplayMessages] = useState([]);
    const [isReplacing, setIsReplacing] = useState(false);
    
    const timerRef = useRef(null);
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
                enteredAt: Date.now(),
                x: startX, 
                y: lanes[index], 
                direction: startFromLeft ? 1 : -1 
            };
        });

        setDisplayMessages(nextBatch);
        setIsReplacing(false);
        timerRef.current = null;
    }, [pickRandom, generateLanes]);

    // ジャンル/フィルタ/モード変更時にリロード（アニメーション有り）
    useEffect(() => {
        setIsReplacing(true);
        setDisplayMessages(prev => prev.map(m => ({ ...m, mode: 'exit' })));
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { refreshFish(); }, 600);
    }, [selectedGenre, currentFilter, selectedQueryType, refreshFish]);

    useEffect(() => {
        if (isReplacing) return;
        const currentMsgs = messages || [];
        if (currentMsgs.length > 0 && displayMessages.length > 0) {
            const latestById = new Map(currentMsgs.map(m => [m.id, m]));
            setDisplayMessages(prev => prev.map(p => {
                const latest = latestById.get(p.id);
                if (!latest) return p;
                return {
                    ...p,
                    ...latest,
                    x: p.x,
                    y: p.y,
                    direction: p.direction,
                    angle: p.angle,
                    mode: p.mode,
                    enteredAt: p.enteredAt,
                    uniqueKey: p.uniqueKey,
                    speed: p.speed
                };
            }));
        }
        if (displayMessages.length === 0 && currentMsgs.length > 0) {
            refreshFish();
            return;
        }
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
                    enteredAt: Date.now(),
                    x: startX, 
                    y: 25 + Math.random() * 45, // ボタン帯を避けつつ中央寄せ
                    direction: startFromLeft ? 1 : -1,
              
                    speed: (m.speed || 1) * 1.5
                };
            });
            setDisplayMessages(prev => {
                const merged = [...prev, ...addedFish];
                if (merged.length <= MAX_FISH_COUNT) return merged;
                return merged.slice(merged.length - MAX_FISH_COUNT);
            });
        }
    }, [messages, isReplacing, displayMessages, refreshFish]);

    const handleRefresh = () => {
        if (isReplacing) return;
        setIsReplacing(true);
        setDisplayMessages(prev => prev.map(m => ({ ...m, mode: 'exit' })));
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { refreshFish(); }, 600); 
    };

    useEffect(() => {
        if (refreshToken === undefined) return;
        handleRefresh();
    }, [refreshToken]);

    return (
        <div
            className={`aquarium-container ${currentFilter}`}
            style={{
                backgroundImage: bgImage,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                width: '100%',
                height: '100%',
                left: 0,
                transform: 'none'
            }}
        >
            
            {displayMessages.map((m) => (
                <Fish 
                    key={m.uniqueKey || m.id} 
                    message={m} 
                    allMessages={displayMessages}
                    onClick={onFishClick}
                    showTitles={showTitles}
                />
            ))}
        </div>
    );
}

export default FishTank;
