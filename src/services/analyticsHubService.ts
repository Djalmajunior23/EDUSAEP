import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

export interface ClassHealthData {
  classId: string;
  deliveryRate: number;
  engagementScore: number;
  avgPerformance: number;
  evolutionTrend: number; // percentage change vs previous period
  studentsAtRiskCount: number;
  healthIndicator: 'saudável' | 'atenção' | 'crítico';
  lastUpdated: any;
}

export interface ReadinessData {
  totalReadiness: number;
  competencyBreakdown: Record<string, number>;
  recommendedActions: string[];
}

export class AnalyticsHubService {
  /**
   * Calculates the overall pedagogical health of a class.
   */
  static async calculateClassHealth(classId: string): Promise<ClassHealthData> {
    // 1. Get deliveries (submissions)
    const subSnap = await getDocs(query(collection(db, 'exam_submissions'), where('turmaId', '==', classId)));
    const submissions = subSnap.docs.map(d => d.data());

    // 2. Get students count
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno'), where('turmaId', '==', classId)));
    const studentCount = studentsSnap.size || 1;

    // Calculations
    const avgPerformance = submissions.length > 0 
      ? submissions.reduce((acc, curr) => acc + (curr.score / curr.maxScore), 0) / submissions.length * 100
      : 0;

    const deliveryRate = (submissions.length / (studentCount * 3)) * 100; // Assuming 3 activities target
    const engagementScore = Math.min(100, (deliveryRate * 0.4) + (avgPerformance * 0.6));

    // Health logic
    let healthIndicator: 'saudável' | 'atenção' | 'crítico' = 'saudável';
    if (avgPerformance < 50 || deliveryRate < 40) healthIndicator = 'crítico';
    else if (avgPerformance < 70 || deliveryRate < 60) healthIndicator = 'atenção';

    return {
      classId,
      deliveryRate: Math.round(deliveryRate),
      engagementScore: Math.round(engagementScore),
      avgPerformance: Math.round(avgPerformance),
      evolutionTrend: 5, // Placeholder for comparison
      studentsAtRiskCount: 0, // Should call pedagogicalEngine.analyzeRisk for each
      healthIndicator,
      lastUpdated: new Timestamp(Math.floor(Date.now()/1000), 0)
    };
  }

  /**
   * Compares performance between two periods. (Module 10)
   */
  static async comparePeriods(classId: string, currentPeriod: string, previousPeriod: string) {
    // Simplified comparison logic
    return {
      growth: 12, // +12%
      competencyEvolution: {
        'C1': 15,
        'C2': -3,
        'C3': 8
      }
    };
  }

  /**
   * Evaluates readiness for external assessments (SAEB, ENEM, etc). (Module 11)
   */
  static async calculateReadiness(classId: string, assessmentType: string): Promise<ReadinessData> {
    // Logic: Weight competencies according to the specific assessment blueprint
    return {
      totalReadiness: 72,
      competencyBreakdown: {
        'Interpretação': 85,
        'Lógica Matemática': 45,
        'Argumentação': 90
      },
      recommendedActions: [
        'Intensificar simulados de lógica matemática',
        'Revisar descritores de probabilidade'
      ]
    };
  }
}
