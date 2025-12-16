// fileName: UserPosts.js

import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import LikeButton from './LikeButton';
// import FavoriteButton from './FavoriteButton'; // ★削除済み★
import firebase from "firebase/compat/app";
import { Button } from '@mui/material';

function UserPosts({ targetUid }) {
    const [messages, setMessages] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [targetUserPhotoURL, setTargetUserPhotoURL] = useState(null);
    const [targetUserName, setTargetUserName] = useState("Unknown User");
    const currentUserId = auth.currentUser.uid;

    const isCurrentUser = targetUid === currentUserId;

    // 1. 投稿メッセージの取得
    useEffect(() => {
        if (!targetUid) return;

        const unsubscribe = db.collection("messages")
            .where("uid", "==", targetUid)
            .orderBy("createdAt", "desc")
            .limit(50)
            .onSnapshot((snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(fetchedMessages);
            });

        return () => unsubscribe();
    }, [targetUid]);

    // 2. ユーザー情報（名前、写真）の取得
    useEffect(() => {
        if (!targetUid) return;

        // 投稿のphotoURLからユーザー情報を仮定する（実際のユーザープロフィール機能がない場合）
        if (messages.length > 0) {
            setTargetUserPhotoURL(messages[0].photoURL);
            // 投稿にuserNameフィールドがあればそれを設定するロジックを追加可能
        } else {
             setTargetUserPhotoURL(null);
        }
        
        // Firestoreからユーザー名を取得するロジックを追加する場合はここに記述
        // 例: db.collection('users').doc(targetUid).get().then(doc => { setTargetUserName(doc.data().name) })

    }, [targetUid, messages]);
    
    // 3. フォロー状態の確認
    useEffect(() => {
        if (isCurrentUser) {
            setIsFollowing(false);
            return;
        }

        const unsubscribe = db.collection('follows').doc(currentUserId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const followingMap = doc.data().following || {};
                    setIsFollowing(!!followingMap[targetUid]);
                } else {
                    setIsFollowing(false);
                }
            });
        
        return () => unsubscribe();
    }, [currentUserId, targetUid, isCurrentUser]);

    // 4. フォロー/アンフォロー処理
    const handleFollow = async () => {
        if (isCurrentUser) return;

        const followRef = db.collection('follows').doc(currentUserId);
        const targetFollowRef = db.collection('followers').doc(targetUid);
        const batch = db.batch();

        if (isFollowing) {
            // アンフォロー処理
            batch.update(followRef, {
                [`following.${targetUid}`]: firebase.firestore.FieldValue.delete()
            });
            batch.update(targetFollowRef, {
                [`followers.${currentUserId}`]: firebase.firestore.FieldValue.delete()
            });
        } else {
            // フォロー処理
            batch.set(followRef, { 
                following: { [targetUid]: true } 
            }, { merge: true });
            batch.set(targetFollowRef, { 
                followers: { [currentUserId]: true } 
            }, { merge: true });
        }

        try {
            await batch.commit();
        } catch (error) {
            console.error("Follow/Unfollow failed:", error);
        }
    };

    return (
        <div style={{ padding: '20px', marginTop: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                {targetUserPhotoURL && (
                    <img 
                        src={targetUserPhotoURL} 
                        alt="Profile" 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px' }} 
                    />
                )}
                <div>
                    <h3>{isCurrentUser ? "自分の投稿" : targetUserName + "の投稿"}</h3>
                    {!isCurrentUser && (
                        <Button 
                            variant="contained" 
                            color={isFollowing ? "default" : "primary"} 
                            onClick={handleFollow}
                            size="small"
                        >
                            {isFollowing ? "フォロー中" : "フォローする"}
                        </Button>
                    )}
                </div>
            </div>

            <h4 style={{ textAlign: 'center' }}>投稿リスト</h4>
            
            <div className="msgs">
                {messages.length > 0 ? (
                    messages.map((message) => (
                        <div key={message.id}>
                            <div className={`msg ${
                                message.uid === auth.currentUser.uid ?
                                "sent" : "received"}`
                                }>
                                {/* メッセージアイコンはクリック不可とするか、親コンポーネントに戻るロジックが必要 */}
                                <img 
                                    src={message.photoURL} 
                                    alt="" 
                                /> 
                                <p>
                                    {message.text}
                                    <small> ({message.type === 'shallow' ? 'きらきら' : 'やみ'})</small>
                                </p>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <LikeButton message={message} />
                                    {/* FavoriteButton は削除されました */}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>
                        {isCurrentUser ? "まだ投稿がありません。" : "このユーザーの投稿はありません。"}
                    </p>
                )}
            </div>
        </div>
    );
}

export default UserPosts;