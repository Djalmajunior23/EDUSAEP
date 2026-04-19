import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export type LoadStatus = 'normal' | 'overloaded' | 'struggling' | 'rushing';

export async function getActionableAdvice(status: LoadStatus, studentName: string): Promise<string> {
  const prompt = `O aluno ${studentName} está com status '${status}'. 
  Sugira uma ação pedagógica curta e direta para o professor (max 15 palavras) para intervir positivamente agora.`;
  
  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return result.text || "";
}

export async function assessCognitiveState(studentId: string, classId: string, activityData: { timeTaken: number, isCorrect: boolean, difficulty: string }) {
  // A lógica simplificada de análise em tempo real
  const { timeTaken, isCorrect } = activityData;
  
  let status: LoadStatus = 'normal';
  let message = "Ritmo adequado.";

  // Exemplo de regra heurística:
  // Se muito rápido e errando: 'rushing' (chutando)
  // Se muito lento e errando: 'struggling' (dificuldade)
  // Se muito lento e acertando: 'overloaded' (esforço cognitivo alto)
  
  if (!isCorrect && timeTaken < 30) {
    status = 'rushing';
    message = "Aluno respondendo rápido demais (possível chute).";
  } else if (!isCorrect && timeTaken > 150) {
    status = 'struggling';
    message = "Aluno com dificuldade elevada para processar o conteúdo.";
  } else if (isCorrect && timeTaken > 200) {
    status = 'overloaded';
    message = "Ritmo lento. Alta carga cognitiva para resolver.";
  }

  // Persistir o alerta/checagem
  await addDoc(collection(db, "cognitiveLoadChecks"), {
    studentId,
    classId,
    status,
    message,
    timestamp: serverTimestamp()
  });

  return { status, message };
}
