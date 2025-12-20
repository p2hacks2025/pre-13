// fileName: CalendarView.js

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // デフォルトCSSをインポート

// カレンダーコンポーネント
// onDateSelect は、選択された日付を親コンポーネントに渡すための関数
function CalendarView({ onDateSelect }) {
    // 選択された日付を内部状態として持つ
    const [value, onChange] = useState(new Date());

    // 日付が変更されたときに親に通知するハンドラ
    const handleDateChange = (date) => {
        onChange(date);
        onDateSelect(date); // 選択された日付を親 (Line.js) に渡す
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>日付を選んで投稿を検索</h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Calendar
                    onChange={handleDateChange}
                    value={value}
                    // 初期表示を月ビューに設定
                    view="month" 
                    // 最大の日付を今日に設定（未来の投稿は選択不可）
                    maxDate={new Date()} 
                />
            </div>
            {/* 選択中の日付を表示（デバッグ用） */}
            <p style={{ marginTop: '10px' }}>選択中の日付: {value.toLocaleDateString('ja-JP')}</p>
        </div>
    );
}

export default CalendarView;