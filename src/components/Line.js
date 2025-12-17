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

function LineContent({ messages, handleIconClick }) {
    // 感情に応じた色の設定
    const getSentimentColor = (s) => {
        switch(s) {
            case '喜': return '#fff9c4'; // 黄色
            case '怒': return '#ffcdd2'; // 赤
            case '哀': return '#bbdefb'; // 青
            case '楽': return '#c8e6c9'; // 緑
            default: return '#f5f5f5';   // グレー
        }
    };

    return (
        <div style={{ marginTop: '70px', paddingBottom: '70px' }}>
            <div className="msgs">
                {messages.map((message) => (
                    <div key={message.id}>
                        <div className={`msg ${message.uid === auth.currentUser.uid ? "sent" : "received"}`}>
                            <img 
                                src={message.photoURL} 
                                alt="" 
                                onClick={() => handleIconClick(message.uid)} 
                                style={{ cursor: 'pointer' }} 
                            /> 
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {/* ★感情ラベルを表示 */}
                                    {message.sentiment && (
                                        <span style={{ 
                                            fontSize: '12px', 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            backgroundColor: getSentimentColor(message.sentiment),
                                            fontWeight: 'bold',
                                            border: '1px solid #ddd'
                                        }}>
                                            AI判定: {message.sentiment}
                                        </span>
                                    )}
                                    <small style={{ color: '#888' }}>
                                        {message.type === 'shallow' ? 'きらきら' : 'やみ'}
                                    </small>
                                </div>
                                <p>{message.text}</p>
                            </div>
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
    
    const [selectedGenre, setSelectedGenre] = useState('大学'); 
    const [selectedQueryType, setSelectedQueryType] = useState('line'); 
    const [postFilterType, setPostFilterType] = useState('shallow');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false); 

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

    useEffect(() => {
        let unsubscribe;
        let query = db.collection("messages");
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; 
        const currentTime = Date.now(); 
        let shouldSubscribe = false;

        if (selectedQueryType === 'myPosts') {
             shouldSubscribe = false;
        } else if (selectedGenre && selectedQueryType) { 
            if (selectedGenre === 'フォロー中') {
                if (followingList.length > 0) {
                    query = query.where('uid', 'in', followingList); 
                    shouldSubscribe = true;
                } else {
                    setMessages([]);
                    return; 
                }
            } else {
                query = query.where('genre', '==', selectedGenre);
                shouldSubscribe = true;
            }
            
            if (postFilterType) {
                query = query.where('type', '==', postFilterType);
            }
            
            if (shouldSubscribe) {
                if (selectedQueryType === 'popular') {
                    query = query.where("likeCount", ">", 0).orderBy("likeCount", "desc").orderBy("createdAt", "desc");
                } else if (selectedQueryType === 'liked') {
                    query = query.where(`likes.${currentUserId}`, '==', true).orderBy("createdAt", "desc");
                } else {
                    query = query.orderBy("createdAt", "desc");
                }
            }
        }

        if (shouldSubscribe) {
            unsubscribe = query.limit(50).onSnapshot((snapshot) => {
                let fetchedMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                if (selectedQueryType === 'line' && selectedGenre !== 'フォロー中') {
                    fetchedMessages = fetchedMessages.filter(m => m.createdAt?.toDate().getTime() && (currentTime - m.createdAt.toDate().getTime() < THREE_DAYS));
                }
                setMessages(fetchedMessages);
            });
        } 
        return () => unsubscribe && unsubscribe();
    }, [currentUserId, followingList, selectedGenre, selectedQueryType, postFilterType]); 

    const handleIconClick = (uid) => console.log("UID:", uid);

    return (
        <div>
            <div style={{ position: 'fixed', top: 0, width: '100%', height: '50px', backgroundColor: 'white', zIndex: 100, borderBottom: '1px solid #ccc' }}>
                <QueryTypeMenu onSelect={setSelectedQueryType} />
                <GenreSelectButton selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
                <SignOut />
            </div>
            
            {selectedQueryType === 'myPosts' ? (
                <UserPosts targetUid={currentUserId} />
            ) : (
                <LineContent messages={messages} handleIconClick={handleIconClick} />
            )}
            
            <PostButton onClick={() => setIsPostModalOpen(true)} />
            
            {selectedQueryType !== 'myPosts' && ( 
                <PostTypeToggle currentFilter={postFilterType} onSelect={setPostFilterType} />
            )}

            <PostModal open={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
        </div>
    );
}

export default Line;