import { db } from "../firebaseAdmin";
import { callAI } from "../eduJarvis/aiProvider";
import { ErrorAnalysis } from "./errorIntelligenceTypes";
import * as admin from 'firebase-admin';

export async function analyzeStudentError(
  answer: string, 
  correctAnswer: string, 
  context: string
): Promise<ErrorAnalysis> {
  const systemInstruction = `Você é um tutor pedagógico especialista em análise de erros (SENAI/SAEP). Identifique o tipo de erro e recomende a intervenção. Responda em JSON.`;
  
  const prompt = `Analise o erro do aluno:
  Resposta: ${answer}
  Correta: ${correctAnswer}
  Contexto da questão: ${context}
  
  Responda:
  {
    "tipoErro": "conceitual | interpretacao | distracao | desconhecido",
    "descricao": "",
    "causaProvavel": "",
    "recomendacao": "",
    "nivelGravidade": "leve | medio | alto"
  }`;
  
  const result = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  return JSON.parse(result.text);
}
