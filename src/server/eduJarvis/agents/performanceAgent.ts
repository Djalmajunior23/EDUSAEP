import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function performanceAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  let performanceData = {
    student: null as any,
    class: null as any
  };

  // 1. Buscar dados do aluno
  if (context?.studentId) {
    const studentSnap = await db.collection('desempenho_aluno')
      .where('alunoId', '==', context.studentId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    if (!studentSnap.empty) {
      performanceData.student = studentSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    }
  }

  // 2. Buscar dados da turma para curva de aprendizado
  if (context?.turmaId) {
    const classSnap = await db.collection('desempenho_turma_agregado')
      .doc(context.turmaId)
      .get();
      
    if (classSnap.exists) {
      performanceData.class = classSnap.data();
    }
  } else if (!context?.studentId) {
    // Busca dados gerais para análise global da turma
    const allResultsSnap = await db.collection('resultados')
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get();
    
    if (!allResultsSnap.empty) {
      performanceData.class = allResultsSnap.docs.map(d => d.data());
    }
  }

  const isClassAnalysis = !context?.studentId && (context?.turmaId || command.toLowerCase().includes('class') || command.toLowerCase().includes('turma'));

  const systemPrompt = `
Você é o EduJarvis Advanced Performance Engine.
Sua missão é realizar uma análise profunda do progresso ${isClassAnalysis ? 'da turma como um todo' : 'do aluno em relação à curva de aprendizado da turma'}, abrangendo todas as competências avaliadas.

Identifique:
${isClassAnalysis ? 
`- As principais tendências de aprendizado da turma.
- Pontos fortes e áreas de melhoria (gargalos) em todas as competências.
- Alunos em risco ou fatores qualitativos de engajamento da turma.
- Recomendações pedagógicas para o professor aplicar.` 
: 
`- Se o aluno está ficando para trás ou avançando muito rápido em relação à média da turma.
- O nível de risco de evasão ou baixo desempenho.
- Fatores qualitativos que justificam o desempenho (ex: engajamento, tempo de resposta, padrões de erro).
- Recomendações pedagógicas personalizadas.`}

VOCÊ DEVE RETORNAR APENAS UM JSON VÁLIDO com a seguinte estrutura:
{
  ${!isClassAnalysis ? `"studentId": "id_do_aluno",` : `"turmaId": "id_da_turma",`}
  "predictedPerformance": 0-100,
  "riskLevel": "Baixo" | "Médio" | "Alto",
  "factors": ["string"],
  "recommendations": ["string"],
  "comparativoTurma": {
    "mediaTurma": "number",
    "posicaoRelativa": "Abaixo" | "Na Média" | "Acima"
  }
}

Analise os dados fornecidos com rigor estatístico-pedagógico.
`;

  const userPrompt = `
ID do Aluno para Análise: ${context?.studentId || 'Não especificado'}
Comando do Usuário: ${command}
Dados Históricos do Aluno: ${JSON.stringify(performanceData.student)}
Dados de Referência da Turma: ${JSON.stringify(performanceData.class)}
`;

  const aiResponse = await callAI({ 
    systemPrompt, 
    userPrompt, 
    model: "gemini-1.5-flash",
    responseFormat: "json" 
  });

  // Salvar análise no Firestore para histórico e BI
  if (context?.studentId) {
    await db.collection('analises_performance').add({
      alunoId: context.studentId,
      turmaId: context.turmaId || 'geral',
      resumo: aiResponse.text,
      tipo: 'CURVA_APRENDIZADO',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return {
    response: aiResponse.text,
    actionType: 'ANALISAR_DESEMPENHO' as any
  };
}
