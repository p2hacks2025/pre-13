// fileName: src/components/QueryTypeMenu.js

import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, Typography, Avatar, Box, Divider } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { auth } from '../firebase';

// アイコン類
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'; // プロフィール
import WavesIcon from '@mui/icons-material/Waves';               // 自分の海
import StarBorderIcon from '@mui/icons-material/StarBorder';     // 人気
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // お気に入り

function QueryTypeMenu({ onSelect, currentType }) {
    const [open, setOpen] = useState(false);
    const user = auth.currentUser;

    // 指定された4つのメニュー項目
    const menuItems = [
        { label: 'プロフィール', value: 'myPosts', icon: <PersonOutlineIcon sx={{ fontSize: 28 }} /> },
        { label: '自分の海', value: 'line', icon: <WavesIcon sx={{ fontSize: 28 }} /> },
        { label: '人気のおさかな', value: 'popular', icon: <StarBorderIcon sx={{ fontSize: 28 }} /> },
        { label: 'お気に入りのおさかな', value: 'liked', icon: <FavoriteBorderIcon sx={{ fontSize: 28 }} /> },
    ];

    const handleSelect = (value) => {
        if (value) {
            onSelect(value);
            setOpen(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("ログアウトしますか？")) {
            auth.signOut();
            setOpen(false);
        }
    };

    return (
        <>
            {/* 左上のヨットアイコンボタン */}
            <IconButton 
                onClick={() => setOpen(true)} 
                style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    width: '45px', 
                    height: '45px',
                    padding: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
            >
                <img 
                    src={process.env.PUBLIC_URL + '/icon_boat.png'} 
                    alt="Menu" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
            </IconButton>

            {/* ドロワー（メニューの中身） */}
            <Drawer
                anchor="left"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    style: {
                        width: '280px', 
                        backgroundColor: '#fff', 
                        color: '#0f1419',
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* 1. ユーザー情報ヘッダー (IDとフォロー数を削除) */}
                    <Box sx={{ p: 2, pt: 3, pb: 2 }}>
                        <Avatar 
                            src={user?.photoURL} 
                            sx={{ width: 50, height: 50, mb: 1.5, border: '1px solid #eee' }} 
                        />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', lineHeight: 1.2 }}>
                            {user?.displayName || "ゲストユーザー"}
                        </Typography>
                    </Box>

                    {/* 2. メインメニューリスト */}
                    <List sx={{ pt: 0 }}>
                        {menuItems.map((item) => {
                            const isSelected = currentType === item.value;
                            return (
                                <ListItem 
                                    button 
                                    key={item.label} 
                                    onClick={() => handleSelect(item.value)}
                                    sx={{ 
                                        py: 2, 
                                        '&:hover': { backgroundColor: '#f7f9f9' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: '45px', color: isSelected ? '#1d9bf0' : '#0f1419' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <Typography 
                                        sx={{ 
                                            fontWeight: isSelected ? '800' : 'bold',
                                            fontSize: '18px', 
                                            color: isSelected ? '#1d9bf0' : '#0f1419' 
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </ListItem>
                            );
                        })}
                    </List>

                    <Divider sx={{ my: 1 }} />

                    {/* 3. ログアウト */}
                    <List>
                        <ListItem button onClick={handleLogout}>
                            <Typography sx={{ fontSize: '15px', fontWeight: 'bold', color: '#E53935', pl: 2 }}>
                                ログアウト
                            </Typography>
                        </ListItem>
                    </List>

                </Box>
            </Drawer>
        </>
    );
}

export default QueryTypeMenu;