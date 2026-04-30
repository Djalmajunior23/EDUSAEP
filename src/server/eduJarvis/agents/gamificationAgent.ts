import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider"; 
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

export const gamificationAgent: Agent = {
    name: "gamification",
    systemInstruction: `
Você é o Agente de Gamificação do EduAiCore.
Seu objetivo é aumentar o engajamento do aluno através de desafios, missões e recompensas.
Adapte os desafios ao desempenho do aluno (alunos com facilidade recebem desafios complexos, alunos com dificuldade recebem missões de reforço).
Sempre responda em JSON.
`,
    process: async (request: EduJarvisRequest, context: AgentContext) => {
        const db = admin.firestore();
        const { action, input } = request;
        const userGamificationRef = db.collection('users').doc(context.userId).collection('gamification').doc('stats');

        if (action === 'get_dashboard') {
            const doc = await userGamificationRef.get();
            return doc.exists ? doc.data() : { points: 0, badges: [], level: 1 };
        }

        if (action === 'suggest_challenge') {
            // IA gera desafio baseado no contexto
            const prompt = `
O aluno tem o seguinte desempenho: ${JSON.stringify(input.performance)}
Contexto da turma: ${JSON.stringify(context.metadata)}
Sugira 3 desafios personalizados (missões) compatíveis com o nível de desempenho.
Formato JSON: 
{
  "challenges": [
    { "titulo": "", "descricao": "", "recompensa": 0, "tipo": "adaptativo|reforco|desafio" }
  ]
}
`;
            const aiResponse = await callAI({ systemPrompt: gamificationAgent.systemInstruction, userPrompt: prompt });
            return JSON.parse(aiResponse.text);
        }

        if (action === 'process_achievement') {
            // Lógica simples de pontuação
            const { pointsGain, missionId } = input;
            await db.runTransaction(async (t) => {
                const doc = await t.get(userGamificationRef);
                const currentData = doc.exists ? doc.data() : { points: 0, badges: [] };
                t.set(userGamificationRef, {
                    points: (currentData?.points || 0) + pointsGain,
                    lastMission: missionId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            return { success: true, pointsAdded: pointsGain };
        }
        
        throw new Error("Ação de gamificação não reconhecida.");
    }
};
