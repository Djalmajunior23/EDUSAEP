import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import https from "https";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

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

  // Initialize APIs
  const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const deepseek = process.env.DEEPSEEK_API_KEY ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' }) : null;
  const groq = process.env.GROQ_API_KEY ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) : null;

  // API routes go here
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Endpoint for question generation
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

  // n8n Workflow Endpoints
  app.post("/api/n8n/alerts", async (req, res) => {
    try {
      const result = await forwardToN8N(req.body, 'alert');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/plans", async (req, res) => {
    try {
      const result = await forwardToN8N(req.body, 'plan');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to simulate AI Webhook to n8n
  app.post("/api/n8n/ai-webhook-simulate", async (req, res) => {
    try {
      // Use the environment variable or a default test URL
      const n8nUrl = process.env.N8N_AI_WEBHOOK_URL || "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/ai-simulation";
      
      console.log(`[n8n Simulation] Sending payload to ${n8nUrl}`);
      
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "ai_generation_request",
          prompt: req.body.prompt || "Gere um plano de aula sobre fotossíntese",
          model: req.body.model || "gemini-3-flash-preview",
          userRole: req.body.userRole || "professor",
          timestamp: new Date().toISOString()
        }),
        // @ts-ignore
        agent: n8nUrl.startsWith('https') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({ status: "ok", message: "No JSON returned from n8n" }));
      res.json({ success: true, n8nResponse: result });
    } catch (error: any) {
      console.error("[n8n Simulation Error]:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Chatbot Endpoint
  app.post("/api/n8n/chatbot", async (req, res) => {
    try {
      const n8nUrl = process.env.N8N_CHATBOT_WEBHOOK_URL || "https://n8n-dqqj.srv1299532.hstgr.cloud/webhook-test/student-chatbot";
      
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: req.body.studentId,
          message: req.body.message,
          context: req.body.context || {},
          timestamp: new Date().toISOString()
        }),
        // @ts-ignore
        agent: n8nUrl.startsWith('https') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}`);
      }

      const result = await response.json().catch(() => ({ reply: "Desculpe, não consegui processar a resposta no momento." }));
      res.json(result);
    } catch (error: any) {
      console.error("[Chatbot Error]:", error);
      res.status(500).json({ error: error.message, reply: "Erro ao conectar com o assistente virtual." });
    }
  });

  app.post("/api/n8n/import", upload.single('file'), async (req, res) => {
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (!n8nUrl) {
        return res.status(500).json({ error: "N8N_WEBHOOK_URL not configured" });
      }

      const formData = new FormData();
      if (req.file) {
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, req.file.originalname);
      }
      
      // Add other body fields
      Object.keys(req.body).forEach(key => {
        formData.append(key, req.body[key]);
      });
      formData.append('workflow_type', 'import');
      formData.append('server_timestamp', new Date().toISOString());

      const response = await fetch(n8nUrl, {
        method: 'POST',
        body: formData,
        // @ts-ignore
        agent: n8nUrl.startsWith('https') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}`);
      }

      const result = await response.json().catch(() => ({ status: "ok" }));
      res.json(result);
    } catch (error: any) {
      console.error("[n8n] Import Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/forms", async (req, res) => {
    try {
      const result = await forwardToN8N(req.body, 'forms');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/n8n/test", async (req, res) => {
    const { url, data } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          workflow_type: 'test',
          server_timestamp: new Date().toISOString()
        }),
        // @ts-ignore
        agent: url.startsWith('https') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with ${response.status}`);
      }

      const result = await response.json().catch(() => ({ status: "ok" }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generic AI generation endpoint for OpenAI and DeepSeek
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseFormat, provider, model } = req.body;

      const messages = [
        ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
        { role: "user" as const, content: prompt }
      ];

      const tryGroq = async () => {
        if (!groq) throw new Error("Groq API key not configured");
        console.log("[AI] Using Groq fallback");
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
          temperature: 1.0,
        });
        return completion.choices[0].message.content;
      };

      if (provider === 'deepseek') {
        if (!deepseek) {
          return res.status(500).json({ error: "DeepSeek API key not configured" });
        }
        try {
          const completion = await deepseek.chat.completions.create({
            model: model || "deepseek-chat",
            messages,
            response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
            temperature: 1.0,
          });
          return res.json({ text: completion.choices[0].message.content });
        } catch (err: any) {
          if (err?.status === 402 || err?.status === 429) {
            console.warn(`[AI] DeepSeek quota exceeded, falling back to Groq`);
            const text = await tryGroq();
            return res.json({ text });
          }
          throw err;
        }
      }

      // Default to OpenAI
      if (!openai) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      try {
        const completion = await openai.chat.completions.create({
          model: model || "gpt-4o-mini",
          messages,
          response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
          temperature: 1.0,
        });
        return res.json({ text: completion.choices[0].message.content });
      } catch (err: any) {
        if (err?.status === 429 || err?.status === 404) {
          console.warn(`[AI] OpenAI error (${err?.status}), falling back to Groq`);
          const text = await tryGroq();
          return res.json({ text });
        }
        throw err;
      }

    } catch (error: any) {
      if (error?.status !== 429 && error?.status !== 402) {
        console.error("[AI Generation] Error:", error);
      }
      res.status(error?.status || 500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Webhook for external form responses (n8n integration)
  app.post("/api/webhooks/forms", async (req, res) => {
    const { simuladoId, responses } = req.body;
    const authHeader = req.headers.authorization;

    // Simple token validation
    if (!authHeader || authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`[WEBHOOK] Received ${responses.length} responses for simulado ${simuladoId}`);

    // In a real Cloud Function, we would trigger a background task here.
    // For this environment, we'll return success and assume the frontend or a separate process will sync.
    // However, we could also process them here if we had access to Firebase Admin.
    // Since we're using the client SDK in the frontend, we'll let the frontend trigger the sync.
    
    res.json({ status: "received", count: responses.length });
  });

  // Endpoint to trigger manual sync/import
  app.post("/api/simulados/sync", async (req, res) => {
    try {
      const result = await forwardToN8N(req.body, 'sync');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Error logging endpoint for the frontend
  app.post("/api/logs", (req, res) => {
    const { type, message, stack, userId } = req.body;
    console.error(`[FRONTEND_ERROR] ${type}: ${message}`, { stack, userId });
    res.status(204).send();
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
