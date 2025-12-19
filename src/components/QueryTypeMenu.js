// fileName: QueryTypeMenu.js

import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Radio, Divider, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { auth } from '../firebase';

function QueryTypeMenu({ onSelect, currentType }) {
    const [open, setOpen] = useState(false);

    const menuItems = [
        { label: 'みんなの投稿', value: 'line' },
        { label: '人気投稿', value: 'popular' },
        { label: 'お気に入り', value: 'liked' },
        { label: '自分の投稿', value: 'myPosts' },
    ];

    const handleSelect = (value) => {
        onSelect(value);
        setOpen(false);
    };

    const handleLogout = () => {
        auth.signOut();
    };

    return (
        <>
            <IconButton 
    onClick={() => setOpen(true)} 
    style={{ 
        backgroundColor: '#222', 
        color: 'white', 
        borderRadius: '12px', 
        width: '45px', 
        height: '45px' 
    }}
>
    <MenuIcon />
</IconButton>

            <Drawer
                anchor="left"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    style: {
                        width: '240px',
                        backgroundColor: '#333', // ダークな背景色
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '20px 10px'
                    }
                }}
            >
                <div>
                    <Typography variant="h6" style={{ padding: '10px 16px', fontWeight: 'bold' }}>
                        メニュー
                    </Typography>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem 
                                button 
                                key={item.value} 
                                onClick={() => handleSelect(item.value)}
                                style={{ borderRadius: '8px', marginBottom: '4px' }}
                            >
                                <ListItemIcon style={{ minWidth: '35px' }}>
                                    <Radio
                                        checked={currentType === item.value}
                                        style={{ color: '#fff', padding: 0 }}
                                    />
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItem>
                        ))}
                    </List>
                </div>

                {/* 最下部のログアウトエリア */}
                <div style={{ padding: '10px' }}>
                    <Divider style={{ backgroundColor: '#555', marginBottom: '15px' }} />
                    <div 
                        onClick={handleLogout}
                        style={{ 
                            padding: '10px 16px', 
                            cursor: 'pointer', 
                            fontSize: '14px',
                            color: '#bbb',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        ログアウト
                    </div>
                </div>
            </Drawer>
        </>
    );
}

export default QueryTypeMenu;