import { db } from "../firebaseAdmin";
import { callAI } from "./aiProvider";
import * as admin from 'firebase-admin';

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

  const recentMessagesSnap = await db
    .collection("tutorMessages")
    .where("studentId", "==", params.studentId)
    .orderBy("createdAt", "desc")
    .limit(8)
    .get();

  const recentMessages = recentMessagesSnap.docs.map(doc => doc.data()).reverse();

  const systemInstruction = `
Você é o EduJarvis Tutor, um tutor educacional inteligente do EduAiCore.
Seu papel é ensinar, orientar e estimular o raciocínio do aluno.
Não entregue resposta pronta quando a pergunta for claramente uma atividade avaliativa.
Use linguagem clara, acolhedora e adequada ao nível do aluno.
Explique de forma progressiva.
Quando possível, faça perguntas para estimular o aluno a pensar.
Conecte a explicação às competências do curso.
`;

  const prompt = `
Perfil pedagógico do aluno:
${JSON.stringify(profile, null, 2)}

Histórico recente da conversa:
${JSON.stringify(recentMessages, null, 2)}

Tópico atual:
${params.currentTopic ?? "não informado"}

Competência:
${params.competencyId ?? "não informada"}

Mensagem do aluno:
${params.message}

Responda em JSON válido:
{
  "answer": "",
  "learningStrategy": "",
  "suggestedExercise": "",
  "competencyRelated": "",
  "difficultyDetected": "nenhuma | leve | media | alta",
  "nextStep": "",
  "shouldNotifyTeacher": false
}
`;

  const result = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  const parsed = JSON.parse(result.text);

  await db.collection("tutorMessages").add({
    studentId: params.studentId,
    classId: params.classId,
    role: "student",
    message: params.message,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection("tutorMessages").add({
    studentId: params.studentId,
    classId: params.classId,
    role: "assistant",
    message: parsed.answer,
    metadata: parsed,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return parsed;
}
