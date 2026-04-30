import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function evaluatorAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Revisor Técnico de Itens do EduAiCore.
Sua função é avaliar a qualidade de questões (enunciado, distratores, clareza) seguindo as normas SAEP.
Identifique erros de português, ambiguidades e falhas pedagógicas.
Responda somente em JSON válido.
`;

  const prompt = `
Questão para avaliação:
${JSON.stringify(request.input || {}, null, 2)}

Responda:
{
  "aprovada": boolean,
  "scoreQualidade": number,
  "criticaCritica": "",
  "sugestoesMelhoria": [],
  "correcoesTexto": [],
  "analiseDistratores": ""
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
