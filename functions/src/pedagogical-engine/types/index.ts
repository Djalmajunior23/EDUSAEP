export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type CompetencyLevel = 'MASTERED' | 'DEVELOPING' | 'CRITICAL';

export interface StudentPerformance {
  studentId: string;
  classId: string;
  recentScores: number[];
  attendanceRate: number;
  deliveryRate: number;
}

export interface CompetencyEvaluation {
  id: string;
  name: string;
  score: number;
  level: CompetencyLevel;
}

export interface PedagogicalDecision {
  id: string;
  studentId: string;
  classId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  justifications: string[];
  competencies: CompetencyEvaluation[];
  recommendation: string;
  timestamp: any; // FirebaseFirestore.Timestamp
}

export interface ClassHealthSnapshot {
  classId: string;
  learningHealthScore: number;
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  averageScore: number;
  deliveryRate: number;
  attendanceRate: number;
  studentsAtRiskCount: number;
  timestamp: any;
}
