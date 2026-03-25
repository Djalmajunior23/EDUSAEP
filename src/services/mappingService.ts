// src/services/mappingService.ts
import { Discipline } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function mapExternalDiscipline(
  externalName: string,
  availableDisciplines: Discipline[]
): Promise<{ disciplineId: string | null; confidence: number; reason: string }> {
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
            Você é um especialista em mapeamento de competências educacionais.
            Sua tarefa é associar o nome de uma disciplina/competência externa a uma lista de Disciplinas (Competências Principais) cadastradas no sistema.

            Nome Externo: "${externalName}"
            Disciplinas Cadastradas: ${JSON.stringify(availableDisciplines)}

            Retorne um JSON com:
            - disciplineId: O ID da disciplina correspondente ou null se não encontrar.
            - confidence: Um número de 0 a 1 indicando a confiança da associação.
            - reason: Uma breve explicação da escolha.
            `
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}
