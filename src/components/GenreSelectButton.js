// fileName: src/components/GenreSelectButton.js

import React, { useRef, useEffect, useState } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

// ジャンルリスト
const genres = [
    { label: '大学', icon: <SchoolIcon style={{ fontSize: '18px' }} /> },
    { label: '恋愛', icon: <FavoriteIcon style={{ fontSize: '18px' }} /> },
    { label: '勉強', icon: <MenuBookIcon style={{ fontSize: '18px' }} /> },
    { label: '自由', icon: <ChatBubbleOutlineIcon style={{ fontSize: '18px' }} /> },
    { label: 'フォロー中', icon: <PeopleIcon style={{ fontSize: '18px' }} /> },
];

function GenreSelectButton({ selectedGenre, onSelect }) {
    const scrollRef = useRef(null);

    // スワイプ干渉防止
    const stopPropagation = (e) => {
        e.stopPropagation();
    };

    return (
        <div 
            // コンテナ自体がスワイプを横取りしないようにするが、横スクロールは許可する
            onTouchStart={stopPropagation}
            onMouseDown={stopPropagation}
            style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center', // 画面幅が広い時は中央寄せ
            }}
        >
            <style>
                {`
                    .genre-scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                    .genre-scroll-container {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}
            </style>
            
            <div 
                ref={scrollRef}
                className="genre-scroll-container"
                style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '0 16px',
                    overflowX: 'auto',        // 横スクロール有効
                    whiteSpace: 'nowrap',     // 折り返し禁止
                    WebkitOverflowScrolling: 'touch', // スマホでの慣性スクロール
                    maxWidth: '100%',
                    scrollBehavior: 'smooth'
                }}
            >
                {genres.map((item) => {
                    const isActive = selectedGenre === item.label;
                    return (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item.label);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '20px', // ピル型
                                // 動画に近いスタイル: 選択中は薄い水色背景、非選択は透明
                                backgroundColor: isActive ? '#e1f5fe' : 'transparent',
                                color: isActive ? '#0277bd' : '#666',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flexShrink: 0, // 潰れないようにする
                                outline: 'none'
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default GenreSelectButton;