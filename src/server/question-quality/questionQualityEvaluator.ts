import { callAI } from "../eduJarvis/aiProvider";
import { db } from "../firebaseAdmin";
import { QuestionToEvaluate, QuestionQualityReview } from "./questionQualityTypes";
import * as admin from 'firebase-admin';

export async function evaluateQuestionQuality(question: QuestionToEvaluate): Promise<QuestionQualityReview> {
  const systemInstruction = `
Você é um avaliador técnico-pedagógico de questões no padrão SENAI/SAEP.
Avalie a qualidade da questão de forma criteriosa.
Não seja condescendente. Reprove questões ambíguas, rasas ou mal alinhadas.
Responda somente em JSON válido.
`;

  const prompt = `
Avalie a questão abaixo:

${JSON.stringify(question, null, 2)}

Critérios:
1. Clareza do enunciado
2. Aderência à competência/capacidade/conhecimento
3. Qualidade dos distratores
4. Alinhamento ao nível de Bloom
5. Ausência de ambiguidade
6. Existência de apenas uma resposta correta
7. Dificuldade adequada
8. Padrão SAEP/SENAI

Responda no formato:
{
  "qualityScore": 0,
  "status": "aprovada | revisar | rejeitada",
  "clarityScore": 0,
  "competencyAlignmentScore": 0,
  "distractorQualityScore": 0,
  "bloomAlignmentScore": 0,
  "problems": [],
  "suggestions": [],
  "improvedQuestion": {
    "statement": "",
    "competency": "",
    "capacity": "",
    "knowledge": "",
    "bloomLevel": "",
    "difficulty": "",
    "alternatives": {
      "A": "",
      "B": "",
      "C": "",
      "D": "",
      "E": ""
    },
    "correctAnswer": "",
    "explanation": ""
  }
}
`;

  const result = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  const review = JSON.parse(result.text);

  await db.collection("questionQualityReviews").add({
    questionId: question.id ?? null,
    ...review,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  if (question.id) {
    await db.collection("questions").doc(question.id).update({
      qualityScore: review.qualityScore,
      qualityStatus: review.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return review;
}
