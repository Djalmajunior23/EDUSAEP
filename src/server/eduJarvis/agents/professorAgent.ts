import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider"; // Ajustando importação baseada na estrutura
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

export const professorAgent: Agent = {
    name: "professor",
    systemInstruction: `
Você é o Agente Professor do EduAiCore.
Atue como especialista em educação profissional, SENAI, SAEP, Taxonomia de Bloom e metodologias ativas.
Gere respostas pedagógicas claras, aplicáveis e estruturadas.
`,
    process: async (request: EduJarvisRequest, context: AgentContext) => {
        const db = admin.firestore();
        const { action, input } = request;
        
        // Mantendo a lógica de geração similar à do teacherCopilotAgent
        const prompt = `
Ação solicitada: ${action}

Dados recebidos:
${JSON.stringify(input, null, 2)}

Contexto de usuário:
${JSON.stringify(context, null, 2)}

Responda SOMENTE em JSON válido com a estrutura adequada à ação solicitada.
`;

        const aiResponse = await callAI({ systemPrompt: professorAgent.systemInstruction, userPrompt: prompt });
        const result = JSON.parse(aiResponse.text);

        // Persistência mantida
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
