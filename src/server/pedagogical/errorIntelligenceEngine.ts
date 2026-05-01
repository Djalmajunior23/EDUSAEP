import { generateContentWrapper } from "../../services/geminiService";
import { ErrorAnalysis } from "./errorIntelligenceTypes";

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
  
  Responda APENAS em JSON válido, sem markdown:
  {
    "tipoErro": "conceitual | interpretacao | distracao | desconhecido",
    "descricao": "",
    "causaProvavel": "",
    "recomendacao": "",
    "nivelGravidade": "leve | medio | alto"
  }`;
  
  const result = await generateContentWrapper({
    model: "gemini-1.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemInstruction + "\n\n" + prompt }] }
    ]
  });
  
  try {
    const text = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro no parse JSON de analyzeStudentError", e);
    return {
      tipoErro: "desconhecido",
      descricao: "Falha na análise",
      causaProvavel: "Erro ao gerar IA",
      recomendacao: "Verificar manualmente",
      nivelGravidade: "medio"
    } as any;
  }
}
