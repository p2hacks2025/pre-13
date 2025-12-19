const apiKey =import.meta.env.VITE_OPENAI_API_KEY;
const url = "https://api.openai.com/v1/chat/completions";

/**
 * 1. 投稿時の感情分析とタイトル生成
 * 文章から自動的に感情（魚の種類）を決定します
 */
export const analyzeSentimentAndTitle = async (text) => {
    // 魚の選択ステップを廃止し、GPTが以下のIDから1つを強制的に選ぶように指示します
    const prompt = `
        ユーザーの投稿テキストを分析し、必ず以下のJSON形式のみで回答してください。
        1. sentiment: 以下のリストから、文章に最も近い感情を1つだけ選んでください。
           [ENJOY, SAD, ANGRY, EXCITE, HEAL, DARK]
        2. title: 文章の内容を7文字以内で要約してください。
        
        テキスト: "${text}"
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo-0125",
                messages: [
                    { 
                        role: "system", 
                        content: "あなたは感情分析の専門家です。回答は必ず純粋なJSON形式のみで行い、余計な解説は一切含めないでください。" 
                    },
                    { role: "user", content: prompt }
                ],
                // JSONモードを有効化してパースエラーを防止
                response_format: { type: "json_object" },
                temperature: 0.3,
            }),
        });

        const data = await response.json();
        // GPTからの回答（JSON文字列）をオブジェクトに変換
        const result = JSON.parse(data.choices[0].message.content);
        
        return {
            sentiment: result.sentiment || "ENJOY", // 万が一空の場合はENJOYをデフォルトに
            title: result.title || text.substring(0, 7)
        };
    } catch (error) {
        console.error("GPT分析エラー:", error);
        // エラー時のフォールバック
        return { sentiment: "ENJOY", title: text.substring(0, 7) };
    }
};

/**
 * 2. プロフィール用の週間フィードバック生成
 */
export const generateWeeklyFeedback = async (sentiments) => {
    if (!sentiments || sentiments.length === 0) {
        return "記録を始めると、AIがあなたの心に寄り添うフィードバックをお届けします。";
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: "あなたはあたたかいカウンセラーです。投稿の具体的な内容には触れず、提供された感情タグ（ENJOY, SAD等）の傾向のみを分析し、ポジティブで優しいフィードバックを100文字程度で作成してください。" 
                    },
                    { 
                        role: "user", 
                        content: `過去1週間の感情傾向：${sentiments.join(", ")}。これらを肯定して励ましてください。` 
                    }
                ],
                temperature: 0.7
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("GPTフィードバックエラー:", error);
        return "あなたの心が、少しでも穏やかな方向に進むことを願っています。";
    }
};