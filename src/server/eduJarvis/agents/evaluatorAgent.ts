import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";

export async function evaluatorAgent(request: EduJarvisRequest) {
  const { action, input } = request;

  const systemInstruction = `
Você é o Avaliador Pedagógico Ultra (Evaluator Agent) do EduAiCore.
Sua missão é realizar avaliações pedagógicas precisas, justas e formativas, focando em diagnóstico profundo de erros e calibração de itens.

MODOS DE OPERAÇÃO:
1. CORRIGIR_RESPOSTA: Avalie a resposta do aluno comparando-a com o gabarito. Atribua nota (0-100) e feedback construtivo.
2. IDENTIFICAR_ERROS: Realize um diagnóstico clínico da resposta para encontrar "Misconceptions" (erros conceituais profundos), falhas de lógica ou lacunas de pré-requisitos.
3. AVALIAR_RUBRICA: Use os critérios fornecidos para justificar a pontuação em cada dimensão da rubrica.
4. CALIBRAR_ITEM: Analise se a questão (item) está bem formulada técnica e pedagogicamente (enunciado, clareza, distratores).

DIRETRIZES DE RETORNO (JSON):
Deve seguir rigorosamente esta estrutura:
{
  "score": number, // 0-100
  "feedback": "Texto detalhado para o aluno",
  "errosConceituais": ["Lista de erros identificados"],
  "pontosPositivos": ["O que o aluno acertou ou demonstrou domínio"],
  "sugestaoRecuperacao": "O que o aluno deve estudar para corrigir as falhas",
  "rubrica": { "criterio_id": "nivel" },
  "diagnosticoItem": {
     "qualidade": "alta|media|baixa",
     "sugestaoAjuste": "string"
  }
}
`;

  const actionPrompts: Record<string, string> = {
    "CORRIGIR_RESPOSTA": "Corrija a resposta e forneça feedback completo, incluindo erros conceituais e sugestão de recuperação.",
    "IDENTIFICAR_ERROS": "Foco total em identificar falhas de lógica, erros conceituais ou lacunas de pré-requisitos na resposta.",
    "AVALIAR_RUBRICA": "Corrija a resposta seguindo estritamente as rubricas fornecidas.",
    "CALIBRAR_ITEM": "Analise a qualidade técnica desta questão discursiva e do seu critério de correção (Padrão SAEP/SENAI)."
  };

  const actionText = actionPrompts[action || ""] || "Avalie o conteúdo pedagógico fornecido.";

  const prompt = `
AÇÃO DE AVALIAÇÃO: ${action}
DIRETRIZ: ${actionText}

DADOS DE ENTRADA (Resposta/Item/Critérios):
${JSON.stringify(input, null, 2)}

RETORNE APENAS O JSON ESTRUTURADO.
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: request.costMode || "normal",
    responseFormat: 'json'
  });
  
  return JSON.parse(result.text);
}
