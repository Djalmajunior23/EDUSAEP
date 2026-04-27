import { AIRequestContext } from '../types/ai.types';
import { generateContentWrapper, safeParseJson } from '../../services/geminiService';

export class BIAgent {
  public static async generateInsights(data: any, context: AIRequestContext): Promise<any> {
    const aiPrompt = `
    VOCÊ É UM AGENTE DE BUSINESS INTELLIGENCE EDUCACIONAL DO EDUACORE.
    Contexto do Usuário: ${context.userRole}
    
    Analise os dados educacionais fornecidos:
    ${JSON.stringify({ data })}
    
    Gere insights baseados nas evoluções temporais, taxa de acerto e questões mais erradas (tudo em formato JSON estruturado com alertas, resumos e oportunidades).
    `;
    
    const result = await generateContentWrapper({ prompt: aiPrompt, role: 'model', fast: false });
    return safeParseJson(result);
  }
}
