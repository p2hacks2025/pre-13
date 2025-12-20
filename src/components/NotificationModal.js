// fileName: src/components/NotificationModal.js

import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Avatar, List, ListItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { db, auth } from "../firebase.js";

function NotificationModal({ open, onClose }) {
    const [notifications, setNotifications] = useState([]);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user || !open) return;

        // 通知データの取得
        const unsubscribe = db.collection('notifications')
            .where('toUserId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot(s => {
                setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });

        // ★ 通知を既読にする処理
        const markAsRead = async () => {
            const unreadDocs = await db.collection('notifications')
                .where('toUserId', '==', user.uid)
                .where('checked', '==', false)
                .get();

            const batch = db.batch();
            unreadDocs.forEach(doc => {
                batch.update(doc.ref, { checked: true });
            });
            await batch.commit();
        };

        markAsRead();

        return () => unsubscribe();
    }, [user, open]);

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: '400px', maxHeight: '70vh',
                bgcolor: 'white', borderRadius: '20px', p: 3, outline: 'none',
                display: 'flex', flexDirection: 'column'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">通知</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    {notifications.length > 0 ? (
                        <List disablePadding>
                            {notifications.map(n => (
                                <ListItem key={n.id} sx={{ px: 0, py: 1.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Avatar sx={{ 
                                        bgcolor: n.type === 'like' ? '#FFEBEE' : '#E3F2FD', 
                                        color: n.type === 'like' ? '#F06292' : '#2196F3',
                                        width: 40, height: 40 
                                    }}>
                                        {n.type === 'like' ? <FavoriteIcon fontSize="small" /> : <ChatBubbleIcon fontSize="small" />}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography sx={{ fontSize: '13px', lineHeight: 1.4 }}>
                                            <strong>{n.fromUserName}</strong> さんが{n.type === 'like' ? 'いいねしました' : '返信しました'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '11px', color: '#999', mt: 0.5 }}>
                                            {n.type === 'like' ? `"${n.postText?.substring(0, 15)}..."` : `"${n.replyText?.substring(0, 15)}..."`}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography align="center" sx={{ py: 10, color: '#ccc' }}>通知はありません</Typography>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}

export default NotificationModal;