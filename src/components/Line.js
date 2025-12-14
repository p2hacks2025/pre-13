// fileName: Line.js (メッセージ表示・非表示機能の追加)

// ... (インポート部分は省略)
import React, { useState, useEffect } from 'react'; // Reactのインポートを整理
import SignOut from './SignOut';
import { db } from "../firebase.js";
import SendMessage from './SendMessage';
import { auth } from '../firebase.js';  
import LikeButton from './LikeButton'; 

function Line() {
const [messages, setMessages] = useState([]);
// ★★★ 1. 投稿の表示状態を管理するステートを追加 ★★★
// キーはメッセージID、値はブーリアン (true: 表示, false: 非表示)
const [showText, setShowText] = useState({}); 

useEffect(() => {
    db.collection("messages")
    .orderBy("createdAt")
    .limit(50)
    .onSnapshot((snapshot) => {
        setMessages(snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })));
    });
}, []);

// ★★★ 2. アイコンクリックで表示状態を切り替える関数 ★★★
const toggleText = (messageId) => {
    // 現在の状態を反転させる
    setShowText(prevShowText => ({
        ...prevShowText,
        [messageId]: !prevShowText[messageId]
    }));
};

  return (
    <div>
      {console.log(messages)}
      <SignOut />
      <div class="msgs">
        {messages.map((message) => {
            
            // ... (フォントサイズ計算ロジックは省略または維持) ...
            
            const likes = message.likes || {};
            const likeCount = Object.keys(likes).length;
            const baseSize = 15; 
            const sizeIncreasePerLike = 0.5;
            const maxSize = 30; 
            
            let dynamicSize = baseSize + (likeCount * sizeIncreasePerLike);
            dynamicSize = Math.min(maxSize, dynamicSize);

            const textStyle = {
                fontSize: `${dynamicSize}px`,
                fontWeight: likeCount > 0 ? 'bold' : 'normal' 
            };
            // --------------------------------------------------

            // ★ 該当メッセージが表示状態にあるか確認
            const isTextVisible = showText[message.id];
            
            return (
                <div key={message.id}>
                    <div className={`msg ${
                         message.uid === auth.currentUser.uid ?
                         "sent" : "received"}`
                         }>
                        {/* ★★★ 3. アイコンにクリックイベントを追加 ★★★ */}
                        <img 
                            src={message.photoURL} 
                            alt="" 
                            onClick={() => toggleText(message.id)} 
                            style={{ cursor: 'pointer' }} // クリック可能であることを示す
                        />
                        
                        {/* ★★★ 4. テキストの条件付き表示 ★★★ */}
                        {isTextVisible && 
                          <p style={textStyle}>{message.text}</p>
                        }
                        
                        <LikeButton message={message} />
                    </div>
                </div>
            )
        })}
      </div>
      <SendMessage />
    </div>
  );
}

export default Line;