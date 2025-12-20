// fileName: src/components/Line.js
import React, { useState, useEffect, useRef } from 'react';
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
import CachedIcon from '@mui/icons-material/Cached';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconButton, Box, Badge, Typography, Avatar, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

function Line() {
    const [messages, setMessages] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('大学'); 
    const [selectedQueryType, setSelectedQueryType] = useState('all'); 
    const [postFilterType, setPostFilterType] = useState('shallow'); 
    const [isPostModalOpen, setIsPostModalOpen] = useState(false); 
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showTitles, setShowTitles] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);
    
    const [lastViewType, setLastViewType] = useState('all');
    const genreBarRef = useRef(null);
    const myPostsScrollRef = useRef(null);
    const headerTouchRef = useRef(null);
    const lineContainerRef = useRef(null);
    const headerGestureRef = useRef(false);

    // --- スワイプ管理 ---
    const [touchStart, setTouchStart] = useState(null);
    const [touchCurrent, setTouchCurrent] = useState(null); 
    const [touchOffset, setTouchOffset] = useState(0); 
    
    const SWIPE_THRESHOLD = 80;
    const SWIPE_LOCK_THRESHOLD = 12;
    const user = auth.currentUser;

    const gestureLockRef = useRef(null);
    const swipeActiveRef = useRef(false);

    const swipeRatio = Math.min(Math.max(touchOffset / 120, -1), 1);
    const shallowOpacity = postFilterType === 'shallow' ? 1 - Math.max(0, swipeRatio) : Math.max(0, -swipeRatio);
    const deepOpacity = postFilterType === 'deep' ? 1 + Math.min(0, swipeRatio) : Math.max(0, swipeRatio);
    const togglePostFilter = () => {
        setPostFilterType((prev) => (prev === 'shallow' ? 'deep' : 'shallow'));
    };

    const isInteractiveTarget = (target) => {
        if (!target || typeof target.closest !== 'function') return false;
        return !!target.closest('button, a, input, textarea, select, [role="button"], [data-no-swipe="true"]');
    };

    const touchStartRef = useRef(null);

    const handleTouchStart = (e) => {
        if (isPostModalOpen || selectedMessage || isNotifModalOpen) return;
        if (isInteractiveTarget(e.target)) return;
        const touch = e.targetTouches[0];
        if (!touch) return;
        if (selectedQueryType === 'myPosts' && touch.clientY >= 120) return;
        gestureLockRef.current = null;
        swipeActiveRef.current = false;
        headerGestureRef.current = touch.clientY < 120;
        const point = { x: touch.clientX, y: touch.clientY };
        touchStartRef.current = point;
        setTouchStart(point);
        setTouchCurrent(point);
    };

    const handleTouchMove = (e) => {
        if (!touchStart) return;
        const touch = e.targetTouches[0];
        const dx = touchStart.x - touch.clientX;
        const dy = touchStart.y - touch.clientY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (!swipeActiveRef.current && (absX > SWIPE_LOCK_THRESHOLD || absY > SWIPE_LOCK_THRESHOLD)) {
            swipeActiveRef.current = true;
            if (headerGestureRef.current && absX > SWIPE_LOCK_THRESHOLD) {
                gestureLockRef.current = 'horizontal';
            } else {
                gestureLockRef.current = absX > absY ? 'horizontal' : 'vertical';
            }
        }
        if (!swipeActiveRef.current) return;

        setTouchCurrent({ x: touch.clientX, y: touch.clientY });
        if (gestureLockRef.current === 'vertical') {
            setTouchOffset(touchStart.y - touch.clientY);
        } else {
            setTouchOffset(0);
        }
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchCurrent || !swipeActiveRef.current) {
            setTouchOffset(0);
            setTouchStart(null);
            setTouchCurrent(null);
            gestureLockRef.current = null;
            swipeActiveRef.current = false;
            headerGestureRef.current = false;
            touchStartRef.current = null;
            return;
        }
        const diffX = touchStart.x - touchCurrent.x;
        const diffY = touchStart.y - touchCurrent.y;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);
        const isHeaderSwipe = touchStart.y < 120;
        const genreRect = genreBarRef.current?.getBoundingClientRect();
        const isGenreSwipe = genreRect
            ? touchStart.y >= genreRect.top && touchStart.y <= genreRect.bottom
            : touchStart.y > (window.innerHeight - 140);

        const GENRES = ['大学', '恋愛', '勉強', '自由', 'フォロー中'];

        if (isHeaderSwipe && absX > SWIPE_THRESHOLD && gestureLockRef.current !== 'vertical') {
            if (diffX > 0) {
                setSelectedQueryType('myPosts');
            } else {
                setSelectedQueryType(lastViewType);
            }
        }
        if (!isHeaderSwipe && gestureLockRef.current === 'horizontal' && isGenreSwipe && absX > SWIPE_THRESHOLD && selectedQueryType !== 'myPosts') {
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
        else if (!isHeaderSwipe && gestureLockRef.current === 'vertical' && absY > SWIPE_THRESHOLD) {
            if (diffY > 0 && postFilterType === 'shallow') {
                setPostFilterType('deep'); 
            } else if (diffY < 0 && postFilterType === 'deep') {
                setPostFilterType('shallow'); 
            }
        }

        setTouchOffset(0);
        setTouchStart(null);
        setTouchCurrent(null);
        gestureLockRef.current = null;
        swipeActiveRef.current = false;
        headerGestureRef.current = false;
        touchStartRef.current = null;
    };

    const handleHeaderTouchStart = (e) => {
        const touch = e.targetTouches[0];
        if (!touch) return;
        headerTouchRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleHeaderTouchEnd = (callback, e) => {
        const touch = e.changedTouches && e.changedTouches[0];
        const start = headerTouchRef.current;
        headerTouchRef.current = null;
        if (!touch || !start) return;
        const diffX = Math.abs(touch.clientX - start.x);
        const diffY = Math.abs(touch.clientY - start.y);
        if (diffX < 10 && diffY < 10) {
            callback();
        }
    };

    // ★追加: 投稿完了時に呼び出される関数
    // 投稿された魚がいる場所（ジャンル・深さ）へ自動で移動する
    const handlePostComplete = (genre, type) => {
        setSelectedGenre(genre);
        setPostFilterType(type);
        // もし「人気」や「お気に入り」を見ていたら、「みんなの海」に戻して表示させる
        if (selectedQueryType === 'popular' || selectedQueryType === 'liked') {
            setSelectedQueryType('all');
        }
    };

    useEffect(() => {
        if (selectedQueryType !== 'myPosts') {
            setLastViewType(selectedQueryType);
        }
    }, [selectedQueryType]);

    // 未読通知の有無を監視
    useEffect(() => {
        if (!user) return;
        const unsubscribe = db.collection('notifications')
            .where('toUserId', '==', user.uid)
            .where('checked', '==', false)
            .onSnapshot(s => {
                setHasUnread(!s.empty);
            });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const container = lineContainerRef.current;
        if (!container) return;

        const handleTouchMove = (e) => {
            if (selectedQueryType === 'myPosts') return;
            if (isPostModalOpen || selectedMessage || isNotifModalOpen) return;
            if (!container.contains(e.target)) return;
            if (isInteractiveTarget(e.target)) return;
            if (!touchStartRef.current) return;
            const touch = e.touches && e.touches[0];
            if (!touch) return;
            const dx = Math.abs(touch.clientX - touchStartRef.current.x);
            const dy = Math.abs(touch.clientY - touchStartRef.current.y);
            if (dy > dx && dy > 6) {
                e.preventDefault();
            }
        };

        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [selectedQueryType, isPostModalOpen, selectedMessage, isNotifModalOpen]);

    useEffect(() => {
        if (selectedQueryType !== 'myPosts') return;
        let startY = 0;

        const handleTouchStart = (e) => {
            if (!e.touches || e.touches.length === 0) return;
            startY = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            const container = myPostsScrollRef.current;
            if (!container || !container.contains(e.target)) return;
            if (!e.touches || e.touches.length === 0) return;
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            const maxScrollTop = container.scrollHeight - container.clientHeight;
            const isAtTop = container.scrollTop <= 0;
            const isAtBottom = container.scrollTop >= maxScrollTop - 1;

            if ((isAtTop && diff > 0) || (isAtBottom && diff < 0)) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [selectedQueryType]);

    useEffect(() => {
        let query = db.collection("messages");
        const shallowSentiments = ['ENJOY', 'EXCITE', 'HEAL'];
        const deepSentiments = ['SAD', 'ANGRY', 'DARK'];
        const targetSentiments = postFilterType === 'shallow' ? shallowSentiments : deepSentiments;

        if (selectedQueryType === 'line') {
            query = query.where("uid", "==", user.uid);
        } 
        else if (selectedQueryType === 'all') {
            query = query.where("genre", "==", selectedGenre)
                         .where("type", "==", postFilterType);
        }
        else if (selectedQueryType === 'popular') {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            query = query.where("genre", "==", selectedGenre)
                         .where("createdAt", ">=", threeDaysAgo);
        } 
        else if (selectedQueryType === 'liked') {
            query = query.where(`likes.${user.uid}`, "==", true);
        } 
        else if (selectedQueryType === 'myPosts') {
            query = query.where("uid", "==", user.uid);
        }

        const unsubscribe = query.limit(100).onSnapshot((snapshot) => {
            let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            
            if (selectedQueryType === 'line') {
                fetched = fetched.filter(m => m.genre === selectedGenre && m.type === postFilterType);
            }
            else if (selectedQueryType === 'popular') {
                fetched = fetched.filter(m => targetSentiments.includes(m.sentiment));
                fetched = fetched.filter(m => (m.likeCount || 0) >= 1);
                fetched.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
                fetched = fetched.slice(0, 7);
            }
            else if (selectedQueryType === 'liked') {
                fetched = fetched.filter(m => 
                    m.genre === selectedGenre && targetSentiments.includes(m.sentiment)
                );
            }
            
            setMessages(fetched);
        });
        return () => unsubscribe();
    }, [selectedGenre, postFilterType, selectedQueryType, user.uid]);

    const getHeaderTitle = (type) => {
        switch (type) {
            case 'line': return '自分の海';
            case 'all': return 'みんなの海';
            case 'popular': return '人気のおさかな';
            case 'liked': return 'お気に入りのおさかな';
            case 'myPosts': return 'プロフィール';
            default: return 'Emorine';
        }
    };

    const bottomNavOffset = '75px'; 
    const actionButtonSize = '56px';
    const actionButtonBottom = `calc(${bottomNavOffset} + 8px + env(safe-area-inset-bottom))`;
    const reloadButtonLeft = '84px';

    return (
        <Box 
            ref={lineContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{ 
                width: '100%', 
                height: '100vh', 
                bgcolor: selectedQueryType === 'myPosts' ? '#f0f2f5' : '#000', 
                position: 'relative', overflow: 'hidden',
                touchAction: selectedQueryType === 'myPosts' ? 'pan-y' : 'pan-x',
                overscrollBehavior: 'none'
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
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
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
                            position: 'absolute', left: 0, right: 0, 
                            top: 'calc(4px + env(safe-area-inset-top))', bottom: 0,
                            display: 'flex', justifyContent: 'center', alignItems: 'center', 
                            gap: 1, pointerEvents: 'none', zIndex: 0
                        }}>
                            <img 
                                src={process.env.PUBLIC_URL + '/logo.png'} 
                                alt="logo" 
                                style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                            />
                            <Typography sx={{ 
                                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                fontWeight: 800,
                                fontSize: '1.4rem', 
                                letterSpacing: '1px',
                                background: 'linear-gradient(45deg, #0288d1 30%, #26c6da 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Emorine
                            </Typography>
                        </Box>

                        <Box sx={{ zIndex: 10, position: 'relative' }}>
                            <QueryTypeMenu onSelect={setSelectedQueryType} currentType={selectedQueryType} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, zIndex: 10, position: 'relative' }}>
                            <IconButton onClick={() => setIsNotifModalOpen(true)} sx={{ color: '#555', padding: '8px' }}>
                                <Badge color="error" variant="dot" invisible={!hasUnread}><NotificationsIcon sx={{ fontSize: '24px' }} /></Badge>
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{ 
                        width: '100%', 
                        minHeight: '34px',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'flex-end',
                        gap: 3 
                    }}>
                        <Box 
                            onClick={() => {
                                if (selectedQueryType === 'myPosts') {
                                    setSelectedQueryType(lastViewType);
                                }
                            }}
                            onTouchStart={handleHeaderTouchStart}
                            onTouchEnd={(e) => handleHeaderTouchEnd(() => {
                                if (selectedQueryType === 'myPosts') {
                                    setSelectedQueryType(lastViewType);
                                }
                            }, e)}
                            sx={{
                                pb: 0.5,
                                px: 1,
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                borderBottom: selectedQueryType !== 'myPosts' ? '2px solid #0288d1' : '2px solid transparent',
                                color: selectedQueryType !== 'myPosts' ? '#0288d1' : '#999',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {getHeaderTitle(selectedQueryType === 'myPosts' ? lastViewType : selectedQueryType)}
                        </Box>

                        <Box 
                            onClick={() => setSelectedQueryType('myPosts')}
                            onTouchStart={handleHeaderTouchStart}
                            onTouchEnd={(e) => handleHeaderTouchEnd(() => setSelectedQueryType('myPosts'), e)}
                            sx={{
                                pb: 0.5,
                                px: 1,
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                borderBottom: selectedQueryType === 'myPosts' ? '2px solid #0288d1' : '2px solid transparent',
                                color: selectedQueryType === 'myPosts' ? '#0288d1' : '#999',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            マイページ
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', pt: '94px' }}>
                    {selectedQueryType === 'myPosts' ? (
                        <Box
                            ref={myPostsScrollRef}
                            sx={{
                                height: '100%',
                                overflowY: 'auto',
                                bgcolor: '#f0f2f5',
                                pb: '100px',
                                overscrollBehavior: 'contain',
                                WebkitOverflowScrolling: 'auto',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}
                        >
                            <UserProfile />
                        </Box>
                    ) : (
                        <FishTank 
                            messages={messages} 
                            onFishClick={setSelectedMessage} 
                            showTitles={showTitles} 
                            currentFilter={postFilterType} 
                            selectedGenre={selectedGenre}
                            selectedQueryType={selectedQueryType}
                            refreshToken={refreshToken}
                        />
                    )}
                </Box>
            </Box>
            
            {!isPostModalOpen && !selectedMessage && selectedQueryType !== 'myPosts' && (
                <>
                    <Box sx={{ 
                        position: 'fixed', 
                        bottom: actionButtonBottom, 
                        left: '20px', 
                        zIndex: 1000 
                    }}>
                        <IconButton
                            onClick={() => setShowTitles(!showTitles)}
                            sx={{
                                color: 'white',
                                width: actionButtonSize,
                                height: actionButtonSize,
                                touchAction: 'none',
                                backgroundColor: 'transparent',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            {showTitles ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Box>
                    <Box 
                        sx={{ 
                            position: 'fixed', 
                            bottom: actionButtonBottom, 
                            left: reloadButtonLeft, 
                            zIndex: 1000 
                        }}
                    >
                        <IconButton
                            onClick={() => setRefreshToken((t) => t + 1)}
                            sx={{
                                color: 'white',
                                width: actionButtonSize,
                                height: actionButtonSize,
                                touchAction: 'none',
                                backgroundColor: 'transparent',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <CachedIcon />
                        </IconButton>
                    </Box>
                    
                    <Typography sx={{ 
                        position: 'fixed', 
                        bottom: `calc(${bottomNavOffset} + 15px + env(safe-area-inset-bottom))`, 
                        width: '100%', textAlign: 'center', 
                        color: 'rgba(255,255,255,0.4)', fontSize: '11px', pointerEvents: 'none', zIndex: 1000
                    }}>
                        {postFilterType === 'shallow' ? "↑ スワイプして深海へ" : "↓ スワイプして浅海へ"}
                    </Typography>
                    <Box
                        sx={{
                            position: 'fixed',
                            left: '50%',
                            bottom: `calc(${bottomNavOffset} + 38px + env(safe-area-inset-bottom))`,
                            transform: 'translateX(-50%)',
                            zIndex: 1000
                        }}
                    >
                        <IconButton
                            onClick={togglePostFilter}
                            data-no-swipe="true"
                            sx={{
                                color: '#fff',
                                width: 46,
                                height: 34,
                                borderRadius: '999px',
                                backgroundColor: 'rgba(255,255,255,0.22)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                backdropFilter: 'blur(6px)',
                                touchAction: 'none',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                            }}
                        >
                            {postFilterType === 'shallow' ? (
                                <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />
                            ) : (
                                <KeyboardArrowUpIcon sx={{ fontSize: 22 }} />
                            )}
                        </IconButton>
                    </Box>
                </>
            )}

            {!isPostModalOpen && !selectedMessage && selectedQueryType !== 'myPosts' && (
                <Box sx={{ 
                    position: 'fixed', 
                    bottom: `calc(${bottomNavOffset} + env(safe-area-inset-bottom))`, 
                    right: '25px', 
                    zIndex: 2000 
                }}>
                    <PostButton onClick={() => setIsPostModalOpen(true)} />
                </Box>
            )}

            {!isPostModalOpen && selectedQueryType !== 'myPosts' && (
                <Box
                    ref={genreBarRef}
                    sx={{
                    position: 'fixed', 
                    bottom: 0, left: 0, width: '100%',
                    zIndex: 3000,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    pb: 'env(safe-area-inset-bottom)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
                    pointerEvents: selectedQueryType === 'myPosts' ? 'none' : 'auto'
                }}>
                    <GenreSelectButton selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
                </Box>
            )}

            {/* ★修正: onPostCompleteを渡す */}
            <PostModal 
                open={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)} 
                selectedGenre={selectedGenre} 
                onPostComplete={handlePostComplete}
            />
            
            <NotificationModal open={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} />
            {selectedMessage && <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
        </Box>
    );
}

export default Line;
