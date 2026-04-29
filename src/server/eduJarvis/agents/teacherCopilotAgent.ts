import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function teacherCopilotAgent(command: string, userId: string, tipo: string, context?: any) {
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis, o copiloto pedagógico definitivo do professor.
Sua missão é gerar materiais educacionais de altíssima qualidade (Estudos de Caso, Aulas Invertidas, Planos de Aula).
Tipo de Material solicitado: ${tipo}.

O conteúdo deve ser completo, estruturado e conter:
- Título atraente.
- Objetivos de aprendizagem (Gerais e Específicos).
- Contextualização rica.
- Desenvolvimento passo-a-passo da atividade.
- Instruções claras para o professor e para os alunos.
- Critérios de avaliação e rubricas.
- Dicas de engajamento.

Use linguagem adequada ao ensino técnico/profissionalizante e BNCC/SAEP quando aplicável.
`;

  const userPrompt = `
Pedido do Professor: ${command}
Contexto: ${context ? JSON.stringify(context) : 'Geral'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  // Map type to collection
  const collectionMap: Record<string, string> = {
    'ESTUDO_CASO': 'estudos_caso',
    'AULA_INVERTIDA': 'aulas_invertidas',
    'PLANO_AULA': 'planos_aula'
  };

  const collectionName = collectionMap[tipo] || 'materiais_jarvis';
  
  const docRef = await db.collection(collectionName).add({
    titulo: `Material Jarivs - ${tipo} - ${new Date().toLocaleDateString()}`,
    criadoPor: userId,
    conteudo: aiResponse.text,
    tipo,
    status: 'rascunho',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: `GERAR_${tipo}` as any,
    generatedId: docRef.id
  };
}
