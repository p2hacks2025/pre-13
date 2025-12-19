import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function SentimentChart({ messages }) {
    // 1. 感情データの集計
    const dataObj = messages.reduce((acc, msg) => {
        const s = msg.sentiment || 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    // 2. グラフ用配列に変換
    const chartData = [
        { name: 'Enjoy', value: dataObj.enjoy || 0, color: '#fff9c4' },
        { name: 'Sad', value: dataObj.sad || 0, color: '#bbdefb' },
        { name: 'Heal', value: dataObj.heal || 0, color: '#e1f5fe' },
        { name: 'Excite', value: dataObj.excite || 0, color: '#ffcc80' },
        { name: 'Angry', value: dataObj.angry || 0, color: '#ffcdd2' },
    ];

    return (
        <div style={{ width: '100%', height: 300 }}>
            <h3>感情の統計</h3>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}