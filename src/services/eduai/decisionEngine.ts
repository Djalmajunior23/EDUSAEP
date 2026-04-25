export type RoutingDecision = 'LOCAL_RESPONSE' | 'RAG_SEARCH' | 'OLLAMA_LOCAL' | 'CLOUD_AI' | 'N8N_AUTOMATION' | 'VISION_ANALYSIS';

export class DecisionEngine {
  decideRoute(input: string, context: any): RoutingDecision {
    if (input.toLowerCase().includes('imagem') || input.toLowerCase().includes('print')) {
      return 'VISION_ANALYSIS';
    }
    if (input.toLowerCase().includes('saep') || input.toLowerCase().includes('simulado')) {
      return 'CLOUD_AI';
    }
    return 'LOCAL_RESPONSE';
  }
}
export const decisionEngine = new DecisionEngine();
