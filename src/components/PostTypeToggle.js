// fileName: PostTypeToggle.js

import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';

function PostTypeToggle({ currentFilter, onSelect }) {
    const isShallow = currentFilter === 'shallow';

    return (
        <IconButton 
            onClick={() => onSelect(isShallow ? 'deep' : 'shallow')}
            style={{
                backgroundColor: '#222',
                color: 'white',
                borderRadius: '12px',
                width: '50px',
                height: '50px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
        >
            {isShallow ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
    );
}

export default PostTypeToggle;