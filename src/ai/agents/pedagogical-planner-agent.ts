import { AIRequestContext, AIIntent } from '../types/ai.types';
import { generateContentWrapper, safeParseJson } from '../../services/geminiService';

export class PedagogicalPlannerAgent {
  public static async plan(prompt: string, intent: AIIntent, context: AIRequestContext): Promise<any> {
    
    let instructions = '';
    
    if (intent === 'criar_plano_estudo') {
      instructions = `
      Crie um Plano de Estudo com:
      {
        "conteudoRevisar": "...", 
        "competenciaRelacionada": "...", 
        "explicacaoResumida": "...", 
        "exerciciosRecomendados": ["..."], 
        "materiaisSugeridos": ["..."], 
        "prazoSugerido": "...", 
        "prioridade": "Alta|Média|Baixa", 
        "justificativaPedagogica": "..." 
      }
      `;
    } else if (intent === 'criar_aula_invertida') {
      instructions = `
      Crie uma Aula Invertida com:
      {
        "tema": "...",
        "objetivos": ["..."],
        "materialPreAula": [{"tipo": "video|texto", "descricao": "...", "link": "..."}],
        "atividadesSala": [{"duracao": "...", "atividade": "...", "descricao": "..."}],
        "avaliacaoFomatica": "..."
      }
      `;
    } else if (intent === 'criar_estudo_caso') {
      instructions = `
      Crie um Estudo de Caso Prático com:
      {
        "titulo": "...",
        "contextoPratico": "...",
        "problemaCentral": "...",
        "questoesGuia": ["..."],
        "competenciasDesenvolvidas": ["..."]
      }
      `;
    }

    const aiPrompt = `
    VOCÊ É UM PLANEJADOR PEDAGÓGICO DE IA DO EDUACORE.
    
    O usuário pediu: "${prompt}"
    
    ${instructions}
    
    Retorne **SOMENTE** JSON válido para o formato solicitado.
    `;
    
    const result = await generateContentWrapper({ prompt: aiPrompt, role: 'model', fast: false });
    return safeParseJson(result);
  }
}
