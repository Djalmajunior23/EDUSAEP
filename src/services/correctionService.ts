import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = ai.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

export interface CorrectionResult {
  score: number;
  maxScore: number;
  feedback: string; // Geral sobre toda a prova
  questionFeedback: {
    questionIndex: number;
    points: number;
    comment: string;
  }[];
}

export async function assistCorrection(assessmentId: string, studentId: string, studentAnswers: any[]) {
  // 1. Fetch assessment and student submission
  const assessmentSnap = await getDoc(doc(db, "assessments", assessmentId));
  const assessment = assessmentSnap.data();

  if (!assessment) throw new Error("Prova não encontrada");

  // 2. Prepare Prompt
  const prompt = `Você é um professor experiente e está realizando a correção assistida de uma prova.
  
  Prova: ${assessment.title}
  Rubrica de Correção: ${assessment.rubric}
  Questões: ${JSON.stringify(assessment.questions)}
  Respostas do Aluno: ${JSON.stringify(studentAnswers)}

  Regras:
  1. Avalie as questões discursivas baseada na rubrica.
  2. Valide as questões objetivas.
  3. Forneça uma pontuação total e feedback personalizado para o aluno.
  
  Retorne um JSON estritamente no formato:
  {
    "score": number,
    "maxScore": number,
    "feedback": "...",
    "questionFeedback": [
      {
        "questionIndex": number,
        "points": number,
        "comment": "..."
      }
    ]
  }`;

  const result = await model.generateContent(prompt);
  const jsonString = result.response.text().replace(/```json|```/g, '').trim();
  const correction: CorrectionResult = JSON.parse(jsonString);

  // 3. Save Correction to Firestore
  await addDoc(collection(db, "assessments", assessmentId, "corrections"), {
    studentId,
    ...correction,
    createdAt: serverTimestamp()
  });

export async function batchAssistCorrection(assessmentId: string, submissionsData: { studentId: string, answers: any[] }[]) {
  const results = await Promise.all(
    submissionsData.map(async (sub) => {
      try {
        const correction = await assistCorrection(assessmentId, sub.studentId, sub.answers);
        return { studentId: sub.studentId, correction, success: true };
      } catch (e) {
        return { studentId: sub.studentId, error: e, success: false };
      }
    })
  );
  return results;
}

