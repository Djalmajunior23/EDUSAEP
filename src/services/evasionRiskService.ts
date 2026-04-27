import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { generateAIContent } from './aiService';

export async function calculateEvasionRisk(studentId: string) {
  // 1. Coletar dados
  const [gradesSnap, activitiesSnap, forumsSnap] = await Promise.all([
    getDocs(query(collection(db, 'resultados'), where('studentId', '==', studentId))),
    getDocs(query(collection(db, 'atividadesSubmissoes'), where('studentId', '==', studentId))),
    getDocs(query(collection(db, 'forumComentarios'), where('userId', '==', studentId)))
  ]);

  const data = {
    grades: gradesSnap.docs.map(d => d.data()),
    activities: activitiesSnap.docs.map(d => d.data()),
    forumCount: forumsSnap.size,
    lastAccess: new Date() // Placeholder
  };

  // 2. IA para calcular
  const prompt = `Analise os dados deste aluno e retorne um índice de risco de evasão (0-100) e uma justificativa:
  Dados: ${JSON.stringify(data)}
  Retorne um JSON: { "score": number, "justification": string }`;
  
  const result = await generateAIContent({
    prompt,
    model: "gemini-1.5-flash",
    task: "evasion-risk-analysis"
  });
  
  const json = JSON.parse(result.text);
  
  return json;
}
