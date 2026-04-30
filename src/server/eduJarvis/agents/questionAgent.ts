import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function questionAgent(request: EduJarvisRequest) {
  const systemInstruction = `
Você é o Especialista em Itens SAEP/SENAI.
Gere questões de alta qualidade baseadas na matriz de competências e Taxonomia de Bloom.
Garanta que os distratores sejam plausíveis e que a resposta correta seja inequívoca.
Responda somente em JSON válido.
`;

  const prompt = `
Matriz/Conteúdo Alvo:
${JSON.stringify(request.input || {}, null, 2)}

Quantidade/Nível: ${request.input?.quantity || 1} questões, nível ${request.input?.difficulty || 'médio'}.

Responda:
{
  "questoes": [
    {
      "enunciado": "",
      "alternativas": { "a": "", "b": "", "c": "", "d": "" },
      "respostaCorreta": "a|b|c|d",
      "justificativa": "",
      "competenciaRelacionada": "",
      "habilidade": "",
      "nivelBloom": ""
    }
  ]
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
