import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider"; // Ajustando importação baseada na estrutura
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

export const professorAgent: Agent = {
    name: "professor",
    systemInstruction: `
Você é o Agente Professor Ultra do EduAiCore.
Sua especialidade é: Metodologias Ativas, Estudo de Caso, Aula Invertida, Planos de Aula (Padrão SENAI/SAEP) e Taxonomia de Bloom.
Responda sempre em JSON válido, estruturado e profissional.
Não invente dados acadêmicos fora do contexto.
`,
    process: async (request: EduJarvisRequest, context: AgentContext) => {
        const db = admin.firestore();
        const { action, input } = request;
        
        const actionPrompts: Record<string, string> = {
            "GERAR_AULA": "Gere uma aula completa sobre o tema. Inclua: Introdução, Desenvolvimento, Conclusão e Recursos.",
            "GERAR_ATIVIDADE_PRATICA": "Gere uma atividade prática focada em competências técnicas. Inclua roteiro e lista de materiais.",
            "GERAR_PLANO_AULA": "Gere um Plano de Aula no padrão SENAI/SAEP. Inclua Competências, Habilidades, Estratégia de Ensino e Cronograma.",
            "GERAR_AULA_INVERTIDA": "Planeje uma Aula Invertida. Defina o conteúdo pré-aula (aluno), desafio em sala (prática) e consolidação pós-aula.",
            "GERAR_ESTUDO_CASO": "Crie um Estudo de Caso realístico para a área técnica. Inclua problema, contexto e 3 perguntas norteadoras.",
            "GERAR_RUBRICA": "Gere uma Rubrica Automática para avaliação. Níveis: Insuficiente, Básico, Pleno e Avançado. Defina critérios claros.",
            "SUGERIR_INTERVENCAO": "Com base no desempenho do aluno/turma, sugira uma Intervenção Pedagógica imediata para sanar lacunas de aprendizagem."
        };

        const actionText = actionPrompts[action || ""] || "Auxilie na criação de conteúdos e planos pedagógicos.";

        const prompt = `
AÇÃO SOLICITADA: ${action}
DESCRIÇÃO: ${actionText}

DADOS RECEBIDOS:
${JSON.stringify(input, null, 2)}

CONTEXTO DE USUÁRIO:
${JSON.stringify(context, null, 2)}

Responda SOMENTE em JSON válido com a estrutura adequada à ação solicitada.
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
