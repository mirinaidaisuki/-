import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to handle base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON schema for the Socratic Question analysis
const socraticResponseSchema = {
  type: Type.OBJECT,
  properties: {
    problemSummary: {
      type: Type.STRING,
      description: "抽出された問題の詳しい説明や問題文を、マークダウン等で書き起こした日本語テキスト。数式や図等の状況も説明してください。",
    },
    subject: {
      type: Type.STRING,
      description: "教科名 （例: 算数/数学, 理科/物理/化学, 国語, 英語, 社会, その他）",
    },
    difficultyLevel: {
      type: Type.STRING,
      description: "対象となる学習段階。例: 小学校低学年, 小学校高学年, 中学校, 高校, 一般など。",
    },
    socraticSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: {
            type: Type.INTEGER,
            description: "ステップ番号（1から始まる連番）",
          },
          title: {
            type: Type.STRING,
            description: "このステップで考えるべきことのテーマタイトル。例: 「情報の整理と図式化」など短い見出し。",
          },
          guidanceText: {
            type: Type.STRING,
            description: "指導者から生徒への、考えるアプローチ。解決へ向けた注目してほしい関係性や概念の気づきを促すためのリード文。",
          },
          probingQuestion: {
            type: Type.STRING,
            description: "生徒に投げかける、考えさせるための「具体的な問いかけ」。答えを直接教えず、ヒントから能動的に気付かせる言葉遣い。",
          },
          hintText: {
            type: Type.STRING,
            description: "もし問いかけに答えられなかった場合に役立つ、優しく簡単なサポートヒント（例: 辺の数、特定の値、具体例など）。",
          },
        },
        required: ["stepNumber", "title", "guidanceText", "probingQuestion", "hintText"],
      },
    },
    coachingTips: {
      type: Type.OBJECT,
      properties: {
        keyInventionPoint: {
          type: Type.STRING,
          description: "この問題を解くための、最も重要となる『気づき（ひらめき・概念）』のポイント。",
        },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "生徒がつまずきやすい代表的なミス、思い込み、不注意の原因など。",
        },
        howToGuide: {
          type: Type.STRING,
          description: "指導者（親や先生）が、教え込みを避けて自発的発見を促すための具体的な関わり方や言葉がけのアドバイス（教え方の提示）。",
        },
        recommendedAnalogy: {
          type: Type.STRING,
          description: "抽象的な概念や計算がむずかしいときに有効な、日常生活などのたとえ話や具体例。",
        },
      },
      required: ["keyInventionPoint", "commonMistakes", "howToGuide", "recommendedAnalogy"],
    },
    fullExplanation: {
      type: Type.OBJECT,
      properties: {
        stepByStepResolution: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "順を追った詳細なステップごとの解決手順・解き方。",
        },
        finalAnswer: {
          type: Type.STRING,
          description: "最終的な答え/結論。（答えあわせ用）",
        },
        coreFormulaOrConcept: {
          type: Type.STRING,
          description: "使われている重要な公式、主要語句、概念のまとめや定義の解説。",
        },
      },
      required: ["stepByStepResolution", "finalAnswer", "coreFormulaOrConcept"],
    },
  },
  required: ["problemSummary", "subject", "difficultyLevel", "socraticSteps", "coachingTips", "fullExplanation"],
};

// API Endpoints

// 1. Analyze Question (Supports text input or base64 image input)
app.post("/api/analyze-question", async (req, res) => {
  try {
    const { text, image, mimeType } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing on server.",
      });
    }

    const contents: any[] = [];

    // System instruction for the Socratic Planner
    const systemInstruction = 
      "あなたは超一流の教育工学スペシャリストであり、ソクラテス式メソドロジー（問答法）を得意とする「寄り添い型AI先生」の伴走計画作成機です。\n" +
      "生徒が持ち込んだ問題（画像、またはテキスト）を徹底的に分析し、直接答えを丸教えせずに「自発的なアハ体験（気づき）」をステップバイステップで設計できる高度な学習マップ（計画）を作成してください。\n" +
      "解答はすべて親切な日本語で詳細に入力し、生徒がどの学年であっても応用できるよう、具体的かつ優しく設計してください。\n" +
      "【数式・記号の記述ルール】\n" +
      "数式や変数を使用する場合は、プレーンなテキスト(例: x^2, v_0)または標準的なLaTeX表記(例: $x^2 + y^2 = 1$)を使用してください。かけ算は「*」または「\\times」を使用してください。";

    if (image && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      });
    }

    let userPrompt = "以下の問題を分析し、ソクラテス式の生徒対話ステップ、指導者向けアドバイス、解答解説を構築してください。";
    if (text) {
      userPrompt += `\n\n【問題文】\n${text}`;
    }
    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: socraticResponseSchema,
        temperature: 0.1, // low temperature for highly structured consistency
      },
    });

    if (!response.text) {
      throw new Error("No response or text returned from Gemini API");
    }

    const parsedData = JSON.parse(response.text.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error analyzing question with Gemini:", error);
    return res.status(500).json({
      error: "Gemini APIによる問題分析に失敗しました。詳細: " + error.message,
    });
  }
});

// 2. Interactive Socratic Chat
app.post("/api/chat-step", async (req, res) => {
  try {
    const { problemContext, currentStep, history, userMessage } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing on server.",
      });
    }

    // Build interactive chat system instructions
    const systemInstruction =
      "あなたは親切で粘り強い「ソクラテス式 AI先生」です。生徒が提示した問題について、直接正解を教えることなく、生徒自身が自ら思考して答えに辿り着けるように対話的に補助します。\n\n" +
      "【対話の基本方針】\n" +
      "1. 生徒の発言から『理解の程度』を読み取ってください。「わからない」と言われたら、さらに簡単な例やステップに噛み砕いて問いかけてください。\n" +
      "2. 部分的に合っているところがあれば、そこを「大正解！すばらしいです！」と大袈裟に褒め、次のステップに進む問いかけをしてください。\n" +
      "3. 答えを聞かれても、絶対に最終的な正解を教えないでください。「一緒に考えましょう」「少しずつ順番に解き明かせば簡単ですよ」と温かく返答します。\n" +
      "4. 親しみやすい日本語（丁寧語、褒め上手な言い回し、絵文字少なめ、あたたかみ重視）で返答してください。回答は比較的簡潔（100〜200文字程度）にし、生徒が返信しやすいよう最後に必ず『1つの、答えやすい問いかけ』を投げてください。\n" +
      "5. 数式や物理量、変数を取り扱う場合は、プレーンな書き方（例: x^2, v_0, 1/2*m*v^2）またはドル等で囲んだLaTeX形式（例: $x^2$, $v_0$）で記述して生徒に送ってください。";

    const chatContextPrompt = 
      `【学習中の問題背景】\n${JSON.stringify(problemContext)}\n\n` +
      `【現在フォーカスしている学習ステップ】\n${JSON.stringify(currentStep)}\n\n` +
      `これまで、生徒はステップの問いかけに対し答えています。過去のやり取りや現在のステップをベースに、生徒の最新の入力「${userMessage}」に対して最良のソクラテス式ヒント・問いかけで応答を返してください。`;

    const contents: any[] = [];

    // Map history to official parts if provided, otherwise keep it simple
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      });
    }

    // Append current user message inside context
    contents.push({
      role: "user",
      parts: [{ text: chatContextPrompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // higher temperature for natural conversations
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in interactive chat:", error);
    return res.status(500).json({
      error: "対話の生成に失敗しました。詳細: " + error.message,
    });
  }
});

// Setup Vite & Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
