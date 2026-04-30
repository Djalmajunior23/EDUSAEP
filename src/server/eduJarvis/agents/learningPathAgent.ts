import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function learningPathAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  let targetStudentId = context?.studentId || userId;
  let diagnosticData: any = null;

  try {
    // Buscar o último diagnóstico do aluno para identificar as dificuldades
    const diagSnapshot = await db.collection('diagnosticos')
      .where('alunoId', '==', targetStudentId)
      .orderBy('data', 'desc')
      .limit(1)
      .get();
      
    if (!diagSnapshot.empty) {
      diagnosticData = diagSnapshot.docs[0].data();
    } else {
      // Tentar buscar nos resultados de simulados
      const resultSnapshot = await db.collection('resultados')
        .where('studentId', '==', targetStudentId)
        .orderBy('submittedAt', 'desc')
        .limit(3)
        .get();
        
      if (!resultSnapshot.empty) {
        diagnosticData = resultSnapshot.docs.map(doc => doc.data());
      }
    }
  } catch (err) {
    console.warn("Could not fetch diagnostic data for learning path: ", err);
  }

  const systemPrompt = `
Você é o EduJarvis, especialista em Design Instrucional e Trilhas Inteligentes de Aprendizagem.
Sua missão é gerar um plano de estudos e uma trilha personalizada para o aluno com base em suas dificuldades reais.

Diretrizes:
- Use os dados de diagnóstico (se fornecidos) para identificar as "Competências Críticas" e focar a trilha nelas.
- Divida a trilha em Fase de Nivelamento (básico/recuperação), Fase de Consolidação e Fase de Excelência.
- Para cada tópico, forneça:
  * Objetivo claro.
  * Tópico de estudo recomendado.
  * Tipo de atividade (ex: vídeo, quiz, resumo).
  * Tempo estimado de estudo.
  * Critério de sucesso sugerido.
- Formate a resposta em Markdown estruturado, de forma encorajadora e clara.
- Seja objetivo e pedagógico.
`;

  const userPrompt = `
Pedido do usuário: ${command}
Contexto adicional: ${context ? JSON.stringify(context) : 'Nenhum'}
Dados de Dificuldades/Diagnóstico do Aluno: ${diagnosticData ? JSON.stringify(diagnosticData) : 'Não há histórico prévio suficiente. Crie uma trilha guiada generalista com base no pedido.'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt });

  const docRef = await db.collection('trilhas_aprendizagem').add({
    alunoId: targetStudentId,
    titulo: `Trilha de Ensino Personalizada - ${new Date().toLocaleDateString()}`,
    conteudo: aiResponse.text,
    status: 'ativa',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    baseadoEm: diagnosticData ? 'diagnostico' : 'pedido_direto'
  });

  return {
    response: aiResponse.text,
    actionType: 'GERAR_TRILHA_APRENDIZAGEM' as any,
    data: {
      generatedId: docRef.id,
      trilhaText: aiResponse.text
    }
  };
}
