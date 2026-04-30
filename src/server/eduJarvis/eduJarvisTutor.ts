import { db } from "../firebaseAdmin";
import { callAI } from "./aiProvider";
import * as admin from 'firebase-admin';
import { memoryAgent } from "./agents/memoryAgent";

export async function getStudentLearningProfile(studentId: string) {
  const doc = await db.collection("studentLearningProfiles").doc(studentId).get();

  if (!doc.exists) {
    return {
      studentId,
      learningLevel: "iniciante",
      weakCompetencies: [],
      strongCompetencies: [],
      preferredExplanationStyle: "passo_a_passo"
    };
  }

  return doc.data();
}

export async function runEduJarvisTutor(params: {
  studentId: string;
  classId: string;
  message: string;
  currentTopic?: string;
  competencyId?: string;
}) {
  const profile = await getStudentLearningProfile(params.studentId);
  const memorySummary = await memoryAgent.getMemorySummary(params.studentId);

  const systemInstruction = `
Você é o Tutor IA Conversacional Ultra do EduAiCore.
Sua missão é atuar como um mentor pedagógico inteligente que lembra o histórico, adapta a linguagem e identifica dificuldades.

DIRETRIZES:
1. FOCO NO ALUNO: Adapte a explicação ao nível e estilo do aluno (Perfil fornecido).
2. MEMÓRIA: Use o Histórico/Resumo de memória para dar continuidade ao aprendizado.
3. MÉTODO SOCRÁTICO: Estimule o pensamento crítico. Não dê respostas diretas se for um desafio.
4. MICRO-EXERCÍCIOS: Se perceber que o aluno entendeu um conceito, proponha um pequeno exercício para validar.
5. DIAGNÓSTICO: Identifique dificuldades conceituais e mencione-as suavemente.
`;

  const prompt = `
RESUMO DA MEMÓRIA PEDAGÓGICA:
${memorySummary}

PERFIL DO ALUNO:
${JSON.stringify(profile, null, 2)}

CONTEXTO:
Tópico: ${params.currentTopic ?? "não informado"}
Competência: ${params.competencyId ?? "não informada"}

MENSAGEM ATUAL DO ALUNO:
${params.message}

RESPONDA EXCLUSIVAMENTE EM JSON:
{
  "answer": "Sua resposta formativa para o aluno",
  "learningStrategy": "socratica | direta | revisao | desafio",
  "suggestedExercise": {
    "enunciado": "string",
    "tipo": "aberta | multipla",
    "opcoes": ["..."],
    "gabarito": "string"
  } | null,
  "difficultyDetected": {
    "nivel": "nenhuma | leve | media | alta",
    "pontoChave": "string"
  },
  "insightHistoryUsed": "string",
  "shouldNotifyTeacher": false
}
`;

  const result = await callAI({
    systemPrompt: systemInstruction, 
    userPrompt: prompt,
    responseFormat: 'json'
  });
  
  const parsed = JSON.parse(result.text);

  // Registro na memória pedagógica
  await memoryAgent.recordInteraction(params.studentId, "TUTOR_CONVERSA", params.message, parsed.answer);
  
  // Registro para o chat histórico (UI)
  await db.collection("tutor_chat_history").add({
    userId: params.studentId,
    role: "assistant",
    content: parsed.answer,
    data: parsed,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return parsed;
}
