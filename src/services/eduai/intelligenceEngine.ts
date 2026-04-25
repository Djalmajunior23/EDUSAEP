import { contextEngine } from './contextEngine';
import { memoryEngine } from './memoryEngine';
import { decisionEngine } from './decisionEngine';
import { pedagogicalEngine } from './pedagogicalEngine';
import { localResponseEngine } from './localResponseEngine';
import { costOptimizer } from './costOptimizer';
import { db } from '../../firebase';
import { addDoc, collection } from 'firebase/firestore';

export class IntelligenceEngine {
  async process(input: string, userId: string): Promise<{ response: string, source: string }> {
    // 1. Context Engine
    const context = await contextEngine.getStudentContext(userId);
    
    // 2. Decision Engine
    const decision = decisionEngine.decideRoute(input, context);
    
    // 3. Cost Optimizer
    const costAnalysis = await costOptimizer.evaluate(decision);
    if (!costAnalysis.approved) {
       return { response: "Limite de custo excedido para esta operação.", source: "system" };
    }

    let generatedResponse = "";

    // 4. Routing
    if (decision === 'LOCAL_RESPONSE') {
      generatedResponse = localResponseEngine.process(input);
    } else {
      generatedResponse = "Simulação de resposta complexa usando " + decision;
    }

    // 5. Pedagogical Engine
    const adaptedResponse = pedagogicalEngine.adaptLanguage(generatedResponse, context.level);

    // 6. Memory Engine
    await memoryEngine.saveInteraction(userId, input, adaptedResponse, { decision, cost: costAnalysis.cost });

    // 7. Monitoramento (ai_usage_logs)
    await addDoc(collection(db, 'ai_usage_logs'), {
      user: userId,
      provider: decision === 'CLOUD_AI' ? 'Cloud' : 'Local',
      model: decision,
      cost: costAnalysis.cost,
      decision: decision,
      timestamp: new Date()
    });

    return { response: adaptedResponse, source: decision };
  }
}
export const intelligenceEngine = new IntelligenceEngine();
