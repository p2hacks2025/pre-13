// fileName: src/utils/gpt.js

export const analyzeSentiment = async (text) => {
    // ⚠️ ここに貼り付ける際、前後にスペースが入らないよう注意してください
    const rawKey = import.meta.env.VITE_OPENAI_API_KEY;
    // APIキーから目に見えない不正な文字を完全に除去する
    const API_KEY = rawKey.replace(/[^\x00-\x7F]/g, "").trim();
    
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // API_KEYの変数を使うことで、クリーンな文字列を送信します
                "Authorization": `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "あなたは感情分析AIです。入力された日本語テキストの感情を判定し、【喜・怒・哀・楽】のいずれか1文字だけで回答してください。どうしても判定できない場合のみ【無】と回答してください。余計な説明や句読点は一切不要です。"
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3,
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI API Error:", data.error.message);
            return "？";
        }

        const rawContent = data.choices[0].message.content;
        const match = rawContent.match(/[喜怒哀楽無]/);
        
        return match ? match[0] : "無";

    } catch (error) {
        // ここでエラーが出た場合、コンソールに詳細を表示します
        console.error("GPT分析中に通信エラーが発生しました:", error);
        return "？";
    }
};