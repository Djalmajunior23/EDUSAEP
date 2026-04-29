import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function learningPathAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis, especialista em Design Instrucional e Trilhas Inteligentes de Aprendizagem.
Sua missão é gerar uma trilha personalizada para o aluno.
A trilha deve conter:
- Competência fragilizada.
- Conteúdo prioritário.
- Atividade recomendada.
- Tempo estimado.
- Nível de dificuldade.
- Critério de conclusão.
Formatado em Markdown com uma estrutura clara de passos.
`;

  const userPrompt = `
Pedido: ${command}
Contexto do Aluno: ${context ? JSON.stringify(context) : 'Histórico geral'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  const docRef = await db.collection('trilhas_aprendizagem').add({
    alunoId: userId,
    titulo: `Trilha Gerada - ${new Date().toLocaleDateString()}`,
    conteudo: aiResponse.text,
    status: 'ativa',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: 'GERAR_TRILHA_APRENDIZAGEM' as any,
    generatedId: docRef.id
  };
}
