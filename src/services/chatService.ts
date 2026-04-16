import { GoogleGenAI } from "@google/genai";
import { DiagnosticResult, generateContentWrapper } from "./geminiService";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function getChatResponse(
  messages: ChatMessage[],
  context: { diagnostic?: DiagnosticResult | null; mode?: 'default' | 'socratic'; questionContext?: string }
): Promise<string> {
  const isSocratic = context.mode === 'socratic';

  const systemInstruction = isSocratic 
    ? `Você é o Tutor Socrático do EDUSAEP. Sua missão NÃO é dar respostas prontas, mas guiar o aluno através de perguntas provocativas.
       Quando um aluno tiver dúvida sobre uma questão ou conceito:
       1. Faça perguntas que o levem a identificar o erro de lógica ou conceito por conta própria.
       2. Use andaimes (scaffolding): comece com perguntas amplas e vá estreitando.
       3. Se ele persistir no erro, aponte uma contradição no raciocínio dele.
       4. Parabenize não apenas o acerto, mas o processo de descoberta.
       
       CONTEXTO DA QUESTÃO: ${context.questionContext || "Conceitos gerais de aprendizagem"}
       `
    : `Você é um Assistente Pedagógico Especialista do EDUSAEP.
       Seu objetivo é ajudar professores e alunos a entenderem seus diagnósticos educacionais e planos de estudos.

       CONTEXTO ATUAL DO DIAGNÓSTICO:
       ${context.diagnostic ? JSON.stringify(context.diagnostic) : "Nenhum diagnóstico carregado no momento."}

       DIRETRIZES:
       1. Seja encorajador, profissional e focado em dados.
       2. Explique termos técnicos de forma simples.
       3. Dê dicas práticas de estudo.
       4. Redirecione para o foco pedagógico se necessário.
       `;

  // We only send the last message to the model for simplicity in this stateless wrapper,
  // but we could send the full history if needed.
  // For a better experience, we'll send the history.
  
  const history = messages.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const lastMessage = messages[messages.length - 1].text;

  const response = await generateContentWrapper({
    model: "gemini-3-flash-preview",
    contents: [
      { role: "user", parts: [{ text: systemInstruction }] },
      ...history,
      { role: "user", parts: [{ text: lastMessage }] }
    ],
  });

  return response.text || "Desculpe, não consegui processar sua pergunta.";
}
