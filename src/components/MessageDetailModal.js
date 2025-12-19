// fileName: src/components/MessageDetailModal.js

import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, IconButton, Divider, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import LikeButton from './LikeButton';

function MessageDetailModal({ message: initialMessage, onClose }) {
    const [liveMessage, setLiveMessage] = useState(initialMessage);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(false);
    const user = auth.currentUser;

    // 感情ごとのデザイン設定
    const sentimentConfig = {
        ENJOY: { bg: 'rgba(251, 192, 45, 0.15)', color: '#FBC02D', label: '楽しい' },
        SAD: { bg: 'rgba(3, 155, 229, 0.15)', color: '#039BE5', label: 'かなしい' },
        ANGRY: { bg: 'rgba(229, 57, 53, 0.15)', color: '#E53935', label: '怒り' },
        EXCITE: { bg: 'rgba(240, 98, 146, 0.15)', color: '#F06292', label: 'ワクワク' },
        HEAL: { bg: 'rgba(67, 160, 71, 0.15)', color: '#43A047', label: '癒やし' },
        DARK: { bg: 'rgba(66, 66, 66, 0.15)', color: '#424242', label: 'どんより' },
    };

    useEffect(() => {
        if (!initialMessage?.id) return;
        const unsubscribe = db.collection("messages").doc(initialMessage.id)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    setLiveMessage({ id: doc.id, ...doc.data() });
                }
            });
        return () => unsubscribe();
    }, [initialMessage?.id]);

    useEffect(() => {
        if (!initialMessage?.id) return;
        const unsubscribe = db.collection("messages").doc(initialMessage.id)
            .collection("replies")
            .orderBy("createdAt", "asc")
            .onSnapshot((snapshot) => {
                setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return () => unsubscribe();
    }, [initialMessage?.id]);

    const handleSendReply = async () => {
        if (!replyText.trim() || loading) return;
        setLoading(true);
        try {
            await db.collection("messages").doc(liveMessage.id).collection("replies").add({
                text: replyText,
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (liveMessage.uid !== user.uid) {
                await db.collection("notifications").add({
                    type: "reply",
                    fromUserId: user.uid,
                    fromUserName: user.displayName,
                    toUserId: liveMessage.uid,
                    postId: liveMessage.id,
                    postText: liveMessage.text,
                    replyText: replyText,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    checked: false
                });
            }
            setReplyText("");
        } catch (e) {
            console.error("Reply error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!liveMessage) return null;

    const currentSentiment = sentimentConfig[liveMessage.sentiment];

    return (
        <Modal open={!!initialMessage} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
                width: '92%', maxWidth: '450px', maxHeight: '80vh',
                bgcolor: 'white', borderRadius: '24px', p: 3, outline: 'none',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
            }}>
                {/* ヘッダー: ユーザー情報と感情ラベル */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar src={liveMessage.photoURL} sx={{ width: 44, height: 44, border: '1.5px solid #f8f8f8' }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#222', lineHeight: 1.2 }}>
                                {liveMessage.displayName}
                            </Typography>
                            {currentSentiment && (
                                <Box sx={{ 
                                    display: 'inline-block', mt: 0.4, px: 1, py: 0.2, 
                                    borderRadius: '6px', bgcolor: currentSentiment.bg 
                                }}>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 800, color: currentSentiment.color }}>
                                        {currentSentiment.label}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#eee' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ overflowY: 'auto', flexGrow: 1, mb: 2, pr: 0.5 }}>
                    {/* 本文 (タイトルの表示を削除しました) */}
                    <Typography variant="body1" sx={{ 
                        whiteSpace: 'pre-wrap', mb: 3, color: '#333', 
                        lineHeight: 1.8, fontSize: '16px', fontWeight: 500
                    }}>
                        {liveMessage.text}
                    </Typography>
                    
                    {/* いいねボタンエリア */}
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <LikeButton message={liveMessage} />
                    </Box>

                    <Divider sx={{ my: 2.5 }}>
                        <Typography variant="caption" sx={{ color: '#ccc', fontWeight: 800, letterSpacing: '1px' }}>
                            REPLIES
                        </Typography>
                    </Divider>

                    {/* 返信一覧 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {replies.map(reply => (
                            <Box key={reply.id} sx={{ display: 'flex', gap: 1.5 }}>
                                <Avatar src={reply.photoURL} sx={{ width: 32, height: 32 }} />
                                <Box sx={{ 
                                    bgcolor: '#f9f9f9', px: 2, py: 1.2, 
                                    borderRadius: '18px', borderTopLeftRadius: '4px', flexGrow: 1 
                                }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#999', mb: 0.3 }}>
                                        {reply.displayName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '14.5px', color: '#444', lineHeight: 1.5 }}>
                                        {reply.text}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        {replies.length === 0 && (
                            <Typography align="center" sx={{ color: '#ddd', py: 2, fontSize: '14px' }}>
                                まだ返信はありません
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* 入力エリア */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2, borderTop: '1px solid #f5f5f5' }}>
                    <TextField
                        fullWidth size="small" placeholder="あたたかい言葉をかけよう..."
                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        autoComplete="off"
                        sx={{ 
                            '& .MuiOutlinedInput-root': { 
                                borderRadius: '24px', 
                                bgcolor: '#f0f2f5',
                                px: 2,
                                '& fieldset': { border: 'none' }
                            } 
                        }}
                    />
                    <IconButton 
                        onClick={handleSendReply} 
                        disabled={!replyText.trim() || loading}
                        sx={{ 
                            bgcolor: '#4285F4', color: 'white', 
                            '&:hover': { bgcolor: '#3367D6' }, 
                            '&.Mui-disabled': { bgcolor: '#eee', color: '#ccc' },
                            width: 40, height: 40
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Box>
            </Box>
        </Modal>
    );
}

export default MessageDetailModal;