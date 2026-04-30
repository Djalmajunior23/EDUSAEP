import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function studentAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Mentor de Carreira e Estudos do EduAiCore.
Responda ao aluno de forma inspiradora, mas realista, focando em mercado de trabalho e competências práticas.
Ajude-o a ver valor no que está aprendendo.
Responda somente em JSON válido.
`;

  const prompt = `
Mensagem do Aluno:
${request.command || request.action}
Entrada Adicional:
${JSON.stringify(request.input || {}, null, 2)}

Responda:
{
  "mensagem": "",
  "conexaoMercado": "",
  "proximoPassoCarreira": "",
  "incentivo": ""
}
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: request.costMode || "normal",
    responseFormat: 'json'
  });
  return JSON.parse(result.text);
}
