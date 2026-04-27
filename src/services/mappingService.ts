// src/services/mappingService.ts
import { Discipline } from '../types';
import { generateContentWrapper, safeParseJson, DEFAULT_CONFIG } from './geminiService';

export async function mapExternalDiscipline(
  externalName: string,
  availableDisciplines: Discipline[]
): Promise<{ disciplineId: string | null; confidence: number; reason: string }> {
  
  const response = await generateContentWrapper({
    model: "gemini-1.5-flash",
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

export async function mapExistingCompetencies(
  questions: any[],
  availableDisciplines: Discipline[]
): Promise<any[]> {
  if (!questions || questions.length === 0) return [];

  const response = await generateContentWrapper({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
            Você é um especialista em estruturação pedagógica.
            Eu tenho uma lista de perguntas não mapeadas e uma lista de disciplinas/competências existentes.
            
            Para CADA pergunta na lista, você deve:
            1. Analisar o conteúdo da pergunta (enunciado, alternativas, etc.) ou o campo que indica a competência desejada.
            2. Tentar encontrar a disciplina correspondente na lista "Disciplinas Cadastradas".
            3. Se encontrar uma correspondência (mesmo que o nome seja um pouco ambíguo, use o contexto para deduzir a mais provável), adicione os campos "competenciaId" e "competenciaNome" com os dados da disciplina encontrada.
            4. Se NÃO encontrar nenhuma correspondência lógica, crie/sugira uma nova competência adicionando "competenciaId": "nova_competencia" e "competenciaNome": "[Sua Sugestão de Nome]".
            
            Retorne A MESMA lista de perguntas, mas com as chaves "competenciaId" e "competenciaNome" devidamente preenchidas para cada objeto.

            Disciplinas Cadastradas: 
            ${JSON.stringify(availableDisciplines, null, 2)}
            
            Perguntas:
            ${JSON.stringify(questions, null, 2)}
            
            Você DEVE retornar um array JSON de perguntas.
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

  return safeParseJson(response.text, questions);
}
