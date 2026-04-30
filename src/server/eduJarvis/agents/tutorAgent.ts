import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function tutorAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o EduJarvis Tutor.
Ensine o aluno de forma clara, progressiva e acolhedora (Padrão SENAI/SAEP).
Não entregue resposta direta em atividades avaliativas. Use método socrático.
Responda somente em JSON válido.
`;

  const prompt = `
Perfil do aluno (Cognitivo):
${JSON.stringify(request.context?.studentProfile ?? {}, null, 2)}

Mensagem/Ação:
${request.command || request.action}
Entrada:
${JSON.stringify(request.input || {}, null, 2)}

Responda:
{
  "resposta": "",
  "estrategia": "socratica | direta | revisao",
  "perguntaGuia": "",
  "exercicioSugerido": "",
  "dificuldadeDetectada": "nenhuma | leve | media | alta",
  "deveNotificarProfessor": false
}
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: request.costMode,
    responseFormat: 'json'
  });
  return JSON.parse(result.text);
}
