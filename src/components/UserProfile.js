// fileName: src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { Box, Typography, Avatar, IconButton, Button, TextField, Select, MenuItem, Paper, ButtonBase } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fishTypes } from '../utils/fishData';
// ★修正: GPT関数をインポート
import { generateWeeklyFeedback } from '../utils/gpt';

// 感情データ定義
const sentimentColors = {
    ENJOY: '#ffca28', EXCITE: '#ff7043', HEAL: '#66bb6a',
    SAD: '#42a5f5', ANGRY: '#ef5350', DARK: '#7e57c2',
};

const sentimentLabels = {
    ENJOY: '楽しい', EXCITE: 'わくわく', HEAL: '癒やし',
    SAD: '悲しい', ANGRY: '怒り', DARK: '暗い気持ち',
};

function UserProfile() {
    const user = auth.currentUser;
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
    const [newImage, setNewImage] = useState(null);
    
    const [stats, setStats] = useState({ postCount: 0, likeCount: 0 });
    const [sentimentData, setSentimentData] = useState([]);
    const [aiFeedback, setAiFeedback] = useState("AI分析中..."); // 初期状態
    const [timeRange, setTimeRange] = useState('all'); 
    const [allMessages, setAllMessages] = useState([]); 

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDateMessages, setSelectedDateMessages] = useState([]);
    const [dailySentimentData, setDailySentimentData] = useState([]);

    // データ取得
    useEffect(() => {
        if (!user) return;
        let query = db.collection("messages").where("uid", "==", user.uid);

        if (timeRange !== 'all') {
            const now = new Date();
            let startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            
            if (timeRange === 'today') {
                // startDateは今日の0時
            } else if (timeRange === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (timeRange === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            }
            query = query.where("createdAt", ">=", startDate);
        }

        const unsubscribe = query.onSnapshot((snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    ...data, 
                    id: doc.id,
                    createdAtDate: data.createdAt ? data.createdAt.toDate() : new Date() 
                };
            });
            
            messages.sort((a, b) => b.createdAtDate - a.createdAtDate);
            setAllMessages(messages);

            setStats({
                postCount: messages.length,
                likeCount: messages.reduce((sum, m) => sum + (m.likeCount || 0), 0)
            });

            const counts = {};
            messages.forEach(m => {
                const s = m.sentiment || 'ENJOY';
                counts[s] = (counts[s] || 0) + 1;
            });
            const data = Object.entries(counts).map(([key, value]) => ({
                name: sentimentLabels[key],
                value,
                color: sentimentColors[key]
            }));
            setSentimentData(data);
            
            // ★以前の generateAiFeedback(local) は削除し、別のuseEffectでAPIを呼ぶ
        });
        return () => unsubscribe();
    }, [user, timeRange]);

    // ★追加: AIフィードバック生成 (allMessagesの更新を監視)
    useEffect(() => {
        const fetchAiFeedback = async () => {
            // 過去1週間のメッセージを抽出
            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);

            // allMessagesは全件入っているとは限らない(上のuseEffectでフィルタされている可能性がある)ため
            // フィルタ済みの allMessages を使うか、別途取得する必要がありますが、
            // ここでは表示されている allMessages の中から直近1週間のものを対象にします。
            const weeklyMessages = allMessages.filter(m => m.createdAtDate >= oneWeekAgo);
            
            // 感情タグのリストを作成
            const sentiments = weeklyMessages.map(m => m.sentiment || "ENJOY");

            // API呼び出し
            const feedback = await generateWeeklyFeedback(sentiments);
            setAiFeedback(feedback);
        };

        // データ読み込み完了後に実行 (初回マウント時やデータ更新時)
        if (allMessages.length >= 0) { // 0件でも「データなし」のフィードバックをもらうため実行
             // デバウンス的に少し待つか、単に実行する（今回は直接実行）
             fetchAiFeedback();
        }
    }, [allMessages]); // allMessagesが変わるたびに再評価

    // 日付選択時の処理
    useEffect(() => {
        if (!selectedDate || allMessages.length === 0) {
            setSelectedDateMessages([]);
            setDailySentimentData([]);
            return;
        }
        const targetStr = selectedDate.toDateString();
        const filtered = allMessages.filter(m => m.createdAtDate.toDateString() === targetStr);
        setSelectedDateMessages(filtered);

        if (filtered.length > 0) {
            const counts = {};
            filtered.forEach(m => {
                const s = m.sentiment || 'ENJOY';
                counts[s] = (counts[s] || 0) + 1;
            });
            const data = Object.entries(counts).map(([key, value]) => ({
                name: sentimentLabels[key],
                value,
                color: sentimentColors[key]
            }));
            setDailySentimentData(data);
        } else {
            setDailySentimentData([]);
        }
    }, [selectedDate, allMessages]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) setNewImage(e.target.files[0]);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        let newPhotoURL = photoURL;
        if (newImage) {
            const ref = storage.ref(`profile_images/${user.uid}`);
            await ref.put(newImage);
            newPhotoURL = await ref.getDownloadURL();
        }
        await user.updateProfile({ displayName, photoURL: newPhotoURL });
        setPhotoURL(newPhotoURL);
        setIsEditing(false);
        setNewImage(null);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const getDateSentimentInfo = (date) => {
        if (!date) return null;
        const dateStr = date.toDateString();
        const msgs = allMessages.filter(m => m.createdAtDate.toDateString() === dateStr);
        if (msgs.length === 0) return null;
        
        const latest = msgs[0];
        return {
            color: '#fff', 
            bgColor: sentimentColors[latest.sentiment],
            sentiment: latest.sentiment
        };
    };

    const calendarDays = getDaysInMonth(currentMonth);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto', pb: '120px' }}>
            {/* ユーザー情報 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box sx={{ position: 'relative' }}>
                    <Avatar src={photoURL} sx={{ width: 80, height: 80, border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                    <IconButton
                        onClick={() => setIsEditing(true)}
                        sx={{
                            position: 'absolute', bottom: 0, right: 0,
                            bgcolor: '#fff', color: '#555', p: 0.8,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                    >
                        <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>
                <Box sx={{ ml: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="#333">{user?.displayName || "匿名ユーザー"}</Typography>
                    <Typography variant="caption" color="text.secondary">今日も一日、お疲れ様です。</Typography>
                </Box>
            </Box>

            {/* AIフィードバック */}
            {aiFeedback && (
                <Box sx={{
                    bgcolor: '#fffde7', p: 3, borderRadius: '24px', mb: 4,
                    display: 'flex', gap: 2, alignItems: 'flex-start',
                    border: '1px solid #fff9c4',
                }}>
                    <AutoAwesomeIcon sx={{ color: '#fbc02d', fontSize: 28, mt: 0.3, flexShrink: 0 }} />
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="#fbc02d" gutterBottom sx={{ letterSpacing: '0.05em' }}>
                            Weekly Insight
                        </Typography>
                        <Typography variant="body2" color="#555" sx={{ lineHeight: 1.8, whiteSpace: 'normal' }}>
                            {aiFeedback}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* スタッツ */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0288d1', fontFamily: 'Futura, sans-serif' }}>
                        {stats.postCount}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" color="#aaa" sx={{ letterSpacing: '0.1em' }}>
                        FISHES
                    </Typography>
                </Box>
            </Box>

            {/* 感情割合グラフ */}
            <Box sx={{ p: 0, mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="#444" sx={{ fontSize: '1.1rem' }}>感情のバランス</Typography>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        variant="standard"
                        disableUnderline
                        sx={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}
                    >
                        <MenuItem value="today">今日</MenuItem>
                        <MenuItem value="week">1週間</MenuItem>
                        <MenuItem value="month">1ヶ月</MenuItem>
                        <MenuItem value="all">全期間</MenuItem>
                    </Select>
                </Box>
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sentimentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    innerRadius={65} outerRadius={85}
                                    paddingAngle={4} dataKey="value"
                                    cornerRadius={6}
                                >
                                    {sentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">データがありません</Typography>
                    )}
                </Box>
            </Box>

            {/* 心のカレンダー */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="#444" sx={{ mb: 3, px: 1, fontSize: '1.1rem' }}>
                    心のカレンダー
                </Typography>
                
                {/* 年月表示 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, mb: 4 }}>
                    <IconButton onClick={handlePrevMonth} sx={{ color: '#aaa' }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h4" fontWeight="900" color="#333" sx={{ fontFamily: 'Futura, sans-serif', letterSpacing: '2px' }}>
                        {currentMonth.getFullYear()}.{currentMonth.getMonth() + 1}
                    </Typography>
                    <IconButton onClick={handleNextMonth} sx={{ color: '#aaa' }}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>

                <Box sx={{ px: 1 }}>
                    {/* 曜日ヘッダー */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        mb: 2, 
                        textAlign: 'center' 
                    }}>
                        {weekDays.map((day, index) => (
                            <Typography key={index} variant="caption" fontWeight="bold" color="#90a4ae" sx={{ fontSize: '0.8rem' }}>
                                {day}
                            </Typography>
                        ))}
                    </Box>

                    {/* 日付グリッド */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        rowGap: '12px', 
                        columnGap: '0px', 
                    }}>
                        {calendarDays.map((day, index) => {
                            if (!day) return <Box key={index} />; 
                            
                            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                            const sentimentInfo = getDateSentimentInfo(day);
                            const hasPost = !!sentimentInfo;

                            let bgColor = 'transparent';
                            let textColor = '#37474f';
                            let fontWeight = 'normal';

                            if (isSelected) {
                                bgColor = '#29b6f6'; 
                                textColor = '#fff';
                                fontWeight = 'bold';
                            } else if (hasPost) {
                                bgColor = sentimentInfo.bgColor; 
                                textColor = '#fff';
                                fontWeight = 'bold';
                            }

                            return (
                                <Box key={index} sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center' 
                                }}>
                                    <ButtonBase
                                        onClick={() => setSelectedDate(day)}
                                        sx={{
                                            width: '36px', height: '36px', 
                                            borderRadius: '50%',
                                            bgcolor: bgColor,
                                            color: textColor,
                                            fontSize: '0.9rem',
                                            fontWeight: fontWeight,
                                            transition: 'all 0.2s',
                                            boxShadow: isSelected ? '0 4px 10px rgba(41, 182, 246, 0.4)' : 'none',
                                        }}
                                    >
                                        {day.getDate()}
                                    </ButtonBase>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>

            {/* 選択した日の詳細（グラフ＋投稿一覧） */}
            <Box sx={{ mt: 4, px: 1 }}>
                <Typography variant="subtitle2" color="#888" gutterBottom sx={{ mb: 2, ml: 1, fontSize: '0.8rem' }}>
                    {selectedDate.toLocaleDateString()} の記録
                </Typography>
                
                {selectedDateMessages.length > 0 ? (
                    <>
                        {/* その日の感情グラフ */}
                        <Box sx={{ 
                            mb: 3, p: 2, 
                            bgcolor: '#fff', borderRadius: '24px', 
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}>
                            <Typography variant="caption" fontWeight="bold" color="#90a4ae" sx={{ display:'block', mb:1, textAlign:'center' }}>
                                この日の感情バランス
                            </Typography>
                            <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dailySentimentData}
                                            innerRadius={45} outerRadius={65}
                                            paddingAngle={4} dataKey="value"
                                            cornerRadius={4}
                                        >
                                            {dailySentimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>

                        {/* 投稿リスト */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {selectedDateMessages.map((msg) => {
                                const fish = fishTypes.find(f => f.id === msg.visualFishId) || fishTypes[0];
                                const sColor = sentimentColors[msg.sentiment];

                                return (
                                    <Paper 
                                        key={msg.id} 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2, 
                                            borderRadius: '20px', 
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            bgcolor: '#fff',
                                            border: '1px solid #f0f0f0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                            transition: 'transform 0.2s',
                                            '&:active': { transform: 'scale(0.98)' }
                                        }}
                                    >
                                        <Box sx={{ 
                                            width: 56, height: 56, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            bgcolor: '#f5f5f5', borderRadius: '18px', flexShrink: 0 
                                        }}>
                                            <img src={process.env.PUBLIC_URL + '/' + fish.img} alt="" style={{ width: '80%' }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ 
                                                    color: sColor, 
                                                    fontWeight: 'bold', 
                                                    bgcolor: '#fff', 
                                                    px: 1, py: 0.2, 
                                                    borderRadius: '10px',
                                                    border: `1px solid ${sColor}22`
                                                }}>
                                                    {sentimentLabels[msg.sentiment]}
                                                </Typography>
                                                <Typography variant="caption" color="#aaa">
                                                    {msg.createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="#444" sx={{ lineHeight: 1.5 }}>
                                                {msg.text}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    </>
                ) : (
                    <Box sx={{ 
                        py: 4, 
                        textAlign: 'center', 
                        bgcolor: '#fafafa', 
                        borderRadius: '16px',
                        border: '1px dashed #e0e0e0'
                    }}>
                        <Typography variant="body2" color="#bbb">
                            この日は静かな海でした
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* 名前編集モーダル */}
            {isEditing && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Box sx={{ bgcolor: 'white', p: 4, borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>プロフィール編集</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar src={newImage ? URL.createObjectURL(newImage) : photoURL} sx={{ width: 100, height: 100, mb: 2 }} />
                            <Button variant="outlined" component="label" size="small">
                                画像を選択
                                <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                            </Button>
                        </Box>
                        <TextField
                            fullWidth label="名前" variant="outlined"
                            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={() => { setIsEditing(false); setNewImage(null); }} color="inherit">キャンセル</Button>
                            <Button onClick={handleSaveProfile} variant="contained" sx={{ bgcolor: '#0288d1' }}>保存</Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default UserProfile;