// src/services/mappingService.ts
import { Discipline } from '../types';
import { generateContentWrapper, safeParseJson, DEFAULT_CONFIG } from './geminiService';

export async function mapExternalDiscipline(
  externalName: string,
  availableDisciplines: Discipline[]
): Promise<{ disciplineId: string | null; confidence: number; reason: string }> {
  
  const response = await generateContentWrapper({
    model: "gemini-3-flash-preview",
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
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, { disciplineId: null, confidence: 0, reason: "Erro ao processar" });
}
