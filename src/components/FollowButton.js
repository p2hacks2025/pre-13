// fileName: FollowButton.js (修正済み)

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase.js'; 
import { Button } from '@mui/material';
import firebase from "firebase/compat/app";

function FollowButton({ targetUid }) {
    const currentUserId = auth.currentUser.uid;
    
    // ★★★ 修正箇所1: Hooksを常にトップレベルで呼び出す ★★★
    const [isFollowing, setIsFollowing] = useState(false);
    
    // フォロー/フォロワー関係のドキュメント参照
    const followRef = db.collection('follows').doc(currentUserId);
    
    // 状態の監視 (useEffect は常に実行)
    useEffect(() => {
        // targetUidが自分自身でないことを確認してから処理
        if (currentUserId === targetUid) return; 

        const unsubscribe = followRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setIsFollowing(data.following?.[targetUid] === true);
            } else {
                setIsFollowing(false);
            }
        });

        return () => unsubscribe();
    }, [targetUid, currentUserId]); // currentUserId も依存配列に追加

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
    if (currentUserId === targetUid) {
         return null; 
    }
    // ★★★ 修正完了 ★★★

    return (
        <Button 
            variant="contained" 
            onClick={toggleFollow} 
            style={{ 
                backgroundColor: isFollowing ? 'gray' : '#007bff', 
                color: 'white',
                marginTop: '10px'
            }}
        >
            {isFollowing ? 'フォロー中' : 'フォローする'}
        </Button>
    );
}

export default FollowButton;