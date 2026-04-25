import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorService';
import { n8nEvents } from './n8nService';
import { generateSmartContent } from './geminiService';

export interface Recommendation {
  id?: string;
  userId: string;
  diagnostico: string;
  planoEstudo: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  competenciasCriticas: string[];
  acoesSugeridas: string[];
  atividadesPraticas?: {
    titulo: string;
    descricao: string;
    tipo: 'video' | 'exercicio' | 'leitura' | 'pratica';
    tempo: string;
  }[];
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
    const errosCognitivos: string[] = []; // Collect error categories if available from question feedback
    
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
      
      // Attempt to find cognitive errors if we store them in the future
      if (sub.answers) {
         Object.values(sub.answers).forEach((ans: any) => {
             if (ans && ans.analise_erro && ans.analise_erro.categoria) {
                 errosCognitivos.push(ans.analise_erro.categoria);
             }
         });
      }
    });

    // 3. Identify critical competencies (accuracy < 60%)
    const criticalCompetencies = Object.entries(competencyStats)
      .filter(([_, stats]) => (stats.correct / stats.total) < 0.6)
      .map(([comp]) => comp);

    // 4. Generate AI Recommendations for specific practical activities
    let atividadesPraticas = [];
    
    try {
      const aiResponse = await generateSmartContent({
        tipo: 'plano_estudo',
        perfil: 'aluno',
        disciplina: 'Geral',
        competencias: criticalCompetencies.length > 0 ? criticalCompetencies : ['Aprofundamento Geral'],
        nivel: criticalCompetencies.length > 0 ? 'medio' : 'dificil',
        prompt: `Com base nas dificuldades do aluno, sugira exatamente 3 atividades práticas curtas ou materiais de estudo focados em superar as dificuldades nessas áreas: ${criticalCompetencies.join(', ')}. Se houver histórico de erros cognitivos como falta de atenção ou interpretação, foque nisso. Retorne UM JSON com um array 'atividades' com objetos contendo: 'titulo' (string), 'descricao' (string detalhada), 'tipo' (um dos seguintes textos literais: 'video', 'exercicio', 'leitura', ou 'pratica') e 'tempo' (string, ex: '15 min').`
      });

      if (aiResponse && aiResponse.atividades) {
          atividadesPraticas = aiResponse.atividades;
      }
    } catch (aiErr) {
      console.warn("Notice: Failed to fetch AI practical activities, providing fallbacks", aiErr);
      if (criticalCompetencies.length > 0) {
        atividadesPraticas = criticalCompetencies.slice(0,3).map(comp => ({
          titulo: `Prática Focada em ${comp}`,
          descricao: `Revise os fundamentos e faça 5 exercícios focados.`,
          tipo: 'exercicio' as const,
          tempo: '20 min'
        }));
      } else {
         atividadesPraticas = [{
          titulo: `Desafio Avançado`,
          descricao: `Responda a perguntas de nível difícil sobre o conteúdo.`,
          tipo: 'pratica' as const,
          tempo: '30 min'
        }];
      }
    }

    let diagnostico = '';
    let planoEstudo = '';
    let prioridade: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
    const acoesSugeridas: string[] = [];

    if (criticalCompetencies.length > 0) {
      prioridade = criticalCompetencies.length > 2 ? 'Alta' : 'Média';
      diagnostico = `Identificamos uma oportunidade de melhoria significativa em ${criticalCompetencies.join(', ')}. O padrão de respostas mostra que focar na base teórica dessas áreas trará resultados rápidos.`;
      planoEstudo = `Sugerimos uma imersão direcionada nos tópicos críticos identificados, combinando micro-leituras com exercícios práticos de fixação.`;
      
      criticalCompetencies.slice(0,2).forEach(comp => {
        acoesSugeridas.push(`Revisar mapa mental ou resumo da base teórica de ${comp}`);
      });
      acoesSugeridas.push(`Refazer as questões que você marcou incorretamente na última semana.`);
    } else {
      diagnostico = `A análise cognitiva mostra um desempenho excelente e consistente generalizado em todas as competências avaliadas nos últimos simulados.`;
      planoEstudo = `O foco agora é manter a proficiência (manutenção) e iniciar baterias de questões de alta complexidade e casos integrados.`;
      acoesSugeridas.push('Ativar modo "Desafio" e focar em Simulados de nível Avançado');
      acoesSugeridas.push('Resolver estudos de caso transdisciplinares');
    }

    // 5. Save recommendation to Firestore
    const recommendation: Recommendation = {
      userId,
      diagnostico,
      planoEstudo,
      prioridade,
      competenciasCriticas: criticalCompetencies,
      acoesSugeridas,
      atividadesPraticas,
      dataGeracao: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'recomendacoes_pedagogicas'), recommendation);
    
    // Trigger n8n automation
    try {
      await n8nEvents.pedagogicalRecommendation({
        userId,
        recommendation: { id: docRef.id, ...recommendation }
      });
    } catch(e) {}

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
