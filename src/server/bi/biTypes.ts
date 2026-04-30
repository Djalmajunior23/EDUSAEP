export interface ClassPerformanceRecord {
  studentId: string;
  studentName?: string;
  competencyId: string;
  competencyName?: string;
  mastery: number;
  score: number;
  attempts?: number;
  averageTime?: number;
}

export interface ClassBIReport {
  classId: string;
  generalAverage: number;
  criticalCompetencies: string[];
  studentsAtRisk: string[];
  strengths: string[];
  recommendations: string[];
  executiveSummary: string;
}
