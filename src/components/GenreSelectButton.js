// fileName: GenreSelectButton.js

import React, { useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

const genres = ['大学', '恋愛', '勉強', 'フォロー中'];

function GenreSelectButton({ selectedGenre, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (genre) => {
        onSelect(genre);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* メインボタン */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '38px',       /* 左のアイコンボタンの大きさに合わせる */
                    padding: '0 16px',
                    borderRadius: '20px',
                    border: '1px solid #eee',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: '1'       /* テキストの垂直位置を固定 */
                }}
            >
                {selectedGenre}
                {isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
            </button>

            {/* 子メニュー */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '48px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '25px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    zIndex: 2000,
                    whiteSpace: 'nowrap'
                }}>
                    {genres.map((genre) => (
                        <button
                            key={genre}
                            onClick={() => handleSelect(genre)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '15px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                backgroundColor: selectedGenre === genre ? '#333' : '#f0f0f0',
                                color: selectedGenre === genre ? '#fff' : '#666',
                                transition: '0.2s'
                            }}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GenreSelectButton;