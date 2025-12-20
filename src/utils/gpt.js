// fileName: src/utils/gpt.js

// 提供されたAPIキー
const apiKey =import.meta.env.VITE_OPENAI_API_KEY;
const url = "https://api.openai.com/v1/chat/completions";

/**
 * 1. 投稿時の感情分析とタイトル生成
 */
export const analyzeSentimentAndTitle = async (text) => {
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
                response_format: { type: "json_object" },
                temperature: 0.3,
            }),
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        
        return {
            sentiment: result.sentiment || "ENJOY",
            title: result.title || text.substring(0, 7)
        };
    } catch (error) {
        console.error("GPT分析エラー:", error);
        return { sentiment: "ENJOY", title: text.substring(0, 7) };
    }
};

/**
 * 2. プロフィール用の週間フィードバック生成
 * ユーザーの1週間の投稿（感情タグ）を受け取り、ポジティブなフィードバックを返します
 */
export const generateWeeklyFeedback = async (sentiments) => {
    // 投稿がない場合
    if (!sentiments || sentiments.length === 0) {
        return "まだ今週の記録がありません。あなたの今の気持ちを、少しずつ海に流してみませんか？";
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
                        content: "あなたはユーザーの心をケアする優しいAIカウンセラーです。ユーザーの直近1週間の「感情タグのリスト」を分析し、ユーザーを肯定し、励ますような温かいフィードバックを日本語で100文字以内で作成してください。文体は柔らかく、'~ですね' '~しましょう' といった語尾を使ってください。" 
                    },
                    { 
                        role: "user", 
                        content: `今週の感情リスト: ${sentiments.join(", ")}` 
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