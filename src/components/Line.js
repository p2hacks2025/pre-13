// fileName: Line.js

import React, { useState, useEffect } from 'react';
import SignOut from './SignOut';          
import QueryTypeMenu from './QueryTypeMenu'; 
import GenreSelectButton from './GenreSelectButton'; 
import PostButton from './PostButton';      
import PostModal from './PostModal';        
import PostTypeToggle from './PostTypeToggle'; 
import { db, auth } from "../firebase.js";
import LikeButton from './LikeButton'; 
import UserPosts from './UserPosts'; 
import firebase from "firebase/compat/app";
import { Button } from '@mui/material'; 

// メッセージ一覧表示コンポーネント (LineContent)
function LineContent({ messages, handleIconClick }) {
    return (
        <div style={{ marginTop: '70px', paddingBottom: '70px' }}> {/* 下部ボタンとの重なりを避けるためpaddingを調整 */}
            <div className="msgs">
                {messages.map((message) => (
                    <div key={message.id}>
                        <div className={`msg ${
                            message.uid === auth.currentUser.uid ?
                            "sent" : "received"}`
                            }>
                            <img 
                                src={message.photoURL} 
                                alt="" 
                                onClick={() => handleIconClick(message.uid)} 
                                style={{ cursor: 'pointer' }} 
                            /> 
                            <p>
                                {message.text} 
                                <small> ({message.type === 'shallow' ? 'きらきら' : 'やみ'})</small>
                            </p>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <LikeButton message={message} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function Line() {
    const [messages, setMessages] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const currentUserId = auth.currentUser.uid; 
    
    // フィルタリングの状態
    const [selectedGenre, setSelectedGenre] = useState('大学'); 
    const [selectedQueryType, setSelectedQueryType] = useState('line'); 
    const [postFilterType, setPostFilterType] = useState('shallow'); // デフォルトは 'shallow' (きらきら)
    
    // UIの状態
    const [isPostModalOpen, setIsPostModalOpen] = useState(false); 

    // 1. フォローリストの取得
    useEffect(() => {
        const unsubscribe = db.collection('follows').doc(currentUserId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const followingMap = doc.data().following || {};
                    setFollowingList(Object.keys(followingMap));
                } else {
                    setFollowingList([]);
                }
            });
        return () => unsubscribe();
    }, [currentUserId]);


    // 2. データ取得ロジック (selectedGenre, selectedQueryType, postFilterType に依存)
    useEffect(() => {
        let unsubscribe;
        let query = db.collection("messages");

        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; 
        const currentTime = Date.now(); 
        
        let shouldSubscribe = false;
        
        // --- クエリの構築ロジック ---
        
        // 1. 自分の投稿 (myPosts) の場合
        if (selectedQueryType === 'myPosts') {
             shouldSubscribe = false;
        } 
        // 2. その他の場合 (ジャンルフィルタリングが必要)
        else if (selectedGenre && selectedQueryType) { 
            
            // a. ジャンルによるフィルタリング
            if (selectedGenre === 'フォロー中') {
                if (followingList.length > 0) {
                    query = query.where('uid', 'in', followingList); 
                    shouldSubscribe = true;
                } else {
                    setMessages([]);
                    return; 
                }
            } else {
                // '大学', '恋愛', '勉強' のいずれか: 'genre' フィールドでフィルタ
                query = query.where('genre', '==', selectedGenre);
                shouldSubscribe = true;
            }
            
            // b. 投稿タイプ (きらきら/やみ) によるフィルタリング
            if (postFilterType) {
                query = query.where('type', '==', postFilterType);
            }
            
            // c. クエリタイプによるフィルタリング
            if (shouldSubscribe) {
                if (selectedQueryType === 'popular') {
                    // ★★★ 人気投稿の場合: likeCount > 0 の条件を追加 ★★★
                    query = query
                        .where("likeCount", ">", 0) 
                        .orderBy("likeCount", "desc")
                        .orderBy("createdAt", "desc");
                        
                } else if (selectedQueryType === 'liked') {
                    // いいね: genre, type, likes.UID (== true)
                    query = query.where(`likes.${currentUserId}`, '==', true) 
                                 .orderBy("createdAt", "desc");
                } else { // 'line' (みんなの投稿) の場合
                    // みんな: genre, type, createdAt (降順)
                    query = query.orderBy("createdAt", "desc");
                }
            }

        } else {
             setMessages([]); 
        }
        
        // --- 購読実行 ---
        if (shouldSubscribe) {
            unsubscribe = query.limit(50)
                .onSnapshot((snapshot) => {
                    let fetchedMessages = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // 'line' (みんなの投稿) の場合のみ、3日制限を適用
                    if (selectedQueryType === 'line' && selectedGenre !== 'フォロー中') {
                        fetchedMessages = fetchedMessages.filter(message => {
                            const postTime = message.createdAt?.toDate().getTime();
                            return postTime && (currentTime - postTime < THREE_DAYS); 
                        });
                    }
                    
                    setMessages(fetchedMessages);

                }, (error) => {
                    console.error("Error fetching messages:", error);
                    setMessages([]);
                });
        } 

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUserId, followingList, selectedGenre, selectedQueryType, postFilterType]); 

    
    // 3. handleIconClick (ユーザープロフィール画面へ遷移)
    const handleIconClick = (uid) => {
        console.log(`User profile clicked for UID: ${uid}`);
    };
    
    // 4. 投稿リストの描画
    const renderContent = () => {
        
        // 自分の投稿 ('myPosts') の場合
        if (selectedQueryType === 'myPosts') {
             return <UserPosts targetUid={currentUserId} postType={postFilterType} />; 
        } 
        
        const currentQueryLabel = (type) => {
             const types = [
                { key: 'line', label: 'みんなの投稿' },
                { key: 'popular', label: '人気投稿' },
                { key: 'liked', label: 'いいねした投稿' }
             ];
             return types.find(t => t.key === type)?.label || '';
        };

        const isFollowGenreEmpty = selectedGenre === 'フォロー中' && followingList.length === 0;
        
        // 表示中のタイプ (きらきら or やみ)
        const currentPostTypeLabel = postFilterType === 'shallow' ? 'きらきら' : 'やみ';

        if (isFollowGenreEmpty) {
            return (
                <p style={{ marginTop: '70px', padding: '20px', textAlign: 'center' }}>
                    誰もフォローしてない
                </p>
            );
        } else if (messages.length === 0 && selectedGenre && selectedQueryType !== 'myPosts') {
             // 「人気投稿」で結果が0件の場合のメッセージを調整
             const notFoundMessage = selectedQueryType === 'popular' && messages.length === 0
                 ? "人気の投稿がねい"
                 : `「${currentPostTypeLabel}」投稿は見つかりませんでした。`;

             return (
                <p style={{ marginTop: '70px', padding: '20px', textAlign: 'center' }}>
                    「{selectedGenre}」ジャンルで、{notFoundMessage}
                </p>
            );
        } else {
             // 通常のメッセージリスト表示
             return (
                 <LineContent 
                    messages={messages} 
                    handleIconClick={handleIconClick} 
                 />
             );
        }
    };

    return (
        <div>
            {/* 画面上部の固定要素 (ヘッダー) */}
            <div style={{ position: 'fixed', top: 0, width: '100%', height: '50px', backgroundColor: 'white', zIndex: 100, borderBottom: '1px solid #ccc' }}>
                
                {/* 左上メニュー (人気, 自分, いいね, みんな) */}
                <QueryTypeMenu 
                    onSelect={setSelectedQueryType} 
                />
                
                {/* 中央ジャンル選択 */}
                <GenreSelectButton 
                    selectedGenre={selectedGenre}
                    onSelect={setSelectedGenre}
                />
                
                {/* 右上ログアウト */}
                <SignOut />
                
            </div>
            
            {/* メインコンテンツ (ヘッダーの高さ分、下げる) */}
            {renderContent()}
            
            {/* 画面下部の固定要素 */}
            <PostButton onClick={() => setIsPostModalOpen(true)} />
            
            {/* 画面下部中央のトグルボタン */}
            {selectedQueryType !== 'myPosts' && selectedQueryType !== 'liked' && ( // 「いいねした投稿」では投稿タイプフィルターを非表示に
                <PostTypeToggle 
                    currentFilter={postFilterType} 
                    onSelect={setPostFilterType} 
                />
            )}

            <PostModal 
                open={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)} 
            />
        </div>
    );
}

export default Line;