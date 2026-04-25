import { generateContentWrapper } from './geminiService';

export const aiCopilotService = {
  generateQuiz: async (topic: string, level: string, numQuestions: number = 5) => {
    const prompt = `Crie um quiz interativo e gamificado sobre "${topic}" para o nível "${level}".
    A estrutura deve ser um JSON array de objetos Question:
    {
      "enunciado": "pergunta aqui",
      "alternativas": ["A", "B", "C", "D"],
      "respostaCorreta": 0,
      "explicacao": "explicação pedagógica curta",
      "dificuldade": "${level}",
      "competencia": "nome da competência"
    }
    Gere ${numQuestions} questões focadas em engajamento e clareza técnica.`;

    return await generateContentWrapper(prompt);
  },

  generatePracticalLab: async (topic: string, course: string) => {
    const prompt = `Crie um Roteiro de Laboratório Prático para o curso de "${course}" sobre o tema "${topic}".
    O roteiro deve seguir a estrutura JSON:
    {
      "title": "Título do Lab",
      "objective": "Objetivo de aprendizagem",
      "context": "Cenário/Contexto profissional real",
      "problem": "O desafio central a ser resolvido",
      "steps": [
        { "order": 1, "instruction": "Instrução clara", "hint": "Dica técnica" }
      ],
      "resources": ["PDF x", "Simulador y"],
      "rubric": [
        { "criterion": "Critério de avaliação", "weight": 5 }
      ]
    }`;

    return await generateContentWrapper(prompt);
  },

  analyzeClassEngagement: async (metrics: any) => {
    const prompt = `Atue como um Coordenador Pedagógico do EduAI Core. Analise os seguintes dados de engajamento da turma:
    ${JSON.stringify(metrics)}
    
    Identifique:
    1. Gargalos de aprendizagem (onde estão errando mais nos quizzes?)
    2. Alunos em risco de desengajamento (baixa constância/streak)
    3. Sugestão de "Missão da Semana" para reengajar a turma.
    4. Proposta de quiz rápido de revisão para a próxima aula.
    
    Responda em formato JSON estruturado para o dashboard do professor.`;

    return await generateContentWrapper(prompt);
  },

  generateSimulatorScenario: async (tech: string) => {
    const prompt = `Crie um cenário interativo para um simulador de "${tech}".
    A estrutura deve ser JSON:
    {
      "title": "Título da Simulação",
      "description": "Descrição do problema técnico",
      "config": {
        "initialState": {},
        "targetState": {},
        "scripts": []
      },
      "feedback": {
        "success": "Mensagem de sucesso",
        "error": "Dica para o erro"
      }
    }`;

    return await generateContentWrapper(prompt);
  }
};
