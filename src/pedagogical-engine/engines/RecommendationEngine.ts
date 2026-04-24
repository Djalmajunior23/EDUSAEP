import { Recommendation, RiskAnalysis, PriorityLevel, StudentMetrics } from '../types';

export class RecommendationEngine {
  public static generateRecommendations(
    metrics: StudentMetrics, 
    risk: RiskAnalysis, 
    criticalCompetencies: string[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recomendação baseada no risco geral
    if (risk.level === 'HIGH') {
      recommendations.push({
        target: 'TEACHER',
        priority: 'HIGH',
        action: 'Agendar conversa individual e estabelecer plano de contingência.',
        context: 'Risco sistêmico e possibilidade de evasão.'
      });
      recommendations.push({
        target: 'STUDENT',
        priority: 'HIGH',
        action: 'Focar apenas nas atividades mais críticas listadas no painel de prioridades.',
        context: 'Necessidade de recuperação rápida.'
      });
    } else if (risk.level === 'MEDIUM') {
      recommendations.push({
        target: 'TEACHER',
        priority: 'MEDIUM',
        action: 'Acionar alertas de reengajamento e acompanhar a próxima entrega.',
        context: 'Risco de queda no rendimento geral.'
      });
    }

    // Recomendações baseadas nas competências críticas
    if (criticalCompetencies.length > 0) {
      const comps = criticalCompetencies.join(', ');
      recommendations.push({
        target: 'TEACHER',
        priority: 'HIGH',
        action: `Enviar material de nivelamento sobre: ${comps}.`,
        context: 'Evitar avanço com lacunas estruturais.'
      });
      recommendations.push({
        target: 'STUDENT',
        priority: 'HIGH',
        action: `Realizar os exercícios de base recomendados em: ${comps}.`,
        context: 'Construir a base antes de atividades mais difíceis.'
      });
    }

    // Pendências
    if (metrics.pendingActivitiesCount > 2) {
      recommendations.push({
        target: 'STUDENT',
        priority: 'MEDIUM',
        action: 'Organize uma agenda semanal apenas para as atividades em atraso.',
        context: 'Foco na regularização das pendências.'
      });
    }

    return recommendations;
  }
}
