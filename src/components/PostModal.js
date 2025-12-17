// fileName: PostModal.js

import React, { useState } from 'react';
import { db, auth } from '../firebase';
import firebase from "firebase/compat/app";
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Radio, RadioGroup, 
    FormControlLabel, FormControl, FormLabel, MenuItem, Select 
} from '@mui/material';
import { analyzeSentiment } from '../utils/gpt'; // ★GPT関数のインポート

const ALL_GENRES = ['大学', '恋愛', '勉強']; 

function PostModal({ open, onClose }) {
    const [msg, setMsg] = useState('');
    const [type, setType] = useState('shallow'); 
    const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]);
    const [loading, setLoading] = useState(false); // 分析中のローディング状態

    async function sendMessage(e) {
        e.preventDefault();

        if (msg.trim() === '') {
            alert('投稿内容を入力してください。');
            return;
        }

        setLoading(true); // 処理開始
        try {
            // 1. GPTで感情分析を実行
            const sentimentResult = await analyzeSentiment(msg);

            // 2. Firestoreに保存
            const { uid, photoURL } = auth.currentUser;
            await db.collection('messages').add({
                text: msg,
                photoURL,
                uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: type,
                likeCount: 0,
                likes: {},
                genre: selectedGenre,
                sentiment: sentimentResult // ★感情分析結果を保存
            });

            // リセット
            setMsg('');
            setType('shallow');
            setSelectedGenre(ALL_GENRES[0]); 
            onClose(); 
        } catch (error) {
            console.error("投稿エラー:", error);
            alert("投稿に失敗しました。");
        } finally {
            setLoading(false); // 処理終了
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>新規投稿 {loading && "（AI分析中...）"}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="normal">
                    <FormLabel>ジャンル</FormLabel>
                    <Select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        disabled={loading}
                    >
                        {ALL_GENRES.map(genre => (
                            <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    autoFocus
                    margin="dense"
                    label="投稿内容"
                    fullWidth
                    multiline
                    rows={4}
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    variant="outlined"
                    disabled={loading}
                />

                <FormControl component="fieldset" margin="normal">
                    <FormLabel component="legend">投稿タイプ</FormLabel>
                    <RadioGroup
                        row
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <FormControlLabel value="shallow" control={<Radio disabled={loading} />} label="きらきら" />
                        <FormControlLabel value="deep" control={<Radio disabled={loading} />} label="やみ" />
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" disabled={loading}>
                    キャンセル
                </Button>
                <Button onClick={sendMessage} color="secondary" variant="contained" disabled={loading}>
                    {loading ? "分析中..." : "投稿"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PostModal;