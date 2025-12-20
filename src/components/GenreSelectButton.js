// fileName: src/components/GenreSelectButton.js
import React, { useRef, useMemo } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PeopleIcon from '@mui/icons-material/People';
import { NAV_GENRES } from '../utils/constants';

function GenreSelectButton({ selectedGenre, onSelect }) {
    const touchStartRef = useRef(null);
    const touchCurrentRef = useRef(null);
    const SWIPE_THRESHOLD = 50;

    const genres = useMemo(() => {
        const iconMap = {
            大学: <SchoolIcon />,
            恋愛: <FavoriteIcon />,
            勉強: <MenuBookIcon />,
            自由: <ChatBubbleOutlineIcon />,
            フォロー中: <PeopleIcon />
        };
        return NAV_GENRES.map((label) => ({
            label,
            icon: iconMap[label]
        }));
    }, []);

    const updateTouch = (point) => {
        if (!point) return;
        if (!touchStartRef.current) {
            touchStartRef.current = point;
        }
        touchCurrentRef.current = point;
    };

    const finishSwipe = () => {
        const start = touchStartRef.current;
        const current = touchCurrentRef.current;
        touchStartRef.current = null;
        touchCurrentRef.current = null;
        if (!start || !current) return;

        const diffX = start.x - current.x;
        const diffY = start.y - current.y;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);
        if (absX <= absY || absX < SWIPE_THRESHOLD) return;

        const currentIndex = genres.findIndex((g) => g.label === selectedGenre);
        if (currentIndex === -1) return;
        const nextIndex = diffX > 0
            ? (currentIndex + 1) % genres.length
            : (currentIndex - 1 + genres.length) % genres.length;
        onSelect(genres[nextIndex].label);
    };

    const handleTouchStart = (e) => {
        e.stopPropagation();
        const touch = e.targetTouches[0];
        updateTouch(touch ? { x: touch.clientX, y: touch.clientY } : null);
    };

    const handleTouchMove = (e) => {
        e.stopPropagation();
        const touch = e.targetTouches[0];
        updateTouch(touch ? { x: touch.clientX, y: touch.clientY } : null);
    };

    const handleTouchEnd = (e) => {
        e.stopPropagation();
        finishSwipe();
    };

    const handlePointerDown = (e) => {
        if (e.pointerType !== 'touch') return;
        updateTouch({ x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e) => {
        if (e.pointerType !== 'touch') return;
        updateTouch({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e) => {
        if (e.pointerType !== 'touch') return;
        finishSwipe();
    };

    return (
        <Box
            sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%', 
            px: 1, 
            py: 0.2, // ★修正: コンテナの上下余白を減らす (0.5 -> 0.2)
            touchAction: 'pan-y'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {genres.map((g) => {
                const isSelected = selectedGenre === g.label;
                return (
                    <ButtonBase
                        key={g.label}
                        onClick={() => onSelect(g.label)}
                        sx={{
                            flex: 1, 
                            display: 'flex',
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 0.5, // ★修正: ボタン内の上下余白を減らす (1 -> 0.5)
                            minWidth: 0, 
                            color: isSelected ? '#0288d1' : '#9e9e9e', 
                            transition: 'color 0.3s ease',
                            borderRadius: '8px',
                            '&:active': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        {/* アイコン */}
                        <Box sx={{ 
                            fontSize: isSelected ? '24px' : '22px', // ★修正: アイコンサイズを微調整
                            display: 'flex', 
                            mb: 0.2, // ★修正: アイコンと文字の間隔を詰める (0.5 -> 0.2)
                            transition: 'all 0.3s ease',
                            color: 'inherit'
                        }}>
                            {g.icon}
                        </Box>
                        
                        {/* テキスト */}
                        <Typography sx={{ 
                            fontSize: '10px', 
                            fontWeight: isSelected ? 'bold' : 'medium',
                            color: 'inherit',
                            whiteSpace: 'nowrap'
                        }}>
                            {g.label}
                        </Typography>
                    </ButtonBase>
                );
            })}
        </Box>
    );
}

export default GenreSelectButton;
