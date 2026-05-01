import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

/**
 * Especialista em Itens de Avaliação de Alta Performance
 * Gera, valida e otimiza questões para o ecossistema EduAI.
 */

export async function analyzeQuestionQuality(question: any) {
  const systemInstruction = `
Você é o Auditor de Qualidade de Itens Pedagógicos do EduAI Core.
Sua missão é garantir que toda questão siga rigorosamente os padrões SAEP/SENAI.

### Critérios de Auditoria:
1. **Ambiguidades**: O comando é claro e leva a uma única interpretação?
2. **Alternativas Óbvias**: Há alternativas que podem ser descartadas sem conhecimento técnico?
3. **Distratores Fracos**: As alternativas incorretas refletem erros comuns de raciocínio ou são apenas "aleatórias"?
4. **Alinhamento**: A questão realmente mede a habilidade/competência proposta?
5. **Nível de Bloom**: O nível cognitivo está corretamente classificado?

### Formato de Retorno (JSON):
{
  "score": number (0-100),
  "isApproved": boolean,
  "vulnerabilities": ["ambiguidade", "distrator_fraco", "alternativa_obvia", "outros"],
  "analysis": "Explicação detalhada dos pontos positivos e negativos",
  "suggestions": ["Lista de melhorias automáticas sugeridas"],
  "improvedQuestion": {
    "enunciado": "string (versão aprimorada)",
    "alternativas": { "a": "", "b": "", "c": "", "d": "" },
    "respostaCorreta": "a|b|c|d",
    "justificativa": "string (refinada)"
  }
}
`;

  const userPrompt = `Analise a seguinte questão:
${JSON.stringify(question, null, 2)}
`;

  const result = await callAI({
    systemPrompt: systemInstruction,
    userPrompt,
    costMode: "normal",
    responseFormat: 'json'
  });

  return JSON.parse(result.text);
}

export const questionAgent: Agent = {
  name: "question",
  systemInstruction: `
Você é o Especialista em Itens SAEP/SENAI Ultra.
Sua missão é gerar questões que não apenas desafiem o aluno, mas que sejam pedagogicamente blindadas.

### Suas Regras de Ouro:
1. **Enunciado Contextualizado**: Sempre use cenários industriais, dilemas comerciais ou problemas técnicos reais.
2. **Distratores de Erro Cognitivo**: Cada alternativa incorreta deve representar um erro de raciocínio específico (ex: inversão de fórmula, erro de unidade, conceito trocado).
3. **Sem Pistas**: Evite palavras como "Sempre", "Nunca", ou alternativas muito mais longas que as outras.
4. **Auto-Crítica**: Antes de retornar, valide se a questão não é ambígua.

### Formato de Retorno (JSON):
{
  "questoes": [
    {
      "enunciado": "string",
      "alternativas": { "a": "", "b": "", "c": "", "d": "" },
      "respostaCorreta": "a|b|c|d",
      "justificativa": "Explicação técnica por que a correta é a correta e por que os distratores estão errados",
      "competencia": "string",
      "habilidade": "string",
      "nivelBloom": "Lembrar | Entender | Aplicar | Analisar | Avaliar | Criar",
      "qualidade_auto_audit": {
         "score_estimado": number,
         "distrator_analise": "Justificativa dos distratores"
      }
    }
  ]
}
`,
  process: async (request: EduJarvisRequest, context: AgentContext) => {
    const db = admin.firestore();
    const { action, input, command } = request;

    // Ação: Analisar Qualidade de uma questão específica
    if (action === 'ANALYZE_QUALITY' || command?.toLowerCase().includes('analisar qualidade')) {
      const questionToAnalyze = input?.question || context?.metadata?.currentQuestion;
      if (!questionToAnalyze) {
        return { 
          success: false,
          response: "Por favor, forneça uma questão para análise no campo 'input.question'." 
        };
      }
      const auditResult = await analyzeQuestionQuality(questionToAnalyze);
      return {
        success: true,
        response: `Análise de qualidade concluída. Nota: ${auditResult.score}/100. ${auditResult.isApproved ? 'Aprovada para uso.' : 'Requer ajustes.'}`,
        data: auditResult
      };
    }

    // Comportamento padrão: Gerar questões
    const prompt = `
Matriz/Conteúdo Alvo:
${JSON.stringify(input || {}, null, 2)}

Quantidade/Nível: ${input?.quantity || 1} questões, nível ${input?.difficulty || 'médio'}.
Tópico/Comando: ${command || "Geral"}

Gere as questões seguindo as Regras de Ouro.
`;

    const result = await callAI({ 
      systemPrompt: questionAgent.systemInstruction, 
      userPrompt: prompt, 
      costMode: request.costMode || "normal",
      responseFormat: 'json'
    });

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch (e) {
      console.error("[QuestionAgent] Failed to parse AI response:", e);
      return { error: "Falha ao processar resposta do assistente.", questoes: [] };
    }

    // Auditoria automática antes de salvar - Verificação Defensiva
    if (parsed && Array.isArray(parsed.questoes) && parsed.questoes.length > 0) {
      for (let i = 0; i < parsed.questoes.length; i++) {
        try {
          const audit = await analyzeQuestionQuality(parsed.questoes[i]);
          
          if (audit && audit.score < 80 && audit.improvedQuestion) {
            // Usa a versão aprimorada
            parsed.questoes[i] = {
              ...parsed.questoes[i],
              ...audit.improvedQuestion,
              audit_score: audit.score,
              audit_analysis: audit.analysis,
              audit_vulnerabilities: audit.vulnerabilities || []
            };
          } else if (audit) {
            // Mantém original mas adiciona metadados da auditoria
            parsed.questoes[i].audit_score = audit.score || 70;
            parsed.questoes[i].audit_analysis = audit.analysis || "Análise concluída.";
            parsed.questoes[i].audit_vulnerabilities = audit.vulnerabilities || [];
          }
        } catch (auditErr) {
          console.error("Erro na auditoria da questão:", auditErr);
          parsed.questoes[i].audit_score = 70;
          parsed.questoes[i].audit_analysis = "Auditoria automatizada indisponível no momento.";
        }
      }
    }

    // Persistir no banco de questões
    if (parsed && Array.isArray(parsed.questoes) && parsed.questoes.length > 0 && context?.userId) {
      const batch = db.batch();
      parsed.questoes.forEach((q: any) => {
        const ref = db.collection('banco_questoes').doc();
        batch.set(ref, {
          ...q,
          professorId: context.userId,
          criadoPor: context.userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: (q.audit_score || 0) >= 80 ? 'homologada' : 'pendente_revisao'
        });
      });
      await batch.commit();
    }

    return parsed;
  }
};
