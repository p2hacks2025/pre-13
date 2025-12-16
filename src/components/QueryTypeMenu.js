// fileName: QueryTypeMenu.js

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const queryTypes = [
    { key: 'line', label: 'みんなの投稿' },
    { key: 'popular', label: '人気投稿' },
    { key: 'liked', label: 'いいねした投稿' },
    { key: 'myPosts', label: '自分の投稿' }, // 自分の投稿もここに含める
];

function QueryTypeMenu({ onSelect }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (type) => {
        setAnchorEl(null);
        if (type && type !== 'backdropClick') {
            onSelect(type);
        }
    };

    return (
        <div>
            {/* 左上のハンバーガーメニューアイコン */}
            <IconButton
                id="query-menu-button"
                aria-controls={open ? 'query-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 50 }}
            >
                <MenuIcon />
            </IconButton>
            <Menu
                id="query-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose('backdropClick')}
                MenuListProps={{
                    'aria-labelledby': 'query-menu-button',
                }}
            >
                {queryTypes.map((type) => (
                    <MenuItem key={type.key} onClick={() => handleClose(type.key)}>
                        {type.label}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

export default QueryTypeMenu;