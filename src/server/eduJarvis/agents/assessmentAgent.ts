import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function assessmentAgent(command: string, userId: string, context?: object) {
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis, especialista em avaliação educacional no padrão SAEP.
Sua tarefa é gerar um simulado de alta qualidade.
Requisitos:
- 40 questões objetivas (ou a quantidade solicitada no comando).
- 4 alternativas por questão (A, B, C, D).
- Apenas uma correta.
- Gabarito comentado pedagógico.
- Competência relacionada e Nível da Taxonomia de Bloom.
- Dificuldade: fácil, média ou difícil.
- Questões contextualizadas e com distratores plausíveis.
- Formato de saída: Texto estruturado ou JSON (se solicitado).

Retorne o conteúdo completo do simulado.
`;

  const userPrompt = `
Solicitação de Simulado: ${command}
Usuário solicitante: ${userId}
Contexto: ${context ? JSON.stringify(context) : 'Nenhum'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  // Save to Firestore as "rascunho"
  const docRef = await db.collection('simulados').add({
    titulo: `Simulado EduJarvis - ${new Date().toLocaleDateString()}`,
    criadoPor: userId,
    conteudo: aiResponse.text,
    quantidadeQuestoes: 40,
    status: 'rascunho',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: 'GERAR_SIMULADO' as any,
    generatedId: docRef.id
  };
}
