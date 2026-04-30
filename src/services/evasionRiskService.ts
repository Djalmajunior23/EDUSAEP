import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EduJarvis } from './eduJarvisService';

export async function calculateEvasionRisk(studentId: string) {
  // 1. Coletar dados
  const [gradesSnap, activitiesSnap, forumsSnap] = await Promise.all([
    getDocs(query(collection(db, 'resultados'), where('studentId', '==', studentId))),
    getDocs(query(collection(db, 'atividadesSubmissoes'), where('studentId', '==', studentId))),
    getDocs(query(collection(db, 'forumComentarios'), where('userId', '==', studentId)))
  ]);

  const data = {
    studentId,
    grades: gradesSnap.docs.map(d => d.data()),
    activities: activitiesSnap.docs.map(d => d.data()),
    forumCount: forumsSnap.size,
    lastAccess: new Date().toISOString()
  };

  // 2. Usar EduJarvis para processar o risco via backend
  try {
    const result = await EduJarvis.execute(`/analisar-risco-evasao do aluno ${studentId}`, { 
      context: data 
    });
    
    if (result.data) return result.data;
    
    // Fallback se não retornou objeto estruturado
    return JSON.parse(result.response);
  } catch (error) {
    console.error("[EvasionRisk] Fallback calculation due to error:", error);
    return { score: 50, justification: "Calculado via fallback devido a indisponibilidade do motor de IA." };
  }
}
