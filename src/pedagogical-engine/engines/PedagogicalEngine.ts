import { StudentMetrics, StudentEvaluationResult, ClassEvaluationResult } from '../types';
import { RiskEngine } from './RiskEngine';
import { CompetencyEngine } from './CompetencyEngine';
import { RecommendationEngine } from './RecommendationEngine';

export class PedagogicalEngine {
  /**
   * Avalia individualmente um aluno, gerando risco, competências e recomendações.
   */
  public static evaluateStudent(studentId: string, metrics: StudentMetrics): StudentEvaluationResult {
    // 1. Calcular Risco
    const risk = RiskEngine.calculateRisk(metrics);

    // 2. Avaliar Competências
    const competencies = CompetencyEngine.evaluateCompetencies(metrics.competencyScores);

    // Identificar as críticas
    const criticalCompetencies = Object.entries(competencies)
      .filter(([_, data]) => data.level === 'CRITICAL')
      .map(([comp]) => comp);

    // 3. Gerar Recomendações
    const recommendations = RecommendationEngine.generateRecommendations(metrics, risk, criticalCompetencies);

    // Obter as próximas ações rápidas (1ª da lista de Teacher e 1ª de Student)
    const nextTeacherAction = recommendations.find(r => r.target === 'TEACHER')?.action || 'Continuar acompanhamento regular.';
    const nextStudentAction = recommendations.find(r => r.target === 'STUDENT')?.action || 'Manter o ritmo de estudos.';

    return {
      studentId,
      risk,
      competencies,
      criticalCompetencies,
      recommendations,
      nextTeacherAction,
      nextStudentAction,
      evaluatedAt: new Date()
    };
  }

  /**
   * Consolida as avaliações dos alunos numa visão de turma.
   */
  public static evaluateClass(classId: string, studentResults: StudentEvaluationResult[], allMetrics: StudentMetrics[]): ClassEvaluationResult {
    // Calcular médias e estatísticas consolidadas da turma
    let avgScore = 0;
    let avgDelivery = 0;
    let avgAttendance = 0;
    
    if (allMetrics.length > 0) {
      avgScore = allMetrics.reduce((acc, m) => acc + m.averageScore, 0) / allMetrics.length;
      avgDelivery = allMetrics.reduce((acc, m) => acc + m.deliveryRate, 0) / allMetrics.length;
      avgAttendance = allMetrics.reduce((acc, m) => acc + m.attendanceRate, 0) / allMetrics.length;
    }

    const studentsAtRiskCount = studentResults.filter(r => r.risk.level === 'HIGH' || r.risk.level === 'MEDIUM').length;

    // Agregadar competências críticas (mais comuns na turma)
    const critMap: Record<string, number> = {};
    for (const res of studentResults) {
      for (const crit of res.criticalCompetencies) {
        critMap[crit] = (critMap[crit] || 0) + 1;
      }
    }
    
    // Pegar as top 3 com mais alunos tendo dificuldades
    const criticalCompetencies = Object.entries(critMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([comp]) => comp);

    // Readiness score baseado em entrega, alunos de risco e competências
    let readinessScore = 100 
      - (studentsAtRiskCount / Math.max(studentResults.length, 1)) * 30 
      - (1 - avgDelivery) * 20;
    
    readinessScore = Math.max(Math.min(readinessScore, 100), 0);

    return {
      classId,
      averageScore: avgScore,
      deliveryRate: avgDelivery,
      attendanceRate: avgAttendance,
      studentsAtRiskCount,
      criticalCompetencies,
      readinessScore,
      recommendations: [], // Em um projeto full, recomendações para o planejamento da turma
      evaluatedAt: new Date()
    };
  }
}
