import { AIRequestContext } from '../types/ai.types';
import { generateContentWrapper, safeParseJson } from '../../services/geminiService';

export class QuestionGeneratorAgent {
  public static async generate(prompt: string, context: AIRequestContext): Promise<any> {
    const aiPrompt = `
    VOCÊ É UM ARQUITETO DE IA EDUCACIONAL DO EDUACORE (Gerador de Questões).
    Contexto do Usuário: ${context.userRole}
    Disciplina/Competência Alvo (se existir): ${context.competency || 'Não especificada'}
    Dificuldade: ${context.difficulty || 'Não especificada'}
    
    O usuário pediu: "${prompt}"
    
    Gere 1 a 3 questões com a seguinte estrutura JSON:
    [
      {
        "enunciado": "...",
        "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."},
        "correta": "A",
        "competencia": "...",
        "conhecimento": "...",
        "dificuldade": "Fácil|Médio|Difícil",
        "bloom": "Aplicação",
        "justificativa": "Porque...",
        "comentarios_distratores": {"B": "...", "C": "...", "D": "...", "E": "..."}
      }
    ]
    
    Retorne **SOMENTE** o Array JSON.
    `;
    
    const result = await generateContentWrapper({ prompt: aiPrompt, role: 'model', fast: false });
    return safeParseJson(result);
  }
}
