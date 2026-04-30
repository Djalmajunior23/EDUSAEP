import { db } from "../firebaseAdmin";
import { callAI } from "../eduJarvis/aiProvider";
import * as admin from 'firebase-admin';

export async function generateTeacherInsights(classId: string) {
  const performanceSnap = await db.collection('studentPerformances').where('classId', '==', classId).get();
  const performances = performanceSnap.docs.map(doc => doc.data());
  
  const systemInstruction = `Você é um analista pedagógico (SENAI/SAEP). Analise os dados da turma e gere insights para o professor.`;
  
  const prompt = `Analise os dados da turma e gere insights: ${JSON.stringify(performances)}`;
  
  const result = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  const insights = JSON.parse(result.text);

  await db.collection('biReports').add({
      classId,
      insights,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return insights;
}
