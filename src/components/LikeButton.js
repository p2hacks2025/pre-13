// fileName: src/components/LikeButton.js

import React from 'react';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import { IconButton, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

function LikeButton({ message }) {
    const user = auth.currentUser;
    if (!user || !message || !message.id) return null;

    // ★重要: likesオブジェクトの中から自分のUIDを探す（undefinedチェックを徹底）
    const isLiked = !!(message.likes && message.likes[user.uid]);

    const handleLike = async (e) => {
        // 親要素（魚やモーダル）のクリックイベントを止める
        if (e) e.stopPropagation();
        
        const messageRef = db.collection("messages").doc(message.id);

        try {
            if (isLiked) {
                // すでにいいね済みなら解除（削除とカウントダウン）
                await messageRef.update({
                    [`likes.${user.uid}`]: firebase.firestore.FieldValue.delete(),
                    likeCount: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                // 未いいねなら追加（trueの書き込みとカウントアップ）
                await messageRef.update({
                    [`likes.${user.uid}`]: true,
                    likeCount: firebase.firestore.FieldValue.increment(1)
                });

                // 通知の送信（自分の投稿へのいいね以外）
                if (message.uid !== user.uid) {
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
        } catch (error) {
            console.error("いいね処理エラー:", error);
        }
    };

    return (
        <Box display="flex" alignItems="center">
            <IconButton 
                onClick={handleLike} 
                sx={{ 
                    color: isLiked ? '#F06292' : '#ccc',
                    // 連続クリック防止のための視覚フィードバック
                    transition: 'transform 0.1s active',
                    '&:active': { transform: 'scale(1.3)' }
                }}
            >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography sx={{ 
                color: isLiked ? '#F06292' : '#888', 
                fontWeight: 'bold', 
                ml: -0.5, 
                fontSize: '14px',
                minWidth: '20px'
            }}>
                {message.likeCount || 0}
            </Typography>
        </Box>
    );
}

export default LikeButton;