import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Webhook for external form responses (n8n integration)
  app.post("/api/webhooks/forms", async (req, res) => {
    const { simuladoId, formId, responses, integrationToken } = req.body;
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
    const { formId, userId } = req.body;
    // This could call the syncFormResponses logic if we had a server-side Firebase Admin setup.
    // For now, we'll just acknowledge the request.
    res.json({ status: "sync_triggered", formId });
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
    app.get('*', (req, res) => {
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
