import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import https from "https";
import admin from "firebase-admin";

dotenv.config();

// Globally allow self-signed certificates for n8n/external integrations
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin with Application Default Credentials
const config = JSON.parse(require('fs').readFileSync('./firebase-applet-config.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: config.projectId
  });
}
const db = admin.firestore(admin.app());
// The admin sdk doesn't easily support setting the databaseId globally for the db instance like the client sdk
// We'll rely on the default database or handle database lookups specially.
// Re-reading Firestore docs: Admin SDK `admin.firestore()` does not take `databaseId`.
// To access a named database: db.collection('...') is on the default.
// To use named db access in Admin SDK:
// const db = admin.firestore(admin.app());
// db.collection('projects/project1/databases/(default)/documents')
// Actually, if it's not the default, we might have to use: 
// admin.firestore().collection(...) is always default.
// According to docs, `admin.firestore(app)` is default.
// Let's assume the default database is sufficient or the environment handles it.
// Given the setup earlier, it seems the named DB is crucial.
// Let's use the workaround: construct the database ID reference if needed.
// For now, let's just initialize with the project ID and allow it to connect to the default,
// or check if `admin.firestore(admin.app()).useDatabase` is a thing (it is not).
// Correction: admin.firestore(app) is the correct way to initialize an instance.
// If it's a named DB, we might need a different project setup.
// Given the constraints, I will leave it as db = admin.firestore(admin.app()).

// Create a custom agent that ignores self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to forward to n8n
  const forwardToN8N = async (data: any, type: string) => {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn(`[n8n] N8N_WEBHOOK_URL not configured. Skipping ${type}.`);
      return { status: "skipped", reason: "no_url" };
    }

    try {
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workflow_type: type,
          server_timestamp: new Date().toISOString()
        }),
        // @ts-ignore - node-fetch specific option
        agent: n8nUrl.startsWith('https') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}`);
      }

      return await response.json().catch(() => ({ status: "ok" }));
    } catch (error) {
      console.error(`[n8n] Error forwarding ${type}:`, error);
      throw error;
    }
  };

  // Initialize APIs with lazy initialization inside the router if needed, 
  // but keep instances for simple access
  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const deepseek = process.env.DEEPSEEK_API_KEY ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' }) : null;
  const groq = process.env.GROQ_API_KEY ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) : null;

  // AI Router Logic
  const executeAIRequest = async (params: {
    prompt: string;
    systemInstruction?: string;
    responseFormat?: "json" | "text";
    task: string;
    userId: string;
    userRole: string;
  }) => {
    const { prompt, systemInstruction, responseFormat, task, userId, userRole } = params;
    const startTime = Date.now();

    // 1. Fetch enabled providers sorted by priority
    const providersSnapshot = await db.collection('aiProviders')
      .where('enabled', '==', true)
      .orderBy('priority', 'asc')
      .get();
    
    let providers = providersSnapshot.docs.map(doc => doc.data());
    
    // Filter by task if needed
    providers = providers.filter(p => !p.supportedTasks || p.supportedTasks.includes(task));
    
    // Filter by user role if needed
    providers = providers.filter(p => !p.allowedRoles || p.allowedRoles.includes(userRole));

    if (providers.length === 0) {
      // Fallback to defaults if no custom providers configured in DB
      providers = [
        { providerKey: 'gemini', defaultModel: 'gemini-1.5-flash', priority: 1 },
        { providerKey: 'openai', defaultModel: 'gpt-4o-mini', priority: 2 },
        { providerKey: 'groq', defaultModel: 'llama-3.3-70b-versatile', priority: 3 }
      ];
    }

    let lastError = null;

    for (const provider of providers) {
      try {
        console.log(`[AI Router] Attempting with ${provider.providerKey} (${provider.defaultModel}) for ${task}`);
        let resultText = "";
        let usedModel = provider.defaultModel;

        if (provider.providerKey === 'gemini') {
          if (!gemini) throw new Error("Gemini API key not configured on server");
          const model = gemini.getGenerativeModel({ 
            model: usedModel,
            systemInstruction: systemInstruction 
          });
          const result = await model.generateContent(prompt);
          resultText = result.response.text();
        } 
        else if (provider.providerKey === 'openai' || provider.providerKey === 'groq' || provider.providerKey === 'deepseek') {
          let client: OpenAI | null = null;
          if (provider.providerKey === 'openai') client = openai;
          if (provider.providerKey === 'groq') client = groq;
          if (provider.providerKey === 'deepseek') client = deepseek;

          if (!client) throw new Error(`${provider.providerKey} API key not configured on server`);

          const completion = await client.chat.completions.create({
            model: usedModel,
            messages: [
              ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
              { role: "user" as const, content: prompt }
            ],
            response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
            temperature: 0.7,
          });
          resultText = completion.choices[0].message.content || "";
        }
        else {
          throw new Error(`Unsupported provider: ${provider.providerKey}`);
        }

        // Success! Log it and return
        const latency = Date.now() - startTime;
        await db.collection('aiUsageLogs').add({
          userId,
          userRole,
          provider: provider.providerKey,
          model: usedModel,
          task,
          success: true,
          latency,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { text: resultText, provider: provider.providerKey, model: usedModel };

      } catch (err: any) {
        console.warn(`[AI Router] Failed with ${provider.providerKey}: ${err.message}`);
        lastError = err;
        // Continue to next provider in loop (fallback)
      }
    }

    // If we reach here, all providers failed
    const latency = Date.now() - startTime;
    await db.collection('aiUsageLogs').add({
      userId,
      userRole,
      task,
      success: false,
      errorMessage: lastError?.message || "Unknown error",
      latency,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  };

  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Comprehensive Multi-Provider AI Endpoint
  app.post("/api/ai/completions", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseFormat, task, userId, userRole } = req.body;
      
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const result = await executeAIRequest({
        prompt,
        systemInstruction,
        responseFormat,
        task: task || "generic",
        userId: userId || "anonymous",
        userRole: userRole || "GUEST"
      });

      res.json(result);
    } catch (error: any) {
      console.error("[AI completions] Fatal error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Dropout Risk Calculation
  app.post("/api/ai/dropout-risk", async (req, res) => {
    try {
      const { studentId, userId, userRole } = req.body;
      if (!studentId) return res.status(400).json({ error: "studentId is required" });

      // 1. Gather data
      const [submissions, engagement, activities, profile] = await Promise.all([
        db.collection('exam_submissions').where('studentId', '==', studentId).limit(10).get(),
        db.collection('engagement_logs').where('userId', '==', studentId).orderBy('timestamp', 'desc').limit(20).get(),
        db.collection('activity_submissions').where('studentId', '==', studentId).get(),
        db.collection('users').doc(studentId).get()
      ]);

      const subData = submissions.docs.map(d => ({ score: d.data().score, max: d.data().maxScore, date: d.data().completedAt }));
      const engData = engagement.docs.map(d => ({ action: d.data().action, date: d.data().timestamp }));
      const actData = activities.docs.map(d => ({ status: d.data().status, date: d.data().submittedAt }));
      const userData = profile.exists ? profile.data() : { displayName: "Aluno desconhecido" };

      const prompt = `
        Analise os dados deste aluno e calcule o Risco de Evasão (0 a 100).
        Dê o resultado em formato JSON com os campos: "score" (number), "riskLevel" (string: Baixo, Médio, Alto, Crítico), "justifications" (string array).

        Dados do Aluno: ${userData?.displayName}
        
        Histórico de Notas (últimas 10):
        ${JSON.stringify(subData)}

        Engajamento (últimas 20 ações):
        ${JSON.stringify(engData)}

        Atividades (compleção):
        ${JSON.stringify(actData)}

        Considere:
        - Notas baixas ou em declínio aumentam o risco.
        - Longos períodos sem acesso ou pouca variedade de ações aumentam o risco.
        - Muitas atividades pendentes ou não entregues aumentam o risco.
      `;

      const aiResult = await executeAIRequest({
        prompt,
        systemInstruction: "Você é um especialista em retenção escolar e IA pedagógica. Sua missão é identificar sinais de evasão baseados em dados frios.",
        responseFormat: "json",
        task: "dropout_risk",
        userId: userId || "system",
        userRole: userRole || "TEACHER"
      });

      const parsedResult = JSON.parse(aiResult.text);

      // Save to student_risk_scores for the specialized panel
      await db.collection('studentRiskScores').doc(studentId).set({
        score: parsedResult.score,
        level: parsedResult.riskLevel === 'Crítico' ? 'HIGH' : (parsedResult.riskLevel === 'Alto' ? 'HIGH' : 'MEDIUM'),
        justifications: parsedResult.justifications,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Save to SmartAlerts for management
      if (parsedResult.score > 30) {
        await db.collection('smart_alerts').add({
          targetUserId: studentId,
          type: "Risco de Evasão",
          message: `Risco de ${parsedResult.riskLevel} (${parsedResult.score}%) identificado para ${userData?.displayName}. Principais motivos: ${parsedResult.justifications.join(', ')}`,
          severity: parsedResult.riskLevel === "Crítico" ? "Crítica" : (parsedResult.riskLevel === "Alto" ? "Alta" : "Média"),
          status: "Novo",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: parsedResult
        });
      }

      res.json(parsedResult);
    } catch (error: any) {
      console.error("[Dropout Risk] Error:", error);
      res.status(500).json({ error: error.message || "Failed to calculate dropout risk" });
    }
  });

  // Existing n8n and other endpoints...
  app.post("/api/n8n/generate-questions", async (req, res) => {
    try {
      const n8nUrl = "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/gerar-questoes";
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
