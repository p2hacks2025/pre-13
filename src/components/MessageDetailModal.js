// fileName: src/components/MessageDetailModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, Avatar, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import FollowButton from "./FollowButton";

// ★追加: 感情ごとの色とラベル定義
// 背景色は文字色をベースに薄くしたものを想定
const sentimentConfig = {
    ENJOY: { label: '楽しい', color: '#ffb300', bgColor: '#fff8e1' }, // 浅海
    EXCITE: { label: 'わくわく', color: '#ff7043', bgColor: '#fbe9e7' }, // 浅海
    HEAL:   { label: '癒やし', color: '#66bb6a', bgColor: '#e8f5e9' }, // 浅海
    SAD:    { label: '悲しい', color: '#42a5f5', bgColor: '#e3f2fd' }, // 深海
    ANGRY:  { label: '怒り',   color: '#ef5350', bgColor: '#ffebee' }, // 深海
    DARK:   { label: '暗い気持ち', color: '#7e57c2', bgColor: '#f3e5f5' }, // 深海(予備)
};

function MessageDetailModal({ message: initialMessage, onClose }) {
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState(initialMessage);
    const user = auth.currentUser;

    // リアルタイム更新
    useEffect(() => {
        if (!initialMessage?.id) return;
        const unsubscribe = db.collection("messages").doc(initialMessage.id)
            .onSnapshot(doc => {
                if (doc.exists) {
                    setMessage({ id: doc.id, ...doc.data() });
                }
            });
        return () => unsubscribe();
    }, [initialMessage]);

    // コメント取得
    useEffect(() => {
        if (!initialMessage?.id) return;
        const unsubscribe = db.collection("messages").doc(initialMessage.id).collection("comments")
            .orderBy("createdAt", "asc")
            .onSnapshot(snapshot => {
                setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return () => unsubscribe();
    }, [initialMessage]);

    const handleLike = async () => {
        if (!user || !message) return;
        const isLiked = message.likes && message.likes[user.uid];
        const ref = db.collection("messages").doc(message.id);

        if (isLiked) {
            await ref.update({
                [`likes.${user.uid}`]: firebase.firestore.FieldValue.delete(),
                likeCount: firebase.firestore.FieldValue.increment(-1)
            });
        } else {
            await ref.update({
                [`likes.${user.uid}`]: true,
                likeCount: firebase.firestore.FieldValue.increment(1)
            });

            // 通知: 自分以外の投稿へのいいねのみ
            if (message.uid && user.uid !== message.uid) {
                await db.collection("notifications").add({
                    type: "like",
                    fromUserId: user.uid,
                    fromUserName: user.displayName,
                    toUserId: message.uid,
                    postId: message.id,
                    postText: message.text,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    checked: false
                });
            }
        }
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        await db.collection("messages").doc(message.id).collection("comments").add({
            text: commentText,
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 通知: 自分以外の投稿にコメントした場合
        if (message.uid && user.uid !== message.uid) {
            await db.collection("notifications").add({
                type: "comment",
                fromUserId: user.uid,
                fromUserName: user.displayName,
                toUserId: message.uid,
                postId: message.id,
                postText: message.text,
                replyText: commentText.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                checked: false
            });
        }
        setCommentText("");
    };

    const handleDelete = async () => {
        if (window.confirm("本当にこの投稿を削除しますか？")) {
            await db.collection("messages").doc(message.id).delete();
            onClose();
        }
    };

    if (!message) return null;

    const isLiked = message.likes && message.likes[user?.uid];
    const likeCount = message.likeCount || 0;

    // 感情設定を取得（なければデフォルトENJOY）
    const currentSentiment = message.sentiment || 'ENJOY';
    const config = sentimentConfig[currentSentiment] || sentimentConfig['ENJOY'];

    return (
        <Modal open={!!message} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: 500, bgcolor: 'white', borderRadius: '20px', p: 4,
                outline: 'none', boxShadow: 24, maxHeight: '90vh', overflowY: 'auto', pb: '120px'
            }}>
                {/* ヘッダーエリア */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={message.photoURL} sx={{ width: 36, height: 36, border: '1px solid #eee' }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1 }}>{message.displayName}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                {message.createdAt ? new Date(message.createdAt.toDate()).toLocaleString() : ""}
                            </Typography>
                        </Box>
                        {user && message.uid && user.uid !== message.uid && (
                            <FollowButton targetUid={message.uid} />
                        )}
                    </Box>
                    <Box>
                        {user && user.uid === message.uid && (
                            <IconButton onClick={handleDelete} color="error" size="small" sx={{ mr: 1 }}>
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                    </Box>
                </Box>

                {/* ★追加: 感情ラベル */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    <Box sx={{ 
                        bgcolor: config.bgColor, 
                        color: config.color,
                        px: 1.5, py: 0.5, 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        border: `1px solid ${config.color}40`, // 薄い枠線
                        whiteSpace: 'nowrap'
                    }}>
                        {config.label}
                    </Box>
                </Box>
                
                {/* 本文 */}
                {message.text && !(message.mediaURL && message.text === "画像を投稿しました") && (
                    <Typography
                        variant="body1"
                        sx={{
                            lineHeight: 1.8,
                            mb: 3,
                            whiteSpace: 'pre-wrap',
                            color: '#444',
                            opacity: 0,
                            transform: 'translateY(6px)',
                            animation: 'textReveal 420ms ease forwards',
                            '@keyframes textReveal': {
                                from: { opacity: 0, transform: 'translateY(6px)' },
                                to: { opacity: 1, transform: 'translateY(0)' }
                            }
                        }}
                    >
                        {message.text}
                    </Typography>
                )}

                {/* 画像・動画の表示 */}
                {message.mediaURL && (
                    <Box
                        sx={{
                            mb: 3,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid #f0f0f0',
                            maxHeight: '45vh',
                            bgcolor: '#00000008'
                        }}
                    >
                        {message.mediaType === 'video' ? (
                            <video
                                controls
                                src={message.mediaURL}
                                style={{
                                    width: '100%',
                                    maxHeight: '45vh',
                                    display: 'block',
                                    objectFit: 'contain',
                                    backgroundColor: '#000'
                                }}
                            />
                        ) : (
                            <img
                                src={message.mediaURL}
                                alt="uploaded"
                                style={{
                                    width: '100%',
                                    maxHeight: '45vh',
                                    display: 'block',
                                    objectFit: 'contain',
                                    backgroundColor: '#000'
                                }}
                            />
                        )}
                    </Box>
                )}

                {/* アクションボタン */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Button 
                        onClick={handleLike}
                        startIcon={isLiked ? <FavoriteIcon sx={{ color: '#ff4081' }} /> : <FavoriteBorderIcon />}
                        sx={{ 
                            color: isLiked ? '#ff4081' : '#666', 
                            borderRadius: '20px', 
                            textTransform: 'none',
                            bgcolor: isLiked ? '#ff408111' : 'transparent',
                            px: 2
                        }}
                    >
                        {likeCount}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ bgcolor: '#f5f5f5', px: 1.5, py: 0.5, borderRadius: '10px' }}>
                        {message.genre}
                    </Typography>
                </Box>

                {/* コメント一覧 */}
                <Box sx={{ borderTop: '1px solid #eee', pt: 2, mb: 2 }}>
                    {comments.map(c => (
                        <Box key={c.id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                            <Avatar src={c.photoURL} sx={{ width: 28, height: 28 }} />
                            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: '12px', flex: 1 }}>
                                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>{c.displayName}</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{c.text}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* コメント入力欄 */}
                <Box sx={{ 
                    position: 'sticky',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex', 
                    gap: 1, 
                    py: 1,
                    bgcolor: 'white',
                    borderTop: '1px solid #eee'
                }}>
                    <TextField 
                        fullWidth size="small" placeholder="コメントする..."
                        value={commentText} onChange={(e) => setCommentText(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
                    />
                    <IconButton color="primary" onClick={handleSendComment} disabled={!commentText.trim()}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </Box>
        </Modal>
    );
}

export default MessageDetailModal;
