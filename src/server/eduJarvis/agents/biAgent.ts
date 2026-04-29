import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function biAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis BI Agent, especialista em Analytics Educacional.
Sua missão é transformar dados operacionais em insights estratégicos (estilo Power BI).
Ao ser solicitado para analisar a turma ou desempenho, você deve sugerir visualizações.
Você tem acesso (via contexto) a métricas de simulados, engajamento e histórico.
Sua resposta deve ser um relatório executivo com:
1. Sumário de Indicadores (KPIs).
2. Tendência de Aprendizado (ML/DL insights).
3. Clusterização de Alunos (Nível de Risco).
4. Próxima Melhor Ação (Recomendação).
`;

  const userPrompt = `
Comando BI: ${command}
Contexto de BI: ${JSON.stringify(context || {})}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  const docRef = await db.collection('jarvis_bi_reports').add({
    solicitanteId: userId,
    report: aiResponse.text,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: 'GERAR_BI_INSIGHTS' as any,
    generatedId: docRef.id
  };
}
