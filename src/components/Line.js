// fileName: src/components/Line.js
import React, { useState, useEffect } from 'react';
import QueryTypeMenu from './QueryTypeMenu'; 
import GenreSelectButton from './GenreSelectButton'; 
import PostButton from './PostButton';      
import PostModal from './PostModal';        
import PostTypeToggle from './PostTypeToggle'; 
import { db, auth } from "../firebase.js";
import UserProfile from './UserProfile'; 
import FishTank from './FishTank'; 
import MessageDetailModal from './MessageDetailModal';
import NotificationModal from './NotificationModal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { IconButton, Box, Badge, Typography } from '@mui/material';

function Line() {
    const [messages, setMessages] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('大学'); 
    const [selectedQueryType, setSelectedQueryType] = useState('line'); 
    const [postFilterType, setPostFilterType] = useState('shallow'); // shallow(浅海/きらきら) or deep(深海/やみ)
    const [isPostModalOpen, setIsPostModalOpen] = useState(false); 
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showTitles, setShowTitles] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    const user = auth.currentUser;

    useEffect(() => {
        let query = db.collection("messages");

        // --- 感情の分類定義 ---
        const shallowSentiments = ['ENJOY', 'EXCITE', 'HEAL'];
        const deepSentiments = ['SAD', 'ANGRY', 'DARK'];
        const targetSentiments = postFilterType === 'shallow' ? shallowSentiments : deepSentiments;

        if (selectedQueryType === 'line') {
            // 通常タイムライン：ジャンルと深さ（投稿時にAIが決めたtype）で取得
            query = query.where("genre", "==", selectedGenre).where("type", "==", postFilterType);
        } else if (selectedQueryType === 'popular') {
            // 人気投稿：いいね1以上
            query = query.where("likeCount", ">=", 1).orderBy("likeCount", "desc");
        } else if (selectedQueryType === 'liked') {
            // お気に入り：自分がいいねしたもの
            query = query.where(`likes.${user.uid}`, "==", true);
        } else if (selectedQueryType === 'myPosts') {
            query = query.where("uid", "==", user.uid);
        }

        const unsubscribe = query.limit(100).onSnapshot((snapshot) => {
            let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // 人気投稿・お気に入り・自分の投稿でも、現在の「浅海・深海モード」に合わせてフィルタリング
            // これにより「お気に入りの海の深海」などが実現される
            if (selectedQueryType !== 'line') {
                fetched = fetched.filter(m => targetSentiments.includes(m.sentiment));
                
                // 人気投稿はいいね順の上位7匹に絞る
                if (selectedQueryType === 'popular') {
                    fetched = fetched.slice(0, 7);
                }
            }

            setMessages(fetched);
        });
        return () => unsubscribe();
    }, [selectedGenre, postFilterType, selectedQueryType, user.uid]);

    // ヘッダー中央に表示する内容
    const renderCenterHeader = () => {
        if (selectedQueryType === 'line') {
            return <GenreSelectButton selectedGenre={selectedGenre} onSelect={setSelectedGenre} />;
        }
        const labels = { popular: '人気の海', liked: 'お気に入りの海', myPosts: '自分の記録' };
        return (
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#333' }}>
                {labels[selectedQueryType] || ''}
            </Typography>
        );
    };

    return (
        <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#f0f2f5', position: 'relative', overflow: 'hidden' }}>
            
            {/* --- ヘッダー領域 --- */}
            <Box sx={{ 
                position: 'fixed', top: 0, width: '100%', zIndex: 1000,
                display: 'flex', alignItems: 'center',
                px: 2, // ボタンが端にめり込まないための余白
                py: 'calc(10px + env(safe-area-inset-top))', 
                bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
                boxSizing: 'border-box'
            }}>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <QueryTypeMenu onSelect={setSelectedQueryType} currentType={selectedQueryType} />
                </Box>

                <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                    {renderCenterHeader()}
                </Box>

                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton onClick={() => setIsNotifModalOpen(true)} sx={{ color: '#333' }}>
                        <Badge color="error" variant="dot" invisible={!hasUnread}>
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <PostButton onClick={() => setIsPostModalOpen(true)} />
                </Box>
            </Box>

            {/* --- メインコンテンツ --- */}
            <Box sx={{ width: '100%', height: '100%' }}>
                {selectedQueryType === 'myPosts' ? (
                    <Box sx={{ pt: '100px', height: '100%', overflowY: 'auto' }} className="scrollable-content">
                        <UserProfile />
                    </Box>
                ) : (
                    <FishTank messages={messages} onFishClick={setSelectedMessage} showTitles={showTitles} />
                )}
            </Box>
            
            {/* --- フッターボタン --- */}
            {selectedQueryType !== 'myPosts' && (
                <>
                    <Box sx={{ position: 'fixed', bottom: 'calc(25px + env(safe-area-inset-bottom))', left: '20px', zIndex: 1000 }}>
                        <IconButton 
                            onClick={() => setShowTitles(!showTitles)} 
                            sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(10px)' }}
                        >
                            {showTitles ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Box>
                    <Box sx={{ position: 'fixed', bottom: 'calc(25px + env(safe-area-inset-bottom))', right: '20px', zIndex: 1000 }}>
                        <PostTypeToggle currentFilter={postFilterType} onSelect={setPostFilterType} />
                    </Box>
                </>
            )}

            {/* モーダル類 */}
            <PostModal 
                open={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)} 
                selectedGenre={selectedGenre} 
                // postFilterTypeは渡さない（PostModal内でAI判定によって自動決定するため）
            />
            <NotificationModal open={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} />
            {selectedMessage && <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
        </Box>
    );
}

export default Line;