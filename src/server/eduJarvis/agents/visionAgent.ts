import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function visionAgent(command: string, userId: string, image: string, context?: any) {
  const db = admin.firestore();
  
  const systemPrompt = `
Você é o EduJarvis Vision Engine (AI Computer Vision). 
Sua tarefa é analisar imagens de provas, exercícios ou anotações enviadas por alunos e professores.
- Realize OCR (Reconhecimento Óptico de Caracteres) de alta fidelidade.
- Se for uma prova/simulado: Identifique a questão, as alternativas e a resposta marcada pelo aluno.
- Realize a Correção Automática cruzando com o gabarito implícito ou explícito.
- Analise a caligrafia em busca de padrões de esforço ou dificuldade motora (Insights de DL).
- Retorne um Diagnóstico Pedagógico Visual.
Retorne sua análise em Markdown estruturado, incluindo uma tabela de OCR.
`;

  const userPrompt = command || "Por favor, analise esta imagem educacional e extraia as informações principais.";

  const aiResponse = await callAI({ 
    systemPrompt, 
    userPrompt,
    image 
  });

  const docRef = await db.collection('jarvis_vision_logs').add({
    usuarioId: userId,
    analise: aiResponse.text,
    modelUsed: aiResponse.metadata?.model,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: aiResponse.text,
    actionType: 'CORRECAO_VISAO' as any,
    generatedId: docRef.id
  };
}
