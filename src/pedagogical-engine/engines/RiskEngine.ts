import { StudentMetrics, RiskAnalysis, RiskLevel } from '../types';

export class RiskEngine {
  public static calculateRisk(metrics: StudentMetrics): RiskAnalysis {
    let score = 0;
    const justifications: string[] = [];

    // Avaliação de Engajamento e Entrega
    if (metrics.deliveryRate < 0.5) {
      score += 40;
      justifications.push('Baixa taxa de entrega de atividades (< 50%)');
    } else if (metrics.deliveryRate < 0.7) {
      score += 20;
      justifications.push('Entrega de atividades irregular (< 70%)');
    }

    // Avaliação de Média / Desempenho
    if (metrics.averageScore < 5) {
      score += 35;
      justifications.push('Média de notas crítica (< 5)');
    } else if (metrics.averageScore < 7) {
      score += 15;
      justifications.push('Média de notas em nível de atenção (< 7)');
    }

    // Avaliação de Prazos e Presença
    if (metrics.missedDeadlinesCount > 3) {
      score += 15;
      justifications.push('Alto volume de prazos perdidos');
    }

    if (metrics.attendanceRate < 0.75) {
      score += 10;
      justifications.push('Frequência abaixo do mínimo esperado (< 75%)');
    }

    // Tendência de desempenho
    if (metrics.performanceTrend === -1) {
      score += 10;
      justifications.push('Tendência geral de queda no desempenho recente');
    }

    // Classificação
    let level: RiskLevel = 'LOW';
    if (score >= 60) {
      level = 'HIGH';
    } else if (score >= 30) {
      level = 'MEDIUM';
    }

    // Normaliza score
    const finalScore = Math.min(score, 100);

    return {
      level,
      score: finalScore,
      justifications
    };
  }
}
