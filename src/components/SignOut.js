// fileName: SignOut.js

import React from 'react';
import { auth } from '../firebase.js';
import { Button } from '@mui/material';
// import SettingsIcon from '@mui/icons-material/Settings'; // ★★★ この行を削除 ★★★

function SignOut() {
    return (
        <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            zIndex: 50, 
            display: 'flex', 
            gap: '5px' 
        }}>
            {/* 設定アイコンのボタンを削除しました */}
            
            {/* ログアウトボタン */}
            <Button 
                onClick={() => auth.signOut()} 
                variant="outlined"
                color="primary"
                size="small"
            >
                ログアウト
            </Button>
        </div>
    )
}

export default SignOut;