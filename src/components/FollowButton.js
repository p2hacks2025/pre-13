// fileName: FollowButton.js (修正済み)

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase.js'; 
import { Button } from '@mui/material';
import firebase from "firebase/compat/app";

function FollowButton({ targetUid }) {
    const currentUserId = auth.currentUser?.uid;

    // ★★★ Hooksは常にトップレベルで呼ぶ ★★★
    const [isFollowing, setIsFollowing] = useState(false);

    // フォロー/フォロワー関係のドキュメント参照
    const followRef = currentUserId ? db.collection('follows').doc(currentUserId) : null;

    // 状態の監視 (useEffect は常に実行)
    useEffect(() => {
        if (!followRef || !targetUid || currentUserId === targetUid) {
            setIsFollowing(false);
            return undefined;
        }

        const unsubscribe = followRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setIsFollowing(data.following?.[targetUid] === true);
            } else {
                setIsFollowing(false);
            }
        });

        return () => unsubscribe();
    }, [followRef, targetUid, currentUserId]);

    // フォロー/アンフォローの切り替え
   const toggleFollow = async () => {
        try {
            if (isFollowing) {
                // アンフォロー
                await followRef.update({
                    // ユーザーIDのフィールドを削除
                    [`following.${targetUid}`]: firebase.firestore.FieldValue.delete()
                });
            } else {
                // フォロー (ドキュメントが存在しない場合は新規作成される)
                await followRef.set({
                    following: {
                        [targetUid]: true 
                    }
                }, { merge: true }); // merge: true で、既存のfollowingマップを上書きせずに更新/作成
            }
        } catch (error) {
            console.error("フォロー状態の更新中にエラーが発生しました:", error); // ★★★ ここにエラーが出ているか確認
        }
    };

    // ★★★ 修正箇所2: Hooksの後に条件付きreturnを移動 ★★★
    if (!currentUserId || !targetUid || currentUserId === targetUid) {
         return null; 
    }
    // ★★★ 修正完了 ★★★

    return (
        <Button
            variant={isFollowing ? "outlined" : "contained"}
            size="small"
            onClick={toggleFollow}
            sx={{
                ml: 1,
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 'bold',
                minWidth: '90px',
                backgroundColor: isFollowing ? '#fff' : '#0288d1',
                color: isFollowing ? '#0288d1' : '#fff',
                borderColor: '#0288d1',
                '&:hover': {
                    backgroundColor: isFollowing ? '#f0f8ff' : '#0277bd',
                    borderColor: '#0277bd'
                }
            }}
        >
            {isFollowing ? 'フォロー中' : 'フォローする'}
        </Button>
    );
}

export default FollowButton;
