import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import LikeButton from './LikeButton';
import { Avatar, Paper, Typography, Divider } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fishTypes } from '../utils/fishData';

/**
 * プロフィール用の感情統計グラフ
 */
function ProfileSentimentStats({ messages }) {
    const counts = messages.reduce((acc, msg) => {
        if (msg.sentiment) {
            acc[msg.sentiment] = (acc[msg.sentiment] || 0) + 1;
        }
        return acc;
    }, { ENJOY: 0, SAD: 0, HEAL: 0, EXCITE: 0, ANGRY: 0, DARK: 0 });

    const data = fishTypes.map(f => ({
        name: f.label,
        value: counts[f.id] || 0,
        color: f.color
    })).filter(item => item.value > 0);

    if (data.length === 0) return (
        <Typography variant="body2" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            まだデータがありません
        </Typography>
    );

    return (
        <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={5}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * 自分の投稿履歴とプロフィールを表示するコンポーネント
 */
function UserPosts() {
    const [messages, setMessages] = useState([]);
    const user = auth.currentUser;
    const currentUserId = user?.uid;

    useEffect(() => {
        if (!currentUserId) return;

        // Firebaseからのデータ取得
        const unsubscribe = db.collection('messages')
            .where('uid', '==', currentUserId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (error) => {
                console.error("Firestore Error:", error);
            });

        return () => unsubscribe();
    }, [currentUserId]);

    return (
        <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* プロフィールカード */}
            <Paper elevation={0} style={{ width: '92vw', maxWidth: '500px', padding: '20px', borderRadius: '20px', backgroundColor: '#fff', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <Avatar src={user?.photoURL} style={{ width: '60px', height: '60px', marginRight: '15px' }} />
                    <div>
                        <Typography variant="h6" style={{ fontWeight: 'bold' }}>{user?.displayName || "ゲストユーザー"}</Typography>
                        <Typography variant="body2" color="textSecondary">全 {messages.length} 件の投稿</Typography>
                    </div>
                </div>
                
                <Divider style={{ margin: '15px 0' }} />
                
                <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                    あなたの感情バランス
                </Typography>
                <ProfileSentimentStats messages={messages} />
            </Paper>

            <Typography variant="subtitle1" style={{ width: '92vw', maxWidth: '500px', margin: '10px 0', fontWeight: 'bold', paddingLeft: '10px' }}>
                投稿履歴
            </Typography>

            {/* 投稿一覧 */}
            <div className="msgs" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {messages.map((message) => {
                    const fish = fishTypes.find(f => f.id === message.sentiment) || fishTypes[0];

                    return (
                        <div key={message.id} style={{ width: '92vw', maxWidth: '500px', marginBottom: '12px' }}>
                            <div className={`msg ${message.uid === currentUserId ? "sent" : "received"}`} style={{ display: 'flex', alignItems: 'flex-start', padding: '10px', borderRadius: '15px', backgroundColor: '#f0f2f5' }}>
                                <img 
                                    src={fish.img} 
                                    alt={fish.label} 
                                    style={{ width: '40px', height: '40px', objectFit: 'contain', marginRight: '12px', flexShrink: 0 }} 
                                /> 
                                <div style={{ flexGrow: 1 }}>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{message.text}</p>
                                    <Typography variant="caption" style={{ color: '#999' }}>
                                        {message.createdAt?.toDate ? message.createdAt.toDate().toLocaleString('ja-JP') : ''}
                                    </Typography>
                                </div>
                                <LikeButton message={message} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UserPosts;