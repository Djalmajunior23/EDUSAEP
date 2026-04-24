export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type CompetencyLevel = 'MASTERED' | 'DEVELOPING' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface StudentMetrics {
  averageScore: number;
  deliveryRate: number;
  attendanceRate: number;
  recentAccessCount: number;
  performanceTrend: -1 | 0 | 1; // -1: dropping, 0: stable, 1: improving
  pendingActivitiesCount: number;
  missedDeadlinesCount: number;
  competencyScores: Record<string, number>;
}

export interface RiskAnalysis {
  level: RiskLevel;
  score: number;
  justifications: string[];
}

export interface CompetencyAnalysis {
  level: CompetencyLevel;
  score: number;
  suggestedActions: string[];
}

export interface Recommendation {
  target: 'TEACHER' | 'STUDENT';
  priority: PriorityLevel;
  action: string;
  context: string;
}

export interface StudentEvaluationResult {
  studentId: string;
  risk: RiskAnalysis;
  competencies: Record<string, CompetencyAnalysis>;
  criticalCompetencies: string[];
  recommendations: Recommendation[];
  nextTeacherAction: string;
  nextStudentAction: string;
  evaluatedAt: Date;
}

export interface ClassEvaluationResult {
  classId: string;
  averageScore: number;
  deliveryRate: number;
  attendanceRate: number;
  studentsAtRiskCount: number;
  criticalCompetencies: string[];
  readinessScore: number;
  recommendations: Recommendation[];
  evaluatedAt: Date;
}
