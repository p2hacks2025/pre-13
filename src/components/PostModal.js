// fileName: src/components/PostModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import { analyzeSentimentAndTitle } from '../utils/gpt';
import { fishTypes } from '../utils/fishData';

// 選択可能なジャンル
const POST_GENRES = [
    { label: '大学', icon: <SchoolIcon sx={{ fontSize: 18 }} /> },
    { label: '恋愛', icon: <FavoriteIcon sx={{ fontSize: 18 }} /> },
    { label: '勉強', icon: <MenuBookIcon sx={{ fontSize: 18 }} /> },
    { label: '自由', icon: <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} /> },
];

function PostModal({ open, onClose, selectedGenre }) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [postGenre, setPostGenre] = useState('大学');
    
    // ★修正: データ読み込み失敗時のための安全策
    // fishTypesが空または未定義の場合の予備データ
    const safeFishTypes = (fishTypes && fishTypes.length > 0) ? fishTypes : [
        { id: 'ENJOY', label: '楽しい', img: 'sakana2.png' } 
    ];

    // 初期値設定
    const [selectedFishId, setSelectedFishId] = useState(safeFishTypes[0].id);

    // モーダルが開くたびに初期化
    useEffect(() => {
        if (open) {
            setPostGenre(selectedGenre || '大学');
            setText("");
            // 安全なリストの最初のIDをセット
            setSelectedFishId(safeFishTypes[0].id);
        }
    }, [open, selectedGenre, safeFishTypes]); // safeFishTypesを依存配列に追加

    // ★修正: 選択中の魚データを安全に取得
    const currentFish = safeFishTypes.find(f => f.id === selectedFishId) || safeFishTypes[0];

    const handleSend = async () => {
        if (!text.trim()) return;
        setLoading(true);

        try {
            // GPTで感情分析
            const { sentiment, title } = await analyzeSentimentAndTitle(text);
            
            // 分析結果の感情に対応する魚IDを探す
            const matchedFish = safeFishTypes.find(f => f.id === sentiment);
            const finalSentiment = matchedFish ? sentiment : 'ENJOY';

            const user = auth.currentUser;
            await db.collection('messages').add({
                text: text,
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                sentiment: finalSentiment, 
                visualFishId: finalSentiment,
                aiTitle: title,
                genre: postGenre,
                type: 'shallow', 
                likeCount: 0,
                likes: {},
                speed: 1 + Math.random() 
            });

            setLoading(false);
            onClose();
        } catch (error) {
            console.error("投稿エラー:", error);
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: 400,
                bgcolor: 'white', borderRadius: '20px', p: 3,
                outline: 'none', boxShadow: 24
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">想いを流す</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                {/* 魚のプレビュー */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, height: '80px', alignItems: 'center' }}>
                    {/* ★修正: 画像パスの生成部分を安全に */}
                    {currentFish && currentFish.img ? (
                        <img 
                            src={process.env.PUBLIC_URL + '/' + currentFish.img} 
                            alt="fish preview" 
                            style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}
                        />
                    ) : (
                        <div style={{ width: '80px', height: '50px', background: '#eee', borderRadius: '10px' }} />
                    )}
                    
                    <Typography variant="caption" sx={{ position: 'absolute', mt: 8, color: '#888' }}>
                        ※感情によって魚が変わります
                    </Typography>
                </Box>

                {/* ジャンル選択 */}
                <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>ジャンルを選択</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
                    {POST_GENRES.map((g) => (
                        <Button
                            key={g.label}
                            onClick={() => setPostGenre(g.label)}
                            startIcon={g.icon}
                            variant={postGenre === g.label ? "contained" : "outlined"}
                            size="small"
                            sx={{
                                borderRadius: '20px', whiteSpace: 'nowrap',
                                bgcolor: postGenre === g.label ? '#0288d1' : 'transparent',
                                color: postGenre === g.label ? 'white' : '#666',
                                borderColor: postGenre === g.label ? '#0288d1' : '#ddd',
                                '&:hover': {
                                    bgcolor: postGenre === g.label ? '#0277bd' : '#f5f5f5',
                                }
                            }}
                        >
                            {g.label}
                        </Button>
                    ))}
                </Box>

                <TextField
                    fullWidth multiline rows={4}
                    placeholder="今どんな気持ちですか？"
                    value={text} onChange={(e) => setText(e.target.value)}
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: '#f8f9fa' } }}
                />
                
                <Button 
                    fullWidth variant="contained" 
                    disabled={!text.trim() || loading}
                    onClick={handleSend}
                    sx={{ 
                        borderRadius: '30px', py: 1.5, fontWeight: 'bold', fontSize: '1rem',
                        bgcolor: '#222', color: 'white', boxShadow: 'none',
                        '&:hover': { bgcolor: '#000', boxShadow: 'none' },
                        '&.Mui-disabled': { bgcolor: '#ccc' }
                    }}
                >
                    {loading ? "AIが感情を分析中..." : "海に流す"}
                </Button>
            </Box>
        </Modal>
    );
}

export default PostModal;