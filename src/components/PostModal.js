// fileName: src/components/PostModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CancelIcon from '@mui/icons-material/Cancel';
import { db, auth } from "../firebase.js";
import firebase from "firebase/compat/app";
import { analyzeSentimentAndTitle } from '../utils/gpt';
import { fishTypes } from '../utils/fishData';
import { POST_GENRES, SEA_TYPES, DEEP_SENTIMENTS } from '../utils/constants';

// ★重要: Cloudinaryの設定
// 設定 > Upload > Upload presets で作成した「Unsigned」の名前をここに入力してください
const CLOUDINARY_UPLOAD_PRESET = "emorine";
const CLOUDINARY_CLOUD_NAME = "dxeeumux6";

const POST_GENRE_ICONS = {
    大学: <SchoolIcon sx={{ fontSize: 18 }} />,
    恋愛: <FavoriteIcon sx={{ fontSize: 18 }} />,
    勉強: <MenuBookIcon sx={{ fontSize: 18 }} />,
    自由: <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
};

function PostModal({ open, onClose, selectedGenre, onPostComplete }) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [postGenre, setPostGenre] = useState(POST_GENRES[0]);

    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);

    const safeFishTypes = (fishTypes && fishTypes.length > 0) ? fishTypes : [
        { id: 'ENJOY', label: '楽しい', img: 'sakana2.png' }
    ];

    const [selectedFishId, setSelectedFishId] = useState(safeFishTypes[0].id);

    useEffect(() => {
        if (open) {
            const initialGenre = POST_GENRES.includes(selectedGenre) ? selectedGenre : POST_GENRES[0];
            setPostGenre(initialGenre);
            setText("");
            setSelectedFishId(safeFishTypes[0].id);
            setMediaFile(null);
            setMediaPreview(null);
            setMediaType(null);
        }
    }, [open, selectedGenre, safeFishTypes]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));

            if (file.type.startsWith('image/')) {
                setMediaType('image');
            } else if (file.type.startsWith('video/')) {
                setMediaType('video');
            }
        }
    };

    const clearMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
    };

    const handleSend = async () => {
        const hasText = !!text.trim();
        if ((!hasText && !mediaFile) || loading) return;
        setLoading(true);

        try {
            const user = auth.currentUser;
            let downloadURL = "";
            const contentText = hasText ? text.trim() : "";

            // 1. Cloudinaryへアップロード
            if (mediaFile) {
                const formData = new FormData();
                formData.append("file", mediaFile);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
                    { method: "POST", body: formData }
                );

                if (!response.ok) throw new Error("Cloudinary upload failed");

                const data = await response.json();
                downloadURL = data.secure_url;
            }

            // 2. AI分析 (テキストがある場合のみ)
            const aiResult = hasText
                ? await analyzeSentimentAndTitle(text)
                : { sentiment: "ENJOY", title: "" };
            const sentiment = aiResult.sentiment || "ENJOY";

            // 感情に基づいた深さ判定
            const assignedType = DEEP_SENTIMENTS.includes(sentiment) ? SEA_TYPES.DEEP : SEA_TYPES.SHALLOW;

            // 3. Firestoreに保存
            await db.collection("messages").add({
                text: contentText,
                aiTitle: hasText ? (aiResult.title || "無題") : "",
                sentiment: sentiment,
                visualFishId: selectedFishId,
                genre: postGenre,
                type: assignedType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                uid: user.uid,
                displayName: user.displayName || "匿名ユーザー",
                photoURL: user.photoURL || "",
                likeCount: 0,
                likes: {},
                x: Math.floor(Math.random() * 70) + 15,
                y: -20,
                speed: 1 + Math.random(),
                mediaURL: downloadURL,
                mediaType: mediaType
            });

            setText("");
            clearMedia();

            if (onPostComplete) {
                onPostComplete(postGenre, assignedType);
            }

            onClose();
        } catch (e) {
            console.error("投稿エラー:", e);
            alert("投稿に失敗しました。プリセット名が正しいか確認してください。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: 500, bgcolor: 'white', borderRadius: '30px', p: 4,
                outline: 'none', boxShadow: 24, maxHeight: '90vh', overflowY: 'auto'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">今の気持ちを流す</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>

                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                    泳がせる魚を選択：
                </Typography>
                <Box sx={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 3
                }}>
                    {safeFishTypes.map((fish) => (
                        <Box
                            key={fish.id}
                            onClick={() => setSelectedFishId(fish.id)}
                            sx={{
                                cursor: 'pointer', p: 1, borderRadius: '20px',
                                border: '2px solid',
                                borderColor: selectedFishId === fish.id ? '#29b6f6' : 'transparent',
                                bgcolor: selectedFishId === fish.id ? '#e1f5fe' : '#f5f5f5',
                                transition: '0.2s', height: '70px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <img
                                src={process.env.PUBLIC_URL + '/' + fish.img}
                                alt={fish.id}
                                style={{ width: '50px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            />
                        </Box>
                    ))}
                </Box>

                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                    ジャンルを選択：
                </Typography>
                <Box sx={{
                    display: 'flex', gap: 1, mb: 3, flexWrap: 'nowrap', overflowX: 'auto', pb: 1,
                    '&::-webkit-scrollbar': { display: 'none' }
                }}>
                    {POST_GENRES.map((label) => (
                        <Button
                            key={label}
                            onClick={() => setPostGenre(label)}
                            startIcon={POST_GENRE_ICONS[label]}
                            sx={{
                                borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', textTransform: 'none',
                                px: 2, py: 1,
                                bgcolor: postGenre === label ? '#29b6f6' : '#f5f5f5',
                                color: postGenre === label ? '#fff' : '#666',
                                whiteSpace: 'nowrap', flexShrink: 0,
                                '&:hover': { bgcolor: postGenre === label ? '#039be5' : '#eee' }
                            }}
                        >
                            {label}
                        </Button>
                    ))}
                </Box>

                <Box sx={{ position: 'relative', mb: 3 }}>
                    <TextField
                        fullWidth multiline rows={4}
                        placeholder="今どんな気分ですか？"
                        value={text} onChange={(e) => setText(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px', bgcolor: '#f8f9fa' } }}
                    />
                    <Box sx={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10 }}>
                        <IconButton
                            component="label"
                            sx={{ color: '#0288d1', bgcolor: '#e1f5fe', '&:hover': { bgcolor: '#b3e5fc' } }}
                        >
                            <AddPhotoAlternateIcon />
                            <input type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
                        </IconButton>
                    </Box>
                </Box>

                {mediaPreview && (
                    <Box sx={{ position: 'relative', mb: 3, borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                        <IconButton
                            onClick={clearMedia}
                            sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 5, p: 0.5 }}
                        >
                            <CancelIcon fontSize="small" />
                        </IconButton>
                        {mediaType === 'video' ? (
                            <video src={mediaPreview} controls style={{ width: '100%', display: 'block' }} />
                        ) : (
                            <img src={mediaPreview} alt="preview" style={{ width: '100%', display: 'block' }} />
                        )}
                    </Box>
                )}

                <Button
                    fullWidth variant="contained"
                    disabled={(!text.trim() && !mediaFile) || loading}
                    onClick={handleSend}
                    sx={{
                        borderRadius: '30px', py: 1.8, fontWeight: 'bold', fontSize: '1rem',
                        bgcolor: '#ccc', color: 'white',
                        ...((text.trim() || mediaFile) && !loading && {
                            bgcolor: '#222',
                            '&:hover': { bgcolor: '#000' }
                        })
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "海に流す"}
                </Button>
            </Box>
        </Modal>
    );
}

export default PostModal;
