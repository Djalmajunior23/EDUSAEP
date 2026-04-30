import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";
import { memoryAgent } from "./memoryAgent";
import admin from 'firebase-admin';

export async function tutorAgent(request: EduJarvisRequest) {
  const db = admin.firestore();
  
  // Enriquecimento de contexto se necessário
  let memorySummary = request.context?.memorySummary;
  if (!memorySummary && request.userId) {
    memorySummary = await memoryAgent.getMemorySummary(request.userId);
  }

  let studentProfile = request.context?.studentProfile;
  if (!studentProfile && request.userId) {
    const profileSnap = await db.collection('LearningDNA').where('userId', '==', request.userId).limit(1).get();
    if (!profileSnap.empty) {
      studentProfile = profileSnap.docs[0].data();
    }
  }

  const systemInstruction = `
Você é o Tutor IA Conversacional Ultra do EduAiCore.
Sua missão é atuar como um mentor pedagógico personalizado, capaz de lembrar o histórico do aluno, adaptar sua linguagem e identificar dificuldades em tempo real.

DIRETRIZES DE ATUAÇÃO:
1. PERSONALIDADE: Acolhedor, motivador, mas rigoroso pedagogicamente. Use o método Socrático preferencialmente.
2. ADAPTAÇÃO DE LINGUAGEM: Ajuste o tom, vocabulário e complexidade dos exemplos com base no perfil do aluno (idade, nível de conhecimento, estilo de aprendizagem). Se o aluno for iniciante, seja mais didático e use analogias simples. Se for avançado, seja mais desafiador.
3. MEMÓRIA COGNITIVA: Utilize o histórico da conversa e o resumo da memória para criar conexões com o que o aluno já sabe ou onde ele tropeçou anteriormente. Mencione coisas como "Como vimos antes..." ou "Da última vez você comentou que...".
4. DIAGNÓSTICO DE DIFICULDADES: Fique atento a erros recorrentes, hesitações e lacunas de pré-requisitos. Se identificar uma dificuldade, aponte-a de forma construtiva e ofereça um reforço imediato.
5. PROPOSIÇÃO DE EXERCÍCIOS: Proponha desafios pontuais e curtos ("micro-desafios") para validar a compreensão. Varie entre perguntas abertas e múltipla escolha.
6. PADRÃO SENAI/SAEP: Mantenha o foco em competências e habilidades profissionais/técnicas.

NÃO entregue a resposta final de bandeja. Guie o aluno.

RESPOSTA (JSON):
Deve retornar obrigatoriamente:
{
  "resposta": "Sua explicação ou fala para o aluno",
  "estrategia": "socratica | direta | revisao | desafio",
  "perguntaGuia": "Uma pergunta para o aluno responder a seguir",
  "exercicioSugerido": {
    "enunciado": "string",
    "tipo": "multipla | aberta",
    "opcoes": ["..."], // se múltipla
    "gabarito": "string"
  } | null,
  "dificuldadeDetectada": {
    "habilidade": "string",
    "nivel": "leve | media | alta",
    "descricao": "O que você percebeu"
  } | null,
  "insightHistoryUsed": "Breve frase sobre o que você lembrou do histórico (ex: Relembrando o conceito de X que discutimos)"
}
`;

  const prompt = `
HISTÓRICO DA CONVERSA / MEMÓRIA PEDAGÓGICA:
${memorySummary || "Sem histórico relevante ainda."}

PERFIL DO ALUNO (DNA DE APRENDIZAGEM):
${JSON.stringify(studentProfile || {}, null, 2)}

MENSAGEM DO ALUNO:
${request.command || request.action}

ENTRADA ADICIONAL:
${JSON.stringify(request.input || {}, null, 2)}

RESPONDA APENAS O JSON ESTRUTURADO.
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: request.costMode || "normal",
    responseFormat: 'json'
  });
  
  const parsed = JSON.parse(result.text);

  // Registrar na memória para que a próxima interação saiba desta
  if (request.userId && parsed.resposta) {
    await memoryAgent.recordInteraction(request.userId, "TUTOR_CHAT", request.command || request.action || "", parsed.resposta);
  }

  return parsed;
}
