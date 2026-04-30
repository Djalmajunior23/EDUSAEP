import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import https from "https";
import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';
import { processCommand as processEduJarvisCommand } from "./src/server/eduJarvis/processCommand";

import fs from "fs";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin with Application Default Credentials
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || config.projectId;
const databaseId = process.env.FIRESTORE_DATABASE_ID || config.firestoreDatabaseId;

if (!admin.apps.length) {
  console.log("[Firestore Debug] Initializing admin SDK", {
    projectId,
    databaseId,
    hasCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  });
  
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
}

const db = databaseId && databaseId !== '(default)' 
  ? getFirestore(databaseId) 
  : getFirestore();

// Override admin.firestore so backend agents get the correct database implicitly
const originalFirestore = admin.firestore;
(admin as any).firestore = function() {
  return db;
};
Object.assign((admin as any).firestore, originalFirestore);

// Note: For newer firebase-admin versions, the above might need adjustment. 
// Standard way for admin.firestore(app).databaseId depends on version.
// Using admin.firestore() is safest for default.

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
    responseSchema?: any;
    task: string;
    userId: string;
    userRole: string;
    model?: string;
  }) => {
    const { prompt, systemInstruction, responseFormat, responseSchema, task, userId, userRole, model: requestedModel } = params;
    const startTime = Date.now();

    // Model mapping for legacy or inconsistent strings
    const mapGeminiModel = (m: string | undefined): string => {
      const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      console.log(`[AI Request] Using model: ${m || PRIMARY_MODEL}`);
      if (!m) return PRIMARY_MODEL;
      
      const lowerM = m.toLowerCase();
      const cleanM = lowerM.replace('models/', '');
      
      const deprecatedModels = [
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash-latest"
      ];

      if (deprecatedModels.some(dm => cleanM.includes(dm))) {
        console.warn("[AI Request] Deprecated model detected. Migrating to current model.", {
          from: cleanM,
          to: PRIMARY_MODEL
        });
        return PRIMARY_MODEL;
      }
      
      if (cleanM.includes('gpt-4o')) return 'gpt-4o-mini';
      return cleanM;
    };

    const normalizeAIError = (error: any): string => {
      const message = error?.message || String(error);
      if (message.includes('5 NOT_FOUND') || message.includes('404')) {
        return 'Modelo ou recurso de IA não encontrado. Use modelos atuais como gemini-2.0-flash.';
      }
      if (message.includes('429') || message.includes('QUOTA_EXCEEDED')) {
        return 'Limite de uso da IA atingido.';
      }
      if (message.toLowerCase().includes('api key')) {
        return 'Chave de API inválida ou ausente.';
      }
      return 'Falha ao gerar conteúdo com IA.';
    };

    const finalRequestedModel = mapGeminiModel(requestedModel);

    try {
      const enableAI = process.env.ENABLE_AI !== 'false';
      if (!enableAI) {
        console.warn('[AI Service] AI is disabled');
        return { text: "", provider: 'none', model: 'none', fallback: true, error: 'IA desativada' };
      }

      const providersSnapshot = await db.collection('aiProviders')
        .where('enabled', '==', true)
        .orderBy('priority', 'asc')
        .get();
      
      let providers = providersSnapshot.docs.map(doc => doc.data());
      providers = providers.filter(p => !p.supportedTasks || p.supportedTasks.includes(task));
      providers = providers.filter(p => !p.allowedRoles || p.allowedRoles.includes(userRole));

      if (providers.length === 0) {
        providers = [
          { providerKey: 'gemini', defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash', priority: 1 },
          { providerKey: 'openai', defaultModel: 'gpt-4o-mini', priority: 2 }
        ];
      }

      let lastError = null;
      for (const provider of providers) {
        let resultText = "";
        let usedModel = finalRequestedModel || provider.defaultModel;
        try {
          console.log(`[AI Request] Attempting with provider: ${provider.providerKey}, model: ${usedModel}`);
          
          if (provider.providerKey === 'gemini' && gemini) {
            // Modern variations list
            const modelVariations = [
              usedModel, 
              `models/${usedModel}`, 
              'gemini-2.0-flash',
              'models/gemini-2.0-flash',
              'gemini-2.0-flash-lite',
              'models/gemini-2.0-flash-lite'
            ];
            let geminiError = null;
            
            for (const variant of modelVariations) {
              if (!variant) continue;
              try {
                console.log(`[Gemini] Testing variant: ${variant}`);
                
                try {
                  const modelConfig: any = { 
                    model: variant,
                    ...(systemInstruction ? { systemInstruction } : {})
                  };
                  
                  const generationConfig: any = {
                    responseMimeType: responseFormat === 'json' ? 'application/json' : 'text/plain',
                    ...(responseSchema ? { responseSchema } : {})
                  };

                  const modelObj = gemini.getGenerativeModel(modelConfig);
                  const result = await modelObj.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig
                  });
                  resultText = result.response.text();
                  if (resultText) {
                    usedModel = variant;
                    break;
                  }
                } catch (innerErr: any) {
                  const errStr = innerErr.message || "";
                  if (errStr.includes('NOT_FOUND') || errStr.includes('systemInstruction')) {
                    console.log(`[Gemini] Fallback for ${variant}: no system instruction`);
                    const modelObj = gemini.getGenerativeModel({ model: variant });
                    const combinedPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
                    const result = await modelObj.generateContent(combinedPrompt);
                    resultText = result.response.text();
                    if (resultText) {
                      usedModel = variant;
                      break;
                    }
                  } else {
                    throw innerErr;
                  }
                }
              } catch (vErr: any) {
                console.warn(`[Gemini Variant Error] ${variant}:`, vErr.message);
                geminiError = vErr;
              }
            }
            if (!resultText && geminiError) throw geminiError;
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
          console.error(`[AI Provider Error] ${provider.providerKey} (${usedModel}):`, err.message || err);
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

  // Security Middleware for Prompt Validation
  const promptInjectionGuard = (req: any, res: any, next: any) => {
    const prompt = req.body.prompt || req.body.command || "";
    const suspiciousPatterns = [/ignore all previous instructions/i, /developer mode/i, /system prompt/i, /bypassing/i, /forget your instructions/i];
    if (suspiciousPatterns.some(pattern => pattern.test(prompt))) {
      console.warn(`[Security Alert] Prompt injection attempt detected from user ${req.body.userId || 'anonymous'}`);
      return res.status(403).json({ error: "Rejeitado: Padrão suspeito detectado (Prompt Injection Guard)." });
    }
    // Block excessively long prompts
    if (prompt.length > 30000) {
      return res.status(413).json({ error: "Rejeitado: Prompt excede o limite máximo permitido." });
    }
    next();
  };

  // API Routes
  app.post("/api/edu-jarvis/process", promptInjectionGuard, async (req, res) => {
    try {
      const result = await processEduJarvisCommand(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("[EduJarvis API Error]:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/completions", promptInjectionGuard, async (req, res) => {
    try {
      const { prompt, systemInstruction, responseFormat, responseSchema, task, userId, userRole, model } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });
      const result = await executeAIRequest({
        prompt, systemInstruction, responseFormat, responseSchema, task: task || "generic", userId: userId || "anonymous", userRole: userRole || "GUEST", model
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
        body: JSON.stringify(req.body)
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
        body: JSON.stringify(data)
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
        body: JSON.stringify(req.body)
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
