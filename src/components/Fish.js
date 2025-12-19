import React from 'react';
import { Box, Typography } from '@mui/material';
import { fishTypes } from '../utils/fishData';

function Fish({ message, onClick }) {
    // 【最重要】AIの判断(sentiment)ではなく、保存されたユーザーの選択(visualFishId)を優先
    const fishData = fishTypes.find(f => f.id === message.visualFishId) 
                  || fishTypes.find(f => f.id === message.sentiment) 
                  || fishTypes[0];

    return (
        <Box 
            onClick={onClick}
            sx={{
                position: 'absolute',
                left: `${message.x}%`,
                top: `${message.y}%`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 100,
                animation: `floatSwim ${5 + Math.random() * 2}s ease-in-out infinite`,
                '@keyframes floatSwim': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-30px)' }
                }
            }}
        >
            <img 
                src={process.env.PUBLIC_URL + '/' + fishData.img} 
                alt="fish" 
                style={{ 
                    width: '180px',
                    height: 'auto',
                    transform: message.direction === 'left' ? 'scaleX(-1)' : 'none',
                    filter: 'drop-shadow(8px 12px 15px rgba(0,0,0,0.4))'
                }} 
            />
            
            <Box sx={{ 
                mt: 1.5, px: 2, py: 0.5, borderRadius: '20px', 
                bgcolor: 'rgba(255,255,255,0.85)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                    {message.aiTitle || "..."}
                </Typography>
            </Box>
        </Box>
    );
}

export default Fish;