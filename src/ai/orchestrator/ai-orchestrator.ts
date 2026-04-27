import { AIIntent, AIRequestContext, AIResponse } from '../types/ai.types';
import { IntentClassifier } from './intent-classifier';

// Import specialized agents (to be implemented)
import { QuestionGeneratorAgent } from '../agents/question-generator-agent';
import { SaepSimuladoAgent } from '../agents/simulado-saep-agent';
import { TutorAgent } from '../agents/tutor-agent';
import { PedagogicalPlannerAgent } from '../agents/pedagogical-planner-agent';
import { EvaluatorAgent } from '../agents/evaluator-agent';
import { BIAgent } from '../agents/bi-agent';

import { FirebaseAIService } from '../services/firebase-ai.service';

export class AIOrchestrator {
  public static async processRequest(prompt: string, context: AIRequestContext): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      // 1. Identificar a intenção
      const intent = IntentClassifier.classify(prompt);

      // 2. Orquestrar baseado na intenção
      let resultData: any = null;
      let message = 'Processado com sucesso.';

      switch (intent) {
        case 'gerar_questoes':
          resultData = await QuestionGeneratorAgent.generate(prompt, context);
          break;
          
        case 'gerar_simulado':
          resultData = await SaepSimuladoAgent.generate(prompt, context);
          break;
          
        case 'explicar_conteudo':
          resultData = await TutorAgent.explain(prompt, context);
          break;
          
        case 'criar_plano_estudo':
        case 'criar_aula_invertida':
        case 'criar_estudo_caso':
          resultData = await PedagogicalPlannerAgent.plan(prompt, intent, context);
          break;

        case 'analisar_desempenho':
          resultData = await EvaluatorAgent.analyzePerformance(prompt, {}, context);
          break;

        case 'consultar_dados':
          resultData = await BIAgent.generateInsights({}, context);
          break;
          
        default:
          message = 'Ainda não implementei uma IA para essa intenção específica. Estou aprendendo!';
      }

      // 3. Log de Uso (Firebase)
      await FirebaseAIService.logRequest({
        timestamp: new Date().toISOString(),
        userId: context.userId,
        userRole: context.userRole,
        intent,
        prompt,
        responseParams: resultData ? true : false,
        success: true
      });

      return {
        success: true,
        intent,
        data: resultData,
        message
      };

    } catch (error: any) {
      console.error('Erro no Orquestrador IA:', error);
      
      await FirebaseAIService.logRequest({
        timestamp: new Date().toISOString(),
        userId: context.userId,
        userRole: context.userRole,
        intent: 'desconhecido',
        prompt,
        responseParams: false,
        success: false
      });

      return {
        success: false,
        intent: 'desconhecido',
        error: error.message || 'Erro intero no Agente Central'
      };
    }
  }
}
