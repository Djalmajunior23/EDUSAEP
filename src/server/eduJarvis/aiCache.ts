import crypto from "crypto";
import { db } from "../firebaseAdmin";

export function generatePromptHash(payload: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function getAICache(hash: string) {
  const doc = await db.collection("aiCache").doc(hash).get();

  if (!doc.exists) return null;

  const data = doc.data();

  if (!data?.expiresAt) return data?.response;

  const expiresAt = data.expiresAt.toDate
    ? data.expiresAt.toDate()
    : new Date(data.expiresAt);

  if (expiresAt < new Date()) return null;

  return data.response;
}

export async function saveAICache(params: {
  hash: string;
  response: any;
  feature: string;
  ttlHours?: number;
}) {
  const ttl = params.ttlHours ?? 24;
  const expiresAt = new Date(Date.now() + ttl * 60 * 60 * 1000);

  await db.collection("aiCache").doc(params.hash).set({
    response: params.response,
    feature: params.feature,
    createdAt: new Date(),
    expiresAt
  });
}
