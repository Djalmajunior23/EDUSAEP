import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';

export interface AIPromptLog {
  moduleName: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  promptText: string;
  responseRaw: string;
  userId: string;
  timestamp: any;
}

export interface AIExplanation {
  recommendationId: string;
  reasoning: string;
  dataUsed: string[];
  competencyFactors: Record<string, number>;
  confidence: number;
}

export class AIGovernanceService {
  /**
   * Logs an AI interaction for audit and costing. (Module 16)
   */
  static async lgoInteraction(log: Omit<AIPromptLog, 'timestamp'>) {
    await addDoc(collection(db, 'ai_prompt_logs'), {
      ...log,
      timestamp: serverTimestamp()
    });
  }

  /**
   * Records the transparency/explanation for an AI decision. (Module 4)
   */
  static async recordExplanation(explanation: AIExplanation) {
    await addDoc(collection(db, 'ai_explanations'), {
      ...explanation,
      timestamp: serverTimestamp()
    });
  }

  /**
   * Calculates cost based on tokens.
   */
  static calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates: Record<string, { in: number; out: number }> = {
      'gemini-1.5-flash': { in: 0.000125, out: 0.000375 }, // per 1k tokens
      'gemini-1.5-pro': { in: 0.0035, out: 0.0105 }
    };

    const rate = rates[model] || rates['gemini-1.5-flash'];
    return ((inputTokens / 1000) * rate.in) + ((outputTokens / 1000) * rate.out);
  }
}
