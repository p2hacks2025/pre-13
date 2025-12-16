// fileName: GenreSelectButton.js

import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const genres = ['大学', '恋愛', '勉強', 'フォロー中'];

function GenreSelectButton({ selectedGenre, onSelect }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (genre) => {
        setAnchorEl(null);
        if (genre && genre !== 'backdropClick') {
            onSelect(genre);
        }
    };

    return (
        <div style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <Button
                id="genre-menu-button"
                aria-controls={open ? 'genre-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant="contained"
                endIcon={<ArrowDropDownIcon />}
            >
                {selectedGenre || 'ジャンル選択'}
            </Button>
            <Menu
                id="genre-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose('backdropClick')}
                MenuListProps={{
                    'aria-labelledby': 'genre-menu-button',
                }}
            >
                {genres.map((genre) => (
                    <MenuItem key={genre} onClick={() => handleClose(genre)}>
                        {genre}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

export default GenreSelectButton;