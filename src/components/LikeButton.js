// fileName: LikeButton.js (likeCount更新処理を追加 & エラーハンドリング強化)
import React from 'react';
import { db, auth } from '../firebase.js';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import IconButton from '@mui/material/IconButton';
import firebase from "firebase/compat/app"; 
import "firebase/compat/firestore";     

function LikeButton({ message }) {
    const likes = message.likes || {};
    const likeCount = message.likeCount !== undefined ? message.likeCount : Object.keys(likes).length; 
    const isLiked = likes[auth.currentUser.uid] === true;

    const toggleLike = async () => {
        // message.id が存在しない場合は処理を中断 (念のため)
        if (!message.id) {
            console.error("Error: Message ID is missing. Cannot perform update.");
            return;
        }

        const messageRef = db.collection('messages').doc(message.id);
        const userId = auth.currentUser.uid;
        
        let newLikeCount;

        // ★★★ ここからtry/catchブロックを追加 ★★★
        try { 
            if (isLiked) {
                // いいねを解除する
                newLikeCount = likeCount - 1;
                await messageRef.update({
                    // フィールド値の削除
                    [`likes.${userId}`]: firebase.firestore.FieldValue.delete(),
                    likeCount: newLikeCount < 0 ? 0 : newLikeCount 
                });
            } else {
                // いいねを付ける
                newLikeCount = likeCount + 1;
                await messageRef.update({
                    [`likes.${userId}`]: true,
                    likeCount: newLikeCount
                });
            }
            // 成功した場合のログ
            console.log("Like operation successful!");

        } catch (error) {
            // Firestoreからのエラー（セキュリティルール違反など）を捕捉し、ログに出力
            console.error("Firestore Update Failed:", error.code, error.message, error); 
            alert(`いいねに失敗しました。エラーコード: ${error.code}。コンソールを確認してください。`);
        }
        // ★★★ try/catchブロックはここまで ★★★
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