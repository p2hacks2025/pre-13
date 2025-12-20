// fileName: src/components/Fish.js
import React, { useEffect, useRef } from 'react';
import { fishTypes } from '../utils/fishData';

const Fish = React.memo(({ message, allMessages, onClick, showTitles }) => {
    // パラメータ
    const BASE_SPEED = 0.11; 
    const INNER_RANGE = 12;    
    const SEPARATION_FORCE = 0.05; 
    const MAX_FORCE = 0.5; 

    // モード管理
    const modeRef = useRef(message.mode || 'normal');
    useEffect(() => {
        modeRef.current = message.mode || 'normal';
    }, [message.mode]);

    const pos = useRef({
        x: Number.isFinite(message.x) ? message.x : 10 + Math.random() * 80,
        y: Number.isFinite(message.y) ? message.y : 20 + Math.random() * 60,
        direction: Math.random() > 0.5 ? 1 : -1,
        angle: 0
    });

    const prevPos = useRef({ ...pos.current });
    const allMessagesRef = useRef(allMessages);
    const fishRef = useRef(null);
    const frameRef = useRef(null);

    const fish = fishTypes.find(f => f.id === message.visualFishId) 
              || fishTypes.find(f => f.id === message.sentiment) 
              || fishTypes[0];
    const fishSize = window.innerWidth < 600 ? 70 : 120;

    useEffect(() => {
        allMessagesRef.current = allMessages;
    }, [allMessages]);

    useEffect(() => {
        const update = () => {
            if (!fishRef.current) {
                frameRef.current = requestAnimationFrame(update);
                return;
            }

            const minX = 5, maxX = 95;
            const minY = 15, maxY = 72; 

            let { x, y, direction, angle } = pos.current;

            // NaN対策
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                x = prevPos.current.x; y = prevPos.current.y;
                if (!Number.isFinite(x)) { x = 50; y = 50; }
            } else {
                prevPos.current = { x, y };
            }

            const isExit = modeRef.current === 'exit';
            const isEntering = message.enteredAt && (Date.now() - message.enteredAt) < 1200;
            const speedFactor = isExit ? 12.0 : (isEntering ? 3.0 : 1.0);
            const speed = (Number.isFinite(message.speed) ? message.speed : 1) * speedFactor;

            // 退場時は近い壁へ
            if (isExit) {
                if (x < 50) direction = -1;
                else direction = 1;
            }

            let vx = speed * direction * BASE_SPEED;
            let vy = Math.sin(angle) * 0.1;

            if (!isExit) {
                const currentMessages = allMessagesRef.current;
                if (currentMessages && currentMessages.length > 0) {
                    currentMessages.forEach(other => {
                        if (other.id === message.id) return;
                        const ox = Number.isFinite(other.x) ? other.x : 50;
                        const oy = Number.isFinite(other.y) ? other.y : 50;
                        const dx = x - ox;
                        const dy = y - oy;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < INNER_RANGE && dist > 0.5) {
                            let push = (INNER_RANGE - dist) * SEPARATION_FORCE;
                            if (push > MAX_FORCE) push = MAX_FORCE;
                            vx += (dx / dist) * push;
                            vy += (dy / dist) * push;
                        } 
                    });
                }
            }

            let nextX = x + vx;
            let nextY = y + vy;

            // 壁判定 (入場時と退場時は無視)
            if (!isExit) {
                if (y >= minY && nextY < minY) nextY = minY;
                if (y <= maxY && nextY > maxY) nextY = maxY;

                if (nextX > maxX) {
                    if (x <= maxX) { direction = -1; nextX = maxX - 0.5; }
                } else if (nextX < minX) {
                    if (x >= minX) { direction = 1; nextX = minX + 0.5; }
                }
            }

            if (Math.random() < 0.02) {
                angle = (Math.random() * 20 - 10) * (Math.PI / 180);
            }

            pos.current = { x: nextX, y: nextY, direction, angle };

            fishRef.current.style.left = `${nextX}%`;
            fishRef.current.style.top = `${nextY}%`;

            const img = fishRef.current.querySelector('img.fish-img');
            if (img) {
                img.style.transform = `translate(-50%, -50%) rotate(${angle}rad) scaleX(${direction * -1})`;
            }

            frameRef.current = requestAnimationFrame(update);
        };

        frameRef.current = requestAnimationFrame(update);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return (
        <div
            ref={fishRef}
            onClick={(e) => { e.stopPropagation(); onClick(message); }}
            data-no-swipe="true"
            style={{
                position: 'absolute',
                left: `${pos.current.x}%`, 
                top: `${pos.current.y}%`,
                width: `${fishSize}px`,
                height: `${fishSize}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                willChange: 'left, top',
                pointerEvents: 'none', 
                display: 'block'
            }}
        >
            {showTitles && message.aiTitle && (
                <div 
                    className="fish-title"
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translate(-50%, -4px)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(200, 230, 255, 0.8)',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#0277bd',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 20
                    }}
                >
                    {message.aiTitle}
                </div>
            )}
            
            <img 
                className="fish-img"
                src={process.env.PUBLIC_URL + '/' + fish.img} 
                alt=""
                draggable="false"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${pos.current.angle}rad) scaleX(${pos.current.direction * -1})`,
                    width: `${fishSize}px`,
                    height: 'auto',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    transition: 'transform 0.1s linear', 
                    pointerEvents: 'auto',
                    cursor: 'pointer'
                }}
            />
        </div>
    );
});

export default Fish;
