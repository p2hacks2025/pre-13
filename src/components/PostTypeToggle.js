// fileName: PostTypeToggle.js

import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import IconButton from '@mui/material/IconButton';
import { SEA_TYPES } from '../utils/constants';

function PostTypeToggle({ currentFilter, onSelect }) {
    const isShallow = currentFilter === SEA_TYPES.SHALLOW;

    return (
        <IconButton 
            onClick={() => onSelect(isShallow ? SEA_TYPES.DEEP : SEA_TYPES.SHALLOW)}
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
