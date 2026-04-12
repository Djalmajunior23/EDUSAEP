import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorService';
import { n8nEvents } from './n8nService';

export interface Recommendation {
  id?: string;
  userId: string;
  diagnostico: string;
  planoEstudo: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  competenciasCriticas: string[];
  acoesSugeridas: string[];
  dataGeracao: any;
}

export const generateStudentRecommendation = async (userId: string, studentName: string) => {
  try {
    // 1. Fetch recent submissions for the student
    const submissionsRef = collection(db, 'exam_submissions');
    const q = query(
      submissionsRef, 
      where('studentId', '==', userId), 
      orderBy('completedAt', 'desc'),
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const submissions = querySnapshot.docs.map(doc => doc.data());
    
    // 2. Aggregate performance by competency
    const competencyStats: Record<string, { correct: number, total: number }> = {};
    
    submissions.forEach((sub: any) => {
      if (sub.competencyResults) {
        Object.entries(sub.competencyResults).forEach(([comp, result]: [string, any]) => {
          if (!competencyStats[comp]) {
            competencyStats[comp] = { correct: 0, total: 0 };
          }
          competencyStats[comp].correct += result.correct || 0;
          competencyStats[comp].total += result.total || 0;
        });
      }
    });

    // 3. Identify critical competencies (accuracy < 60%)
    const criticalCompetencies = Object.entries(competencyStats)
      .filter(([_, stats]) => (stats.correct / stats.total) < 0.6)
      .map(([comp]) => comp);

    // 4. Generate recommendation logic (simplified for now, could call AI)
    let diagnostico = '';
    let planoEstudo = '';
    let prioridade: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
    const acoesSugeridas: string[] = [];

    if (criticalCompetencies.length > 0) {
      prioridade = criticalCompetencies.length > 2 ? 'Alta' : 'Média';
      diagnostico = `O aluno apresenta dificuldades significativas em ${criticalCompetencies.join(', ')}.`;
      planoEstudo = `Focar na revisão teórica e exercícios práticos de nível básico para as competências críticas identificadas.`;
      
      criticalCompetencies.forEach(comp => {
        acoesSugeridas.push(`Revisar material de apoio de ${comp}`);
        acoesSugeridas.push(`Realizar simulado específico de ${comp}`);
      });
    } else {
      diagnostico = `O aluno apresenta bom desempenho geral, com consistência nas competências avaliadas.`;
      planoEstudo = `Manter o ritmo de estudos e iniciar desafios de nível avançado para aprofundamento.`;
      acoesSugeridas.push('Realizar simulados de nível difícil');
      acoesSugeridas.push('Participar de monitorias como tutor');
    }

    // 5. Save recommendation to Firestore
    const recommendation: Recommendation = {
      userId,
      diagnostico,
      planoEstudo,
      prioridade,
      competenciasCriticas: criticalCompetencies,
      acoesSugeridas,
      dataGeracao: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'recomendacoes_pedagogicas'), recommendation);
    
    // Trigger n8n automation
    await n8nEvents.pedagogicalRecommendation({
      userId,
      recommendation: { id: docRef.id, ...recommendation }
    });

    return { id: docRef.id, ...recommendation };

  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'recomendacoes_pedagogicas');
    throw err;
  }
};

export const getLatestRecommendation = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'recomendacoes_pedagogicas'),
      where('userId', '==', userId),
      orderBy('dataGeracao', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Recommendation;
  } catch (err) {
    console.error("Error fetching recommendation:", err);
    return null;
  }
};
