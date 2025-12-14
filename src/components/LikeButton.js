// fileName: LikeButton.js (最終確認の修正案)
import React from 'react';
import { db, auth } from '../firebase.js';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import IconButton from '@mui/material/IconButton';
// ★★★ 以下の2行が必須です ★★★
import firebase from "firebase/compat/app"; 
import "firebase/compat/firestore";     

function LikeButton({ message }) {
    // message.likesはFirestoreで likes: { [uid]: true, ... } の形式を想定
    const likes = message.likes || {};
    const likeCount = Object.keys(likes).length;
    const isLiked = likes[auth.currentUser.uid] === true;

    const toggleLike = async () => {
        const messageRef = db.collection('messages').doc(message.id);
        const userId = auth.currentUser.uid;

        if (isLiked) {
            // いいねを解除する (ユーザーIDのフィールドを削除)
            await messageRef.update({
                // この行でfirebaseが使用されている
                [`likes.${userId}`]: firebase.firestore.FieldValue.delete() 
            });
        } else {
            // いいねを付ける (ユーザーIDをキーにtrueを設定)
            await messageRef.update({
                [`likes.${userId}`]: true
            });
        }
    };
    
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
                size="small"
                onClick={toggleLike}
                style={{ color: isLiked ? 'blue' : 'gray' }} 
            >
                <ThumbUpIcon fontSize="inherit" />
            </IconButton>
            <span style={{ fontSize: '12px', marginLeft: '2px' }}>
                {likeCount > 0 ? likeCount : ''}
            </span>
        </div>
    );
}

export default LikeButton;