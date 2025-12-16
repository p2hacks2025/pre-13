// fileName: PostButton.js

import React from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // + アイコン

function PostButton({ onClick }) {
    return (
        <IconButton 
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: '20px', // 右下ではなく、右下に配置
                right: '20px',
                zIndex: 1000, // 他の要素より手前に表示
                backgroundColor: 'red', // 目立つ色に設定
                color: 'white',
                width: '60px',
                height: '60px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
        >
            <AddIcon fontSize="large" />
        </IconButton>
    );
}

export default PostButton;