import { RiskEngine } from './RiskEngine';
import { CompetencyEngine } from './CompetencyEngine';
import { RecommendationEngine } from './RecommendationEngine';
import { StudentPerformance, PedagogicalDecision } from '../types';

export class PedagogicalEngine {
  private riskEngine = new RiskEngine();
  private compEngine = new CompetencyEngine();
  private recEngine = new RecommendationEngine();

  run(
    studentData: StudentPerformance, 
    competenciesMap: Record<string, number>
  ): Omit<PedagogicalDecision, 'id' | 'timestamp'> {
    
    const { riskScore, riskLevel, justifications } = this.riskEngine.calculateRisk(studentData);
    const competencies = this.compEngine.evaluateCompetencies(competenciesMap);
    const recommendation = this.recEngine.generateRecommendation(riskLevel, competencies);

    return {
      studentId: studentData.studentId,
      classId: studentData.classId,
      riskLevel,
      riskScore,
      justifications,
      competencies,
      recommendation
    };
  }
}
