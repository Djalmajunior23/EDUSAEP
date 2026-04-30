
export interface PerformancePrediction {
  examType: string;
  predictedScore: number;
  confidence: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  keyFactors: string[];
  recommendations: string[];
  // 1. Métricas mais profundas
  engagementMetrics?: {
    studyTimeMinutes: number;
    platformAccessFrequency: 'HIGH' | 'MEDIUM' | 'LOW';
    completionRate: number;
  };
  // 2. Alertas preditivos
  riskLevel?: 'CRITICAL' | 'WARNING' | 'SAFE';
  evasionRiskScore?: number;
  // 3. Recomendação de trilhas
  adaptivePaths?: {
    pathId: string;
    title: string;
    reason: string;
  }[];
}

export class PredictionService {
  /**
   * Projects the student's performance on external assessments based on historical data.
   */
  public static async predictPerformance(studentId: string): Promise<PerformancePrediction[]> {
    // In a real scenario, this would use many historical points
    // For now, we simulate based on recent diagnostic trends
    
    const predictions: PerformancePrediction[] = [
      {
        examType: 'SAEB - Língua Portuguesa',
        predictedScore: 285, // Scale 0-500
        confidence: 0.85,
        trend: 'UP',
        keyFactors: [
          'Domínio crescente em Inferência Textual',
          'Consistência em gêneros argumentativos',
          'Melhora na gestão do tempo em blocos de 20 questões'
        ],
        recommendations: [
          'Reforçar análise de charge e ironia',
          'Simular blocos cronometrados de 45 minutos'
        ]
      },
      {
        examType: 'ENEM - Linguagens',
        predictedScore: 680, // Scale TRI
        confidence: 0.78,
        trend: 'STABLE',
        keyFactors: [
          'Alta acurácia em questões de nível Fácil/Médio',
          'Dificuldade residual em artes e vanguarda',
          'Engajamento constante nas trilhas de revisão'
        ],
        recommendations: [
          'Focar em artes plásticas brasileiras',
          'Praticar questões de literatura clássica'
        ]
      }
    ];

    return predictions;
  }

  /**
   * Calculates the probability of reaching a target score.
   */
  public static calculateTargetProbability(currentScore: number, targetScore: number, daysRemaining: number): number {
    const gap = targetScore - currentScore;
    if (gap <= 0) return 1;
    
    // Simple heuristic for probability
    const potentialGrowth = (daysRemaining / 30) * 15; // Assume 15 points growth potential per month
    const probability = Math.min(0.95, potentialGrowth / gap);
    
    return Math.max(0.05, probability);
  }
}
