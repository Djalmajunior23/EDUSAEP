import { db } from "../firebaseAdmin";

export async function logAIUsage(params: {
  userId: string;
  agent: string;
  action: string;
  source: "local_rule" | "database" | "cache" | "ai";
  status: "success" | "error";
  costMode?: string;
  error?: string;
}) {
  await db.collection("aiLogs").add({
    ...params,
    createdAt: new Date()
  });
}
