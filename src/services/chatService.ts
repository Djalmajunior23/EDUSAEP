import { GoogleGenAI } from "@google/genai";
import { DiagnosticResult, generateContentWrapper } from "./geminiService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function getChatResponse(
  messages: ChatMessage[],
  context: { diagnostic?: DiagnosticResult | null }
): Promise<string> {
  const systemInstruction = `Você é um Assistente Pedagógico Especialista do EduDiagnóstico SAEP.
Seu objetivo é ajudar professores e alunos a entenderem seus diagnósticos educacionais e planos de estudos.

CONTEXTO ATUAL DO DIAGNÓSTICO:
${context.diagnostic ? JSON.stringify(context.diagnostic) : "Nenhum diagnóstico carregado no momento."}

DIRETRIZES:
1. Seja encorajador, profissional e focado em dados.
2. Explique termos técnicos como "acurácia ponderada" ou "taxonomia de Bloom" de forma simples se perguntado.
3. Dê dicas práticas de estudo baseadas nas competências críticas identificadas.
4. Se o usuário perguntar algo fora do contexto educacional, gentilmente redirecione para o foco pedagógico.
5. Use Markdown para formatar suas respostas (negrito, listas, etc).`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
  });

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
