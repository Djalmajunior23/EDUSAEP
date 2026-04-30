import { callAI } from '../aiProvider';
import { UserRole } from '../../../types/eduJarvisTypes';

export async function questionOptimizerAgent(command: string, userId: string, context?: any) {
  const isDiscursive = context?.isDiscursive || false;
  const question = context?.question || {};
  const errors = context?.errors || [];

  const systemPrompt = isDiscursive
? `Como um Especialista em Avaliação Educacional e Design de Itens (padrão SAEP), analise esta questão discursiva que apresenta alto índice de erros cognitivos ou baixas notas.
            
DADOS DA QUESTÃO:
${JSON.stringify({
  enunciado: question.enunciado,
  respostaEsperada: question.respostaEsperada,
  criteriosAvaliacao: question.criteriosAvaliacao
})}

DADOS DE ERROS COGNITIVOS/BAIXO DESEMPENHO NAS SUBMISSÕES:
${JSON.stringify(errors.map((e: any) => ({ category: e.category, explanation: e.explanation })))}

Sua tarefa:
1. Identificar se o enunciado possui ambiguidades, falta de clareza ou excesso de carga cognitiva.
2. Referenciar se a rubrica atual é justa.
3. Sugerir uma reformulação do enunciado focada na clareza e objetividade.
4. Definir resposta esperada e aprimorar critérios.
5. Explicar como essas mudanças abordam especificamente os erros cognitivos.

RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
{
  "questionId": "${question.id || question.questionUid}",
  "originalEnunciado": string,
  "suggestedEnunciado": string (opcional),
  "originalRespostaEsperada": string,
  "suggestedRespostaEsperada": string (opcional),
  "originalCriterios": Array,
  "suggestedCriterios": Array<{criterio: string, descricao: string, pontuacao: number}>,
  "analysis": string (Análise pedagógica da questão original),
  "improvements": string[] (Lista de melhorias sugeridas),
  "cognitiveErrorsAddressed": string[] (Quais categorias de erro esta reformulação visa reduzir)
}`
: `Como um Especialista em Avaliação Educacional e Design de Itens (padrão SAEP), analise esta questão de múltipla escolha que apresenta alto índice de erros cognitivos pelos alunos.

DADOS DA QUESTÃO:
${JSON.stringify({
  enunciado: question.enunciado,
  alternativas: question.alternativas,
  respostaCorreta: question.respostaCorreta,
  comentarioGabarito: question.comentarioGabarito
})}

DADOS DE ERROS COGNITIVOS IDENTIFICADOS NAS SUBMISSÕES:
${JSON.stringify(errors.map((e: any) => ({ category: e.category, explanation: e.explanation })))}

Sua tarefa:
1. Identificar se o enunciado possui ambiguidades, falta de clareza ou excesso de carga cognitiva.
2. Avaliar se os distratores capturam equívocos comuns de raciocínio.
3. Sugerir uma reformulação do enunciado focada na clareza e objetividade.
4. Sugerir alternativas que diferenciem melhor alunos.
5. Explicar como essas mudanças abordam os erros.

RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
{
  "questionId": "${question.id || question.questionUid}",
  "originalEnunciado": string,
  "suggestedEnunciado": string,
  "originalAlternativas": Array<{id, texto}>,
  "suggestedAlternativas": Array<{id, texto}>,
  "analysis": string (Análise pedagógica),
  "improvements": string[] (Lista de melhorias),
  "cognitiveErrorsAddressed": string[]
}`;

  const userPrompt = `
Usuário solicitante: ${userId}
Comando: ${command}
Contexto Base: ${JSON.stringify(context || {})}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt, responseFormat: 'json' });

  let parsedResponse = {};
  if (aiResponse.text) {
    try {
      parsedResponse = JSON.parse(aiResponse.text);
    } catch(err) {
      console.error("Erro ao fazer o parse do JSON na otimização de questão:", err);
      parsedResponse = { error: "O IA não retornou JSON válido." };
    }
  }

  return {
    response: "Análise e otimização de questão concluída.",
    actionType: 'OTIMIZAR_QUESTAO' as any,
    data: parsedResponse
  };
}
