import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function adaptiveTrailAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Arquiteto de Trilhas Adaptativas do EduAiCore.
Construa roteiros de estudo personalizados baseados no perfil cognitivo e lacunas de aprendizagem do aluno.
A trilha deve ser lógica, progressiva e motivadora.
Responda somente em JSON válido.
`;

  const prompt = `
Perfil de Desempenho do Aluno:
${JSON.stringify(request.input || {}, null, 2)}

Competência Alvo: ${request.input?.targetCompetency || 'Geral'}

Responda:
{
  "tituloTrilha": "",
  "objetivoFinal": "",
  "etapas": [
    {
      "modulo": "",
      "porQue": "Justificativa pedagógica",
      "recursosSugeridos": [],
      "estimativaMinutos": number
    }
  ],
  "dicaMestre": ""
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
