// fileName: src/components/PostModal.js
import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import { analyzeSentimentAndTitle } from '../utils/gpt';
import { fishTypes } from '../utils/fishData';

function PostModal({ open, onClose, selectedGenre }) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFishId, setSelectedFishId] = useState(fishTypes[0].id);

    const handleSend = async () => {
        if (!text.trim() || loading) return;
        setLoading(true);
        try {
            const user = auth.currentUser;
            // 1. AIで感情とタイトルを判定
            const aiResult = await analyzeSentimentAndTitle(text);
            const sentiment = aiResult.sentiment || "ENJOY";

            // 2. 判定された感情に基づいて、投稿先の「海」を決定する
            // SAD, ANGRY, DARK は深海(deep)へ、それ以外は浅海(shallow)へ
            const deepSentiments = ['SAD', 'ANGRY', 'DARK'];
            const assignedType = deepSentiments.includes(sentiment) ? 'deep' : 'shallow';

            // 3. ジャンルの決定（特殊タブの場合はデフォルトを大学にする）
            const targetGenre = (selectedGenre === "フォロー中" || selectedGenre === "自分の投稿" || !selectedGenre) 
                ? "大学" 
                : selectedGenre;

            await db.collection("messages").add({
                text: text,
                aiTitle: aiResult.title || "無題",
                sentiment: sentiment, // AIが判定した感情
                visualFishId: selectedFishId,
                genre: targetGenre,
                type: assignedType, // ここで自動的に shallow か deep が決まる
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                uid: user.uid,
                displayName: user.displayName || "匿名ユーザー",
                photoURL: user.photoURL || "",
                likeCount: 0,
                likes: {},
                x: Math.floor(Math.random() * 70) + 15,
                y: Math.floor(Math.random() * 60) + 20,
                direction: Math.random() > 0.5 ? 'right' : 'left'
            });

            setText("");
            onClose();
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: 500, bgcolor: 'background.paper', borderRadius: '30px', p: 4,
                outline: 'none', boxShadow: 24
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">今の気持ちを流す</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                    泳がせる魚を選択：
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                    {fishTypes.map((fish) => (
                        <Box 
                            key={fish.id}
                            onClick={() => setSelectedFishId(fish.id)}
                            sx={{ 
                                cursor: 'pointer', p: 0.5, borderRadius: '15px',
                                border: '2px solid', 
                                borderColor: selectedFishId === fish.id ? '#1976d2' : 'transparent',
                                bgcolor: selectedFishId === fish.id ? '#e3f2fd' : '#f5f5f5',
                                transition: '0.2s', width: '45px', height: '45px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <img src={process.env.PUBLIC_URL + '/' + fish.img} alt={fish.label} style={{ width: '30px', height: 'auto' }} />
                        </Box>
                    ))}
                </Box>

                <TextField
                    fullWidth multiline rows={5}
                    placeholder="今どんな気分ですか？"
                    value={text} onChange={(e) => setText(e.target.value)}
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '20px', bgcolor: '#f8f9fa' } }}
                />
                
                <Button 
                    fullWidth variant="contained" 
                    disabled={!text.trim() || loading}
                    onClick={handleSend}
                    sx={{ 
                        borderRadius: '30px', py: 1.8, fontWeight: 'bold', fontSize: '1rem',
                        bgcolor: '#222', color: 'white', boxShadow: 'none',
                        '&:hover': { bgcolor: '#000', boxShadow: 'none' },
                        '&.Mui-disabled': { bgcolor: '#ccc' }
                    }}
                >
                    {loading ? "AI解析中..." : "海に流す"}
                </Button>
            </Box>
        </Modal>
    );
}

export default PostModal;