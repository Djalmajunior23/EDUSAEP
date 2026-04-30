import admin from 'firebase-admin';
import { callAI } from '../aiProvider';

/**
 * EduJarvis AI Engine - Camada de Processamento Inteligente
 * Responsável por gerenciar o pipeline de dados para ML, DL e Visão.
 */
export const aiEngine = {
  /**
   * Prepara o dataset para o modelo preditivo (ML/DL)
   */
  async prepareLearningDataset(userId: string) {
    const db = admin.firestore();
    
    // Coleta dados de múltiplas fontes para "treinamento" contextual
    const logs = await db.collection('jarvis_logs')
      .where('usuarioId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
      
    const interactions = logs.docs.map(d => d.data());
    
    // Coletar avaliações / diagnósticos recentes do aluno (Engagement & Mastery)
    let academicPerformance = [];
    try {
      const resultsRef = await db.collection('resultados')
        .where('studentId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .limit(10)
        .get();
      academicPerformance = resultsRef.docs.map(d => d.data());
    } catch(e) {}

    // Simulação de Pipeline de Dados: Normalização e Agregação
    const activityCount = interactions.length;
    const commonIntents = interactions.reduce((acc: any, curr: any) => {
      acc[curr.tipoAcao] = (acc[curr.tipoAcao] || 0) + 1;
      return acc;
    }, {});

    return {
      userId,
      activityCount,
      commonIntents,
      academicPerformance,
      lastInteractions: interactions.slice(0, 5),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Inferência de Risco Acadêmico usando padrões de Deep Learning
   */
  async runPredictiveInference(userId: string, currentContext: any) {
    const dataset = await this.prepareLearningDataset(userId);
    
    const systemPrompt = `
Você é o motor de inferência preditiva do EduJarvis AI Engine.
Você atua na predição de desempenho acadêmico, avaliando engajamento, tendências de aprendizado e mitigação de evasão.

Sua tarefa é analisar os dados de desempenho (academicPerformance) e engajamento (activityCount, interações).
Você DEVE RETORNAR ESTRITAMENTE UM JSON com a seguinte estrutura:

{
  "predictedScore": 0-100, // Score preditivo
  "trend": "UP" | "DOWN" | "STABLE", // Tendência temporal
  "keyFactors": ["Fator 1", "Fator 2"], // Motivos qualitativos do desempenho
  "recommendations": ["Rec 1", "Rec 2"], // Recomendações pedagógicas para reverter / acelerar
  "engagementMetrics": {
    "studyTimeMinutes": 120, // Estimativa de tempo baseado nas atividades
    "platformAccessFrequency": "HIGH" | "MEDIUM" | "LOW",
    "completionRate": 85 // Porcentagem preditiva
  },
  "riskLevel": "CRITICAL" | "WARNING" | "SAFE",
  "evasionRiskScore": 0-100, // Porcentagem que indica risco de evasão
  "adaptivePaths": [
    {
      "pathId": "id-unico",
      "title": "Título da Trilha",
      "reason": "Por que esta trilha ajudará este aluno"
    }
  ]
}
`;

    const userPrompt = `
Dataset Histórico do Aluno: ${JSON.stringify(dataset)}
Contexto Atual da Turma/Escola: ${JSON.stringify(currentContext)}

Faça a predição.
`;

    const aiResponse = await callAI({ systemPrompt, userPrompt, responseFormat: 'json' });
    let parsedData = {};
    try {
       parsedData = JSON.parse(aiResponse.text);
    } catch(err) {
       console.error("Falha ao parsear predição:", err);
       parsedData = { erro: "Falha na análise preditiva da IA" };
    }
    return parsedData;
  }
};
