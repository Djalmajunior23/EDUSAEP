import { RiskLevel, CompetencyEvaluation } from '../types';

export class RecommendationEngine {
  generateRecommendation(riskLevel: RiskLevel, competencies: CompetencyEvaluation[]): string {
    if (riskLevel === 'HIGH') {
      return 'Emergência Pedagógica: Intervenção direta necessária. Solicite uma reunião com o aluno e recomende a tutoria socrática baseada nas lacunas crônicas.';
    }
    
    const critical = competencies.filter(c => c.level === 'CRITICAL');
    if (critical.length > 0) {
      return `Criar atividades de recuperação de foco nas competências defasadas: ${critical.map(c => c.name).join(', ')}.`;
    }
    
    return 'Aluno com ritmo consolidado. Engajar em Desafios Avançados (Gêmeo Digital / Situações de Aprendizagem de Alta Complexidade).';
  }
}
