// fileName: PostButton.js

import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';

function PostButton({ onClick }) {
    return (
        <IconButton 
            onClick={onClick}
            style={{
                backgroundColor: '#222', // 画像のような濃いグレー
                color: 'white',
                borderRadius: '12px', // 少し角丸の四角
                width: '45px',
                height: '45px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
        >
            <AddIcon />
        </IconButton>
    );
}

export default PostButton;