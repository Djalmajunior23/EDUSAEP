import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import https from "https";
import admin from "firebase-admin";

import fs from "fs";

dotenv.config();

// Globally allow self-signed certificates for n8n/external integrations
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin with Application Default Credentials
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: config.projectId
  });
}
const db = admin.firestore(admin.app());

// Create a custom agent that ignores self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Global CORS middleware
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    next();
  });

  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const deepseek = process.env.DEEPSEEK_API_KEY ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' }) : null;
  const groq = process.env.GROQ_API_KEY ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) : null;

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

    try {
      const providersSnapshot = await db.collection('aiProviders')
        .where('enabled', '==', true)
        .orderBy('priority', 'asc')
        .get();
      
      let providers = providersSnapshot.docs.map(doc => doc.data());
      providers = providers.filter(p => !p.supportedTasks || p.supportedTasks.includes(task));
      providers = providers.filter(p => !p.allowedRoles || p.allowedRoles.includes(userRole));

      if (providers.length === 0) {
        providers = [
          { providerKey: 'gemini', defaultModel: 'gemini-1.5-flash', priority: 1 },
          { providerKey: 'openai', defaultModel: 'gpt-4o-mini', priority: 2 }
        ];
      }

      let lastError = null;
      for (const provider of providers) {
        try {
          let resultText = "";
          let usedModel = provider.defaultModel;

          if (provider.providerKey === 'gemini' && gemini) {
            const model = gemini.getGenerativeModel({ model: usedModel, systemInstruction });
            const result = await model.generateContent(prompt);
            resultText = result.response.text();
          } 
          else if ((provider.providerKey === 'openai' || provider.providerKey === 'groq' || provider.providerKey === 'deepseek')) {
            let client = (provider.providerKey === 'openai' ? openai : (provider.providerKey === 'groq' ? groq : deepseek));
            if (!client) throw new Error(`${provider.providerKey} not configured`);
            const completion = await client.chat.completions.create({
              model: usedModel,
              messages: [
                ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
                { role: "user" as const, content: prompt }
              ],
              response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
            });
            resultText = completion.choices[0].message.content || "";
          }

          if (resultText) {
            await db.collection('aiUsageLogs').add({
              userId, userRole, provider: provider.providerKey, model: usedModel, task,
              success: true, latency: Date.now() - startTime, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            return { text: resultText, provider: provider.providerKey, model: usedModel };
          }
        } catch (err: any) {
          lastError = err;
        }
      }
      throw lastError || new Error("No provider succeeded");
    } catch (error: any) {
      await db.collection('aiUsageLogs').add({
        userId, userRole, task, success: false, errorMessage: error.message,
        latency: Date.now() - startTime, timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      throw error;
    }
  };

  // API Routes
  app.post("/api/ai/completions", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseFormat, task, userId, userRole } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });
      const result = await executeAIRequest({
        prompt, systemInstruction, responseFormat, task: task || "generic", userId: userId || "anonymous", userRole: userRole || "GUEST"
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/dropout-risk", async (req, res) => {
    try {
      const { studentId, userId, userRole } = req.body;
      const [submissions, engagement, activities, profile] = await Promise.all([
        db.collection('resultados').where('studentId', '==', studentId).limit(10).get(),
        db.collection('engagement_logs').where('userId', '==', studentId).orderBy('timestamp', 'desc').limit(20).get(),
        db.collection('activity_submissions').where('studentId', '==', studentId).get(),
        db.collection('users').doc(studentId).get()
      ]);

      const subData = submissions.docs.map(d => d.data());
      const prompt = `Analise o risco de evasão para o aluno ${profile.data()?.displayName}. Dados: ${JSON.stringify({ subData, engagement: engagement.docs.length, activities: activities.docs.length })}`;
      
      const aiResult = await executeAIRequest({
        prompt, systemInstruction: "Especialista em evasão.", responseFormat: "json",
        task: "dropout_risk", userId: userId || "system", userRole: userRole || "TEACHER"
      });

      const result = JSON.parse(aiResult.text);
      await db.collection('studentRiskScores').doc(studentId).set({ ...result, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/forms", async (req, res) => {
    try {
      const n8nUrl = "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/forms";
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        // @ts-ignore
        agent: httpsAgent
      });
      res.json(await response.json().catch(() => ({ status: "ok" })));
    } catch (error: any) {
      console.error("[n8n forms] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/test", async (req, res) => {
    try {
      const { url, data } = req.body;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        // @ts-ignore
        agent: httpsAgent
      });
      res.json({ ok: response.ok, status: response.status });
    } catch (error: any) {
      console.error("[n8n test] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/:endpoint", async (req, res) => {
    try {
      const { endpoint } = req.params;
      const n8nEndpoints: Record<string, string> = {
        'alerts': "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/alerts",
        'plans': "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/plans",
        'import': "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/import",
        'generate-questions': "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/gerar-questoes"
      };

      const targetUrl = n8nEndpoints[endpoint] || `https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/${endpoint}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        // @ts-ignore
        agent: httpsAgent
      });
      res.json(await response.json().catch(() => ({ status: "ok" })));
    } catch (error: any) {
      console.error(`[n8n ${req.params.endpoint}] Error:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pedagogical Engine Proxy
  app.post("/api/engine/proxy", async (req, res) => {
    try {
      const { functionName, data } = req.body;
      console.log(`[Pedagogical Engine] Call: ${functionName}`, data);
      
      // Basic simulation/mock for the engine functions since they are handled locally now
      // but the frontend still expects an API response.
      if (functionName === 'runStudentEvaluation') {
        const { studentId, classId } = data;
        // In a real app, this would trigger a more complex logic or cloud function
        return res.json({ result: { status: 'success', studentId, classId, evaluatedAt: new Date().toISOString() } });
      }

      if (functionName === 'runPedagogicalEngineForClass') {
        const { classId } = data;
        return res.json({ result: { status: 'success', classId, evaluationsCount: 1, batchProcessed: true } });
      }

      res.status(400).json({ error: `Function ${functionName} not implemented in proxy.` });
    } catch (error: any) {
      console.error("[Pedagogical Engine Proxy] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Redirection and static files
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && req.path.length > 5 && req.path.endsWith('/')) {
      res.redirect(307, req.path.slice(0, -1) + req.url.slice(req.path.length));
    } else {
      next();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
