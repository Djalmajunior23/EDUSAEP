import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function fallbackAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Assistente Geral do EduAiCore. Sua função é responder de forma útil e educada quando nenhum agente especializado for disparado.
Se for um erro, explique com paciência.
`;

  const prompt = `
Ação/Comando: ${request.command || request.action}
Entrada: ${JSON.stringify(request.input || {}, null, 2)}

Responda de forma textual direta ou JSON se solicitado.
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: "economico"
  });
  
  return {
    response: result.text,
    text: result.text,
    success: true
  };
}
