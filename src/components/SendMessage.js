// fileName: SendMessage.js

import React, { useState } from 'react';
import { db, auth } from '../firebase';
import firebase from "firebase/compat/app";
import { SEA_TYPES } from '../utils/constants';

// propsとして currentGenre を受け取る
function SendMessage({ currentGenre }) {
    const [msg, setMsg] = useState('');
    const [type, setType] = useState(SEA_TYPES.SHALLOW); // default to shallow

    // currentGenre がない場合は投稿フォームを表示しない (Line.js側で制御しているため通常は不要)
    if (!currentGenre) {
        return null;
    }

    async function sendMessage(e) {
        e.preventDefault();

        if (msg.trim() === '') {
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
            favorites: {},
            // NEW: 現在のジャンルを保存
            genre: currentGenre 
        });

        setMsg('');
    }
    
    return (
        // 投稿フォーム全体をラップする div
        <div style={{ 
            position: 'sticky', // メッセージリストの一番下に留まるようにする
            bottom: '0', 
            backgroundColor: 'white', 
            padding: '10px', 
            borderTop: '1px solid #ddd', 
            zIndex: 10 
        }}> 
            {/* 投稿タイプ選択 (きらきら/やみ) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <label>
                    <input 
                        type="radio" 
                        value={SEA_TYPES.SHALLOW}
                        checked={type === SEA_TYPES.SHALLOW}
                        onChange={() => setType(SEA_TYPES.SHALLOW)}
                    />
                    きらきら
                </label>
                <label>
                    <input 
                        type="radio" 
                        value={SEA_TYPES.DEEP}
                        checked={type === SEA_TYPES.DEEP}
                        onChange={() => setType(SEA_TYPES.DEEP)}
                    />
                    やみ
                </label>
            </div>

            {/* 投稿フォーム */}
            <form onSubmit={sendMessage} style={{ display: 'flex', width: '100%' }}>
                <input 
                    style={{ flexGrow: 1, fontSize: '15px', padding: '10px', border: '1px solid #ccc', marginRight: '10px' }}
                    value={msg} 
                    onChange={e => setMsg(e.target.value)} 
                    placeholder={`[${currentGenre}] の投稿`} 
                />
                <button type="submit">投稿</button>
            </form>
        </div>
    );
}

export default SendMessage;
