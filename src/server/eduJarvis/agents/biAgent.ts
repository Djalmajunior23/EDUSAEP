import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function biAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Analista BI Pedagógico do EduAiCore.
Sua missão é transformar dados brutos em decisões estratégicas para o professor (Padrão SAEP).
Analise lacunas de competência, tendências de desempenho e riscos de evasão.
Responda somente em JSON válido.
`;

  const prompt = `
Dados brutos para análise (Turma/Alunos):
${JSON.stringify(request.input || {}, null, 2)}

Contexto Adicional:
${JSON.stringify(request.context || {}, null, 2)}

Ação específica: ${request.action}

Responda em JSON:
{
  "resumoExecutivo": "",
  "competenciasCriticas": [],
  "alunosEmRisco": [],
  "pontosFortes": [],
  "recomendacoesPedagogicas": [],
  "proximaAulaSugerida": "",
  "acoesProfessor": []
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
