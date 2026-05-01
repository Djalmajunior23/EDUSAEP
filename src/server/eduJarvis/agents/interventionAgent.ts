import { callAI } from '../aiProvider';
import admin from 'firebase-admin';
import { EduJarvisRequest } from '../../../types/eduJarvisTypes';

export async function interventionAgent(request: EduJarvisRequest) {
  const { command = "", userId, context } = request;
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis, especialista em Intervenção Pedagógica e Recuperação de Aprendizagem.
Sugira ações imediatas para o professor com base no diagnóstico apresentado.
Sua resposta deve conter:
1. Diagnóstico da situação.
2. Possível causa raiz consultando dados pedagógicos.
3. Estratégia de reforço (ex: micro-learning, tutoria por pares).
4. Atividade prática recomendada.
5. Avaliação rápida para verificar eficácia.
6. Plano de recuperação resumido.
`;

  const userPrompt = `
Comando: ${command}
Dados contextuais: ${context ? JSON.stringify(context) : 'Dados de turma'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  const docRef = await db.collection('intervencoes_pedagogicas').add({
    professorId: userId,
    titulo: `Intervenção Sugerida - ${new Date().toLocaleDateString()}`,
    conteudo: aiResponse.text,
    status: 'sugerida',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: 'SUGERIR_INTERVENCAO' as any,
    generatedId: docRef.id
  };
}
