// fileName: src/components/PostButton.js

import React from 'react';
import IconButton from '@mui/material/IconButton';

function PostButton({ onClick }) {
    return (
        <IconButton 
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                // ★ここを 50% に変更して完全な丸にする
                borderRadius: '50%', 
                width: '65px', 
                height: '65px', 
                padding: '12px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)', 
                transition: 'transform 0.2s', 
            }}
            sx={{
                '&:active': { transform: 'scale(0.95)' } 
            }}
        >
            <img 
                src={process.env.PUBLIC_URL + '/icon_bucket.png'} 
                alt="Post" 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain'
                }} 
            />
        </IconButton>
    );
}

export default PostButton;