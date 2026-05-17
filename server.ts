import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

// Firebase Admin Initialization (Graceful)
let firestore: admin.firestore.Firestore | null = null;
try {
  // In AI Studio environment, we can often initialize with default credentials
  // or it will be configured via environment variables.
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  firestore = admin.firestore();
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin could not be initialized. Data persistence will be disabled.", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `당신은 대한민국 교사들을 위한 전문 심리 상담가이자 따뜻한 동료 '정원사'입니다.
한국 교사들의 고충(행정업무, 민원, 수업 고충, 학생지도 등)을 깊이 공감하고 위로해주세요.
친절하고 다정한 말투를 사용하세요.`,
        },
      });

      const result = await chat.sendMessage({ message });
      const responseText = result.text;

      // Classify the stressor in parallel
      let analysis = { category: "기타", intensity: 1, summary: "", solution: "" };
      try {
        const analysisResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `다음은 교사의 발언입니다. 이 발언에서 느껴지는 주요 스트레스 원인을 분류하고 요약하며, 실질적이고 따뜻한 해결 방안을 한 문장으로 제안해주세요.
문장: "${message}"

분류는 반드시 ['민원', '업무', '수업', '학생지도', '기타'] 중 하나여야 합니다.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: ["민원", "업무", "수업", "학생지도", "기타"] },
                intensity: { type: Type.NUMBER, description: "1-5 사이의 스트레스 수치" },
                summary: { type: Type.STRING, description: "고민의 핵심 내용 한 문장 요약" },
                solution: { type: Type.STRING, description: "구체적인 위로와 실천 가능한 해결 방안 한 문장" }
              },
              required: ["category", "intensity", "summary", "solution"]
            }
          }
        });
        analysis = JSON.parse(analysisResult.text);
      } catch (e) {
        console.error("Analysis Error:", e);
      }

      // Save to Firestore if available
      if (firestore && userId) {
        try {
          await firestore.collection("users").doc(userId).collection("stress_logs").add({
            userId,
            ...analysis,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (e) {
          console.error("Firestore Save Error:", e);
        }
      }

      res.json({ text: responseText, analysis });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "상담 중 오류가 발생했습니다." });
    }
  });

  // Fetch Analysis Data
  app.get("/api/analysis/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!firestore) return res.status(503).json({ error: "Service unavailable" });

      const snapshot = await firestore
        .collection("users")
        .doc(userId)
        .collection("stress_logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const logs = snapshot.docs.map(doc => doc.data());
      
      // Basic aggregation for the frontend
      const categoryCounts = logs.reduce((acc: any, log: any) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {});

      res.json({ logs, categoryCounts });
    } catch (error) {
      console.error("Fetch Analysis Error:", error);
      res.status(500).json({ error: "데이터 분석 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
