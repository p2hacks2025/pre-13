// fileName: PostTypeToggle.js

import React from 'react';
import { Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/**
 * 画面下部中央に表示される、投稿タイプ（きらきら/やみ）を切り替えるトグルボタン。
 * * @param {string} currentFilter 現在のフィルタタイプ ('shallow' or 'deep')
 * @param {function} onSelect 新しいフィルタタイプを選択するためのコールバック
 */
function PostTypeToggle({ currentFilter, onSelect }) {
    const isShallow = currentFilter === 'shallow';
    
    // 次に切り替えるフィルタを決定
    const nextFilter = isShallow ? 'deep' : 'shallow';
    
    // 使用するアイコンを決定 (きらきらへは上矢印、やみへは下矢印)
    const IconComponent = isShallow ? ArrowDownwardIcon : ArrowUpwardIcon;

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px', 
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000, 
            }}
        >
            <Button
                variant="contained"
                color="secondary"
                onClick={() => onSelect(nextFilter)}
                // テキストを削除し、アイコンのみの表示に調整
                style={{
                    minWidth: '50px', // ボタンの最小幅を小さくする
                    width: '50px',   // 正方形に近い形に調整
                    height: '50px',
                    padding: 0,      // パディングを削除
                }}
            >
                {/* テキスト (`label`) を削除し、アイコンのみ残す */}
                <IconComponent style={{ fontSize: '30px' }} />
            </Button>
        </div>
    );
}

export default PostTypeToggle;