import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider"; // Ajustando importação baseada na estrutura
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

export const professorAgent: Agent = {
    name: "professor",
    systemInstruction: `
Você é o Agente Professor Ultra do EduAiCore.
Sua especialidade é: Metodologias Ativas, Estudo de Caso de Alta Complexidade, Aula Invertida, Planos de Aula (Padrão SENAI/SAEP) e Taxonomia de Bloom.

REGRAS DE OURO:
1. Responda sempre em JSON válido.
2. Planos de Aula devem conter: cronograma minuto a minuto, recursos detalhados e 3 métodos de avaliação (formativa, somativa e diagnóstica).
3. Estudos de Caso devem focar em problemas REAIS do mercado técnico/industrial.
4. Aulas Invertidas devem separar claramente "Preparação (Pré-aula)", "Desafio (Em sala)" e "Consolidação (Pós-aula)".
5. Nunca invente dados acadêmicos fora do contexto técnico.
`,
    process: async (request: EduJarvisRequest, context: AgentContext) => {
        const db = admin.firestore();
        const { action, input } = request;
        
        const actionPrompts: Record<string, string> = {
            "GERAR_AULA": "Gere uma aula completa. Estrutura: Objetivos, Conteúdo, Dinâmica e Fechamento.",
            "GERAR_ATIVIDADE_PRATICA": "Gere uma atividade prática técnica. Inclua roteiro passo a passo e checklist de segurança.",
            "GERAR_PLANO_AULA": `Gere um Plano de Aula DETALHADO (Padrao SENAI/SAEP). 
              Exigências: 
              - Cronograma de Atividades (ex: 0-15min: Abertura...).
              - Recursos Sugeridos (equipamentos, softwares).
              - Métodos de Avaliação (Diagnóstica, Formativa e Somativa).`,
            "GERAR_AULA_INVERTIDA": `Planeje uma Aula Invertida completa. 
              Exigências:
              - Materiais Pré-aula (vídeos, leituras, links).
              - Desafio em Sala (mão na massa, resolução de problema).
              - Consolidação (atividade pós-aula).`,
            "GERAR_ESTUDO_CASO": `Crie um Estudo de Caso Profissional. 
              Exigências:
              - Contexto Industrial/Técnico real.
              - Problema Crítico a ser resolvido.
              - 3 Perguntas Norteadoras de alta complexidade (Nível Bloom: Analisar/Avaliar).`,
            "GERAR_RUBRICA": "Gere uma Rubrica de Avaliação por Competências. Níveis: Insuficiente, Básico, Pleno, Avançado.",
            "SUGERIR_INTERVENCAO": "Gere um plano de intervenção pedagógica para alunos com lacunas específicas."
        };

        const actionText = actionPrompts[action || ""] || "Auxilie na criação de conteúdos e planos pedagógicos.";

        const prompt = `
AÇÃO ESPECÍFICA: ${action}
ORIENTAÇÃO TÉCNICA: ${actionText}

DADOS DE ENTRADA:
${JSON.stringify(input, null, 2)}

CONTEXTO PEDAGÓGICO:
${JSON.stringify(context, null, 2)}

RETORNE APENAS O JSON ESTRUTURADO.
`;

        const aiResponse = await callAI({ 
            systemPrompt: professorAgent.systemInstruction, 
            userPrompt: prompt,
            costMode: request.costMode || "normal",
            responseFormat: 'json'
        });
        const result = JSON.parse(aiResponse.text);

        // Persistência das produções pedagógicas
        await db.collection('materiais_pedagogicos').add({
            ...result,
            criadoPor: context.userId,
            tipo: action,
            status: 'rascunho',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return result;
    }
};
