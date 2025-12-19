// fileName: src/components/Line.js
import React, { useState, useEffect } from 'react';
import QueryTypeMenu from './QueryTypeMenu'; 
import GenreSelectButton from './GenreSelectButton'; 
import PostButton from './PostButton';      
import PostModal from './PostModal';        
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
    const [postFilterType, setPostFilterType] = useState('shallow'); 
    const [isPostModalOpen, setIsPostModalOpen] = useState(false); 
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showTitles, setShowTitles] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // --- スワイプ管理 ---
    const [touchStart, setTouchStart] = useState(null);
    const [touchCurrent, setTouchCurrent] = useState(null); 
    const [touchOffset, setTouchOffset] = useState(0); 
    
    const SWIPE_THRESHOLD = 80;
    const user = auth.currentUser;

    const swipeRatio = Math.min(Math.max(touchOffset / 120, -1), 1);
    const shallowOpacity = postFilterType === 'shallow' ? 1 - Math.max(0, swipeRatio) : Math.max(0, -swipeRatio);
    const deepOpacity = postFilterType === 'deep' ? 1 + Math.min(0, swipeRatio) : Math.max(0, swipeRatio);

    const handleTouchStart = (e) => {
        if (selectedQueryType === 'myPosts') return;
        const touch = e.targetTouches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
        setTouchCurrent({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchMove = (e) => {
        if (!touchStart) return;
        const touch = e.targetTouches[0];
        setTouchCurrent({ x: touch.clientX, y: touch.clientY });
        setTouchOffset(touchStart.y - touch.clientY);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchCurrent) return;
        const diffX = touchStart.x - touchCurrent.x;
        const diffY = touchStart.y - touchCurrent.y;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        const GENRES = ['大学', '恋愛', '勉強', '自由', 'フォロー中'];

        if (absX > absY && absX > SWIPE_THRESHOLD && selectedQueryType === 'line') {
            const currentIndex = GENRES.indexOf(selectedGenre);
            if (currentIndex !== -1) {
                if (diffX > 0) {
                    const nextIndex = (currentIndex + 1) % GENRES.length;
                    setSelectedGenre(GENRES[nextIndex]);
                } else {
                    const prevIndex = (currentIndex - 1 + GENRES.length) % GENRES.length;
                    setSelectedGenre(GENRES[prevIndex]);
                }
            }
        }
        else if (absY > absX && absY > SWIPE_THRESHOLD) {
            if (diffY > 0 && postFilterType === 'shallow') {
                setPostFilterType('deep'); 
            } else if (diffY < 0 && postFilterType === 'deep') {
                setPostFilterType('shallow'); 
            }
        }

        setTouchOffset(0);
        setTouchStart(null);
        setTouchCurrent(null);
    };

    useEffect(() => {
        let query = db.collection("messages");
        const shallowSentiments = ['ENJOY', 'EXCITE', 'HEAL'];
        const deepSentiments = ['SAD', 'ANGRY', 'DARK'];
        const targetSentiments = postFilterType === 'shallow' ? shallowSentiments : deepSentiments;

        if (selectedQueryType === 'line') {
            query = query.where("genre", "==", selectedGenre).where("type", "==", postFilterType);
        } else if (selectedQueryType === 'popular') {
            query = query.where("likeCount", ">=", 1).orderBy("likeCount", "desc");
        } else if (selectedQueryType === 'liked') {
            query = query.where(`likes.${user.uid}`, "==", true);
        } else if (selectedQueryType === 'myPosts') {
            query = query.where("uid", "==", user.uid);
        }

        const unsubscribe = query.limit(100).onSnapshot((snapshot) => {
            let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            if (selectedQueryType !== 'line') {
                fetched = fetched.filter(m => targetSentiments.includes(m.sentiment));
                if (selectedQueryType === 'popular') fetched = fetched.slice(0, 10);
            }
            setMessages(fetched);
        });
        return () => unsubscribe();
    }, [selectedGenre, postFilterType, selectedQueryType, user.uid]);

    return (
        <Box 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{ 
                width: '100%', 
                height: '100vh', 
                bgcolor: '#000', 
                position: 'relative', overflow: 'hidden',
                touchAction: 'none'
            }}
        >
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, #b3e5fc 0%, #0288d1 100%)',
                opacity: selectedQueryType === 'myPosts' ? 0 : shallowOpacity,
                transition: touchOffset === 0 ? 'opacity 0.6s ease' : 'none',
                zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, #0d47a1 0%, #000510 100%)',
                opacity: selectedQueryType === 'myPosts' ? 0 : deepOpacity,
                transition: touchOffset === 0 ? 'opacity 0.6s ease' : 'none',
                zIndex: 0
            }} />

            <Box sx={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                <Box sx={{ 
                    position: 'fixed', top: 0, width: '100%', zIndex: 1000,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <Box sx={{ 
                        position: 'relative',
                        width: '100%',
                        height: '60px', 
                        pt: 'calc(4px + env(safe-area-inset-top))',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        px: 2,
                        boxSizing: 'border-box'
                    }}>
                        <Box sx={{ 
                            position: 'absolute', 
                            left: 0, right: 0, 
                            top: 'calc(4px + env(safe-area-inset-top))', 
                            bottom: 0,
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: 1,
                            pointerEvents: 'none', 
                            zIndex: 0
                        }}>
                            <img 
                                src={process.env.PUBLIC_URL + '/logo.png'} 
                                alt="logo" 
                                style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }} 
                            />
                            <Typography sx={{ 
                                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                fontWeight: 800,
                                fontSize: '1.4rem',
                                letterSpacing: '1px',
                                background: 'linear-gradient(45deg, #0288d1 30%, #26c6da 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))'
                            }}>
                                Emorine
                            </Typography>
                        </Box>

                        <Box sx={{ zIndex: 10, position: 'relative' }}>
                            <QueryTypeMenu onSelect={setSelectedQueryType} currentType={selectedQueryType} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, zIndex: 10, position: 'relative' }}>
                            <IconButton onClick={() => setIsNotifModalOpen(true)} sx={{ color: '#555' }}>
                                <Badge color="error" variant="dot" invisible={!hasUnread}><NotificationsIcon /></Badge>
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{ width: '100%', pb: 1, pt: 0, minHeight: '40px' }}>
                        {selectedQueryType === 'line' ? (
                            <GenreSelectButton selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', pb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#666' }}>
                                    {selectedQueryType === 'popular' ? '人気の投稿' : selectedQueryType === 'liked' ? 'お気に入りの投稿' : ''}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box sx={{ width: '100%', height: '100%', pt: '120px' }}>
                    {selectedQueryType === 'myPosts' ? (
                        <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#f0f2f5' }} className="scrollable-content">
                            <UserProfile />
                        </Box>
                    ) : (
                        <FishTank 
                            messages={messages} 
                            onFishClick={setSelectedMessage} 
                            showTitles={showTitles} 
                            currentFilter={postFilterType} 
                            selectedGenre={selectedGenre} // ★ここに追加
                        />
                    )}
                </Box>
            </Box>
            
            {selectedQueryType !== 'myPosts' && (
                <>
                    <Box sx={{ position: 'fixed', bottom: 'calc(25px + env(safe-area-inset-bottom))', left: '20px', zIndex: 1000 }}>
                        <IconButton onClick={() => setShowTitles(!showTitles)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}>
                            {showTitles ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Box>
                    <Typography sx={{ 
                        position: 'fixed', bottom: 'calc(40px + env(safe-area-inset-bottom))', width: '100%', textAlign: 'center', 
                        color: 'rgba(255,255,255,0.4)', fontSize: '11px', pointerEvents: 'none', zIndex: 1000
                    }}>
                        {postFilterType === 'shallow' ? "↑ スワイプして深海へ / 左右でジャンル切替" : "↓ スワイプして浅海へ / 左右でジャンル切替"}
                    </Typography>
                </>
            )}

            <Box sx={{ 
                position: 'fixed', 
                bottom: 'calc(30px + env(safe-area-inset-bottom))', 
                right: '25px', 
                zIndex: 2000 
            }}>
                <PostButton onClick={() => setIsPostModalOpen(true)} />
            </Box>

            <PostModal open={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} selectedGenre={selectedGenre} />
            <NotificationModal open={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} />
            {selectedMessage && <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
        </Box>
    );
}

export default Line;