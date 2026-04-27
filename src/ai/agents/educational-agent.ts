import { AIOrchestrator } from '../orchestrator/ai-orchestrator';
import { AIRequestContext, AIResponse } from '../types/ai.types';

export class EducationalAgent {
  /**
   * Ponto de entrada central do Agente de IA Educacional.
   */
  public static async execute(prompt: string, context: AIRequestContext): Promise<AIResponse> {
    
    // Safety check / Logging pre-execution could go here
    
    // Devolve para o Orquestrador Central
    return await AIOrchestrator.processRequest(prompt, context);
  }
}
