import { AIRequestContext, AIIntent } from '../types/ai.types';
import { generateContentWrapper, safeParseJson } from '../../services/geminiService';

export class EvaluatorAgent {
  public static async analyzePerformance(studentData: any, classData: any, context: AIRequestContext): Promise<any> {
    const aiPrompt = `
    VOCÊ É UM AVALIADOR PEDAGÓGICO DE IA DO EDUACORE.
    
    Analise o desempenho atual:
    ${JSON.stringify({ studentData, classData })}
    
    Retorne um JSON com:
    {
      "taxaAcerto": 0.85,
      "pontosCriticos": ["..."],
      "competenciasFrageis": ["..."],
      "relatorioTurma": "...",
      "planoIntervencao": "..."
    }
    `;
    
    const result = await generateContentWrapper({ prompt: aiPrompt, role: 'model', fast: false });
    return safeParseJson(result);
  }
}
