import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface DiaryEntry {
  teacherId: string;
  classId: string;
  date: Date;
  observations: string;
  studentsToMonitor: string[]; // IDs
  insightSummary?: string;
}

export async function createDiaryEntry(entry: Omit<DiaryEntry, 'date'>) {
  // 1. IA sintetiza a observação para facilitar busca futura
  const prompt = `Analise a observação pedagógica: "${entry.observations}". 
  Identifique competências possivelmente afetadas e sugira uma atenção curta.
  Retorne um resumo de até 20 palavras.`;
  
  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  
  const summary = result.text || "";

  return await addDoc(collection(db, "pedagogicalDiaries"), {
    ...entry,
    insightSummary: summary,
    date: serverTimestamp()
  });
}

export async function getDiaryEntries(classId: string) {
  const q = query(collection(db, "pedagogicalDiaries"), where("classId", "==", classId), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
