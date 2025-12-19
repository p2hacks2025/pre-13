// fileName: src/components/UserProfile.js

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase.js';
import { Box, Typography, Avatar, Divider, CircularProgress, Grid, Paper, MenuItem, Select, FormControl } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCustom.css';
import EditIcon from '@mui/icons-material/Edit';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { generateWeeklyFeedback } from '../utils/gpt';

function UserProfile() {
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gptFeedback, setGptFeedback] = useState("");
    const [isGptLoading, setIsGptLoading] = useState(false);
    const [filterRange, setFilterRange] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const user = auth.currentUser;
    const sentimentConfig = {
        ENJOY: '#FBC02D', SAD: '#039BE5', ANGRY: '#E53935',
        EXCITE: '#F06292', HEAL: '#43A047', DARK: '#424242',
    };

    useEffect(() => {
        if (!user) return;

        const unsubPosts = db.collection('messages')
            .where('uid', '==', user.uid)
            .onSnapshot(async (s) => {
                const posts = s.docs.map(d => ({ 
                    id: d.id, 
                    ...d.data(), 
                    date: d.data().createdAt?.toDate() || new Date() 
                }));
                setAllPosts(posts);
                setLoading(false);

                if (posts.length > 0 && gptFeedback === "") {
                    handleFetchAiFeedback(posts);
                }
            });
        return () => unsubPosts();
    }, [user, gptFeedback]);

    const handleFetchAiFeedback = async (posts) => {
        setIsGptLoading(true);
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            const lastWeekSentiments = posts
                .filter(p => p.date >= sevenDaysAgo)
                .map(p => p.sentiment);

            const targetSentiments = lastWeekSentiments.length > 0 
                ? lastWeekSentiments 
                : posts.slice(0, 5).map(p => p.sentiment);

            const feedback = await generateWeeklyFeedback(targetSentiments);
            setGptFeedback(feedback);
        } catch (e) {
            console.error(e);
            setGptFeedback("あたたかいフィードバックを準備中です。");
        } finally {
            setIsGptLoading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        const now = new Date();
        return allPosts.filter(p => {
            if (filterRange === 'today') return p.date.toDateString() === now.toDateString();
            if (filterRange === 'week') return p.date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (filterRange === 'month') return p.date >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return true;
        });
    }, [allPosts, filterRange]);

    const chartData = Object.keys(sentimentConfig).map(key => ({
        name: key,
        value: filteredPosts.filter(p => p.sentiment === key).length
    })).filter(d => d.value > 0);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#fff', height: '100%', overflowY: 'auto', pb: 12 }}>
            
            {/* 1. AIフィードバックヘッダー */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={user?.photoURL} sx={{ width: 85, height: 85, border: '1.5px solid #f8f8f8' }} />
                    <Box sx={{ 
                        position: 'absolute', bottom: 0, right: 0, 
                        bgcolor: '#4285F4', borderRadius: '50%', p: 0.5, border: '2px solid #fff', display: 'flex' 
                    }}>
                        <EditIcon sx={{ color: '#fff', fontSize: 14 }} />
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1, height: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <AutoAwesomeIcon sx={{ fontSize: 14, color: '#FBC02D' }} />
                        <Typography variant="caption" sx={{ color: '#FBC02D', fontWeight: 'bold' }}>Weekly AI Feedback</Typography>
                    </Box>
                    <Box sx={{ 
                        flexGrow: 1, bgcolor: '#FFFDE7', px: 1.8, py: 1.2, borderRadius: '16px', borderTopLeftRadius: '2px',
                        display: 'flex', alignItems: 'center', mt: 0.5, overflowY: 'auto'
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: '600', lineHeight: 1.45, color: '#444', fontSize: '12.5px' }}>
                            {isGptLoading ? "分析中..." : (gptFeedback || "投稿を読み込んでいます...")}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 2. 統計カウンター */}
            <Box sx={{ px: 4, py: 2, mb: 1 }}>
                <Grid container justifyContent="space-around" sx={{ textAlign: 'center' }}>
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">ポスト</Typography>
                        <Typography variant="h6" fontWeight="bold">{allPosts.length}</Typography>
                    </Grid>
                    <Divider orientation="vertical" flexItem />
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">コメント</Typography>
                        <Typography variant="h6" fontWeight="bold">0</Typography>
                    </Grid>
                    <Divider orientation="vertical" flexItem />
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">Feelyou</Typography>
                        <Typography variant="h6" fontWeight="bold">{allPosts.reduce((s,p)=>s+(p.likeCount||0),0)}</Typography>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ mx: 3, my: 1, opacity: 0.6 }} />

            {/* 3. 感情割合 */}
            <Paper elevation={0} sx={{ m: 2, p: 2.5, borderRadius: '24px', border: '1px solid #f5f5f5', bgcolor: '#fafafa' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">感情割合</Typography>
                    <FormControl variant="standard">
                        <Select value={filterRange} onChange={(e) => setFilterRange(e.target.value)} sx={{ fontSize: '12px', fontWeight: 'bold' }} disableUnderline>
                            <MenuItem value="today">今日</MenuItem>
                            <MenuItem value="week">1週間</MenuItem>
                            <MenuItem value="month">1ヶ月</MenuItem>
                            <MenuItem value="all">全期間</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={chartData.length > 0 ? chartData : [{ name: 'none', value: 1 }]} 
                                innerRadius={55} outerRadius={75} dataKey="value" stroke="none"
                            >
                                {chartData.length > 0 ? (
                                    chartData.map((e, i) => <Cell key={i} fill={sentimentConfig[e.name] || '#eee'} />)
                                ) : (
                                    <Cell fill="#eee" />
                                )}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* 4. アクティビティ */}
            <Box sx={{ p: 2, pb: 10 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ px: 1, mb: 1.5 }}>アクティビティ</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Calendar onChange={setSelectedDate} value={selectedDate} locale="ja-JP" className="custom-calendar" />
                </Box>
            </Box>
        </Box>
    );
}

export default UserProfile;