// fileName: PostModal.js

import React, { useState } from 'react';
import { db, auth } from '../firebase';
import firebase from "firebase/compat/app";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, MenuItem, Select } from '@mui/material';

// 投稿可能な全ジャンル
const ALL_GENRES = ['大学', '恋愛', '勉強']; 

function PostModal({ open, onClose }) {
    const [msg, setMsg] = useState('');
    const [type, setType] = useState('shallow'); // default to 'shallow' (きらきら)
    const [selectedGenre, setSelectedGenre] = useState(ALL_GENRES[0]); // デフォルトで最初のジャンルを選択

    async function sendMessage(e) {
        e.preventDefault();

        if (msg.trim() === '') {
            alert('投稿内容を入力してください。');
            return;
        }
        if (!selectedGenre) {
            alert('ジャンルを選択してください。');
            return;
        }

        const { uid, photoURL } = auth.currentUser;

        await db.collection('messages').add({
            text: msg,
            photoURL,
            uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: type,
            likeCount: 0,
            likes: {},
            // favorites: {} は削除されました
            genre: selectedGenre // 選択されたジャンルを保存
        });

        // 投稿成功後、状態をリセットし、モーダルを閉じる
        setMsg('');
        setType('shallow');
        setSelectedGenre(ALL_GENRES[0]); 
        onClose(); 
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>新規投稿</DialogTitle>
            <DialogContent>
                {/* ジャンル選択 */}
                <FormControl fullWidth margin="normal">
                    <FormLabel>ジャンル</FormLabel>
                    <Select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        required
                    >
                        {ALL_GENRES.map(genre => (
                            <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 投稿内容入力 */}
                <TextField
                    autoFocus
                    margin="dense"
                    label="投稿内容"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    variant="outlined"
                    required
                />

                {/* きらきら/やみ選択 */}
                <FormControl component="fieldset" margin="normal">
                    <FormLabel component="legend">投稿タイプ</FormLabel>
                    <RadioGroup
                        row
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <FormControlLabel value="shallow" control={<Radio />} label="きらきら" />
                        <FormControlLabel value="deep" control={<Radio />} label="やみ" />
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    キャンセル
                </Button>
                <Button onClick={sendMessage} color="secondary" variant="contained">
                    投稿
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PostModal;