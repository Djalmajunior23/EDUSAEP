import { AIIntent } from '../types/ai.types';

export class IntentClassifier {
  /**
   * Classifica a intenção do usuário com base no prompt usando regras simples ou uma chamada rápida de LLM (se necessário)
   * Para a versão atual, implementaremos um classificador heurístico baseado em palavras-chave para ser rápido e economizar tokens.
   */
  public static classify(prompt: string): AIIntent {
    const text = prompt.toLowerCase();
    
    // Regras de classificação
    if (text.includes('simulado') && text.includes('saep')) {
      return 'gerar_simulado';
    }
    
    if (text.includes('questõ') || text.includes('questao') || text.includes('questõe')) {
      return 'gerar_questoes';
    }
    
    if (text.includes('gabarito')) {
      return 'gerar_gabarito';
    }
    
    if (text.includes('plano de estudo') || text.includes('plano de nivelamento')) {
      return 'criar_plano_estudo';
    }
    
    if (text.includes('desempenho') || text.includes('análise de nota') || text.includes('analisar')) {
      return 'analisar_desempenho';
    }
    
    if (text.includes('aula invertida')) {
      return 'criar_aula_invertida';
    }
    
    if (text.includes('estudo de caso')) {
      return 'criar_estudo_caso';
    }
    
    if (text.includes('gamific')) {
      return 'criar_atividade_gamificada';
    }
    
    if (text.includes('intervenção') || text.includes('recomenda')) {
      return 'recomendar_intervencao';
    }
    
    if (text.includes('export') || text.includes('relatório')) {
      return 'exportar_conteudo';
    }

    if (text.includes('explica') || text.includes('dúvida') || text.includes('tutor')) {
      return 'explicar_conteudo';
    }
    
    return 'desconhecido';
  }
}
