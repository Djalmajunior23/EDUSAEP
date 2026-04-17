import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ExamSubmission } from '../types';

export interface CompetencyData {
  name: string;
  score: number;
  totalAttempts: number;
  masteryLevel: 'Baixo' | 'Médio' | 'Alto';
}

export interface StudentRiskData {
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  factors: string[];
  averageGrade: number;
  deliveryRate: number;
  trend: 'Up' | 'Down' | 'Stable';
}

export interface StudentObservatoryData {
  competencies: CompetencyData[];
  riskData: StudentRiskData;
  recentGrades: { date: string; grade: number; title: string }[];
  pendingActivitiesCount: number;
}

export const observatoryService = {
  async getStudentObservatoryData(studentId: string): Promise<StudentObservatoryData> {
    // 1. Fetch Submissions
    const submissionsRef = collection(db, 'exam_submissions');
    const qSubmissions = query(submissionsRef, where('studentId', '==', studentId), orderBy('completedAt', 'asc'));
    const submissionsSnap = await getDocs(qSubmissions);
    
    const submissions = submissionsSnap.docs.map(doc => doc.data() as ExamSubmission);
    
    // Aggregations
    let totalGrade = 0;
    const recentGrades: { date: string; grade: number; title: string }[] = [];
    const competencyMap = new Map<string, { score: number; count: number }>();

    submissions.forEach(sub => {
      const grade = typeof sub.score === 'number' ? sub.score : 0;
      totalGrade += grade;
      if (sub.completedAt) {
        let dateStr = '';
        if (sub.completedAt instanceof Timestamp) {
          dateStr = sub.completedAt.toDate().toLocaleDateString();
        } else if (typeof sub.completedAt === 'string') {
          dateStr = new Date(sub.completedAt).toLocaleDateString();
        }
        recentGrades.push({ date: dateStr, grade, title: sub.resourceId || 'Atividade' });
      }

      // Simulate competency extraction from submission answers/skills (this needs domain adaptation)
      // For now, assuming submissions might have tags or we infer from the exam
      // In a real scenario, this would come from question_metrics or detailed item responses
    });

    // Mocking competencies for visualization if none exist from real data
    const competencies: CompetencyData[] = [
      { name: 'Interpretação de Texto', score: 85, totalAttempts: 12, masteryLevel: 'Alto' },
      { name: 'Lógica Matemática', score: 45, totalAttempts: 8, masteryLevel: 'Baixo' },
      { name: 'Pensamento Crítico', score: 70, totalAttempts: 15, masteryLevel: 'Médio' },
      { name: 'Resolução de Problemas', score: 60, totalAttempts: 10, masteryLevel: 'Médio' }
    ];

    const averageGrade = submissions.length > 0 ? totalGrade / submissions.length : 0;
    const deliveryRate = 80; // Placeholder for actual calculation involving assigned vs completed tasks
    
    // Calculate Trend
    let trend: 'Up' | 'Down' | 'Stable' = 'Stable';
    if (recentGrades.length >= 2) {
      const last = recentGrades[recentGrades.length - 1].grade;
      const prev = recentGrades[recentGrades.length - 2].grade;
      if (last > prev + 5) trend = 'Up';
      else if (last < prev - 5) trend = 'Down';
    }

    // Determine Risk
    let riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' = 'Baixo';
    const factors: string[] = [];
    if (averageGrade < 60) {
      riskLevel = 'Alto';
      factors.push('Média histórica abaixo da meta');
    }
    if (deliveryRate < 70) {
      riskLevel = riskLevel === 'Alto' ? 'Crítico' : 'Médio';
      factors.push('Taxa de entrega preocupante');
    }
    if (trend === 'Down') {
      factors.push('Tendência de queda nas últimas avaliações');
    }

    return {
      competencies,
      riskData: { riskLevel, averageGrade, deliveryRate, trend, factors },
      recentGrades: recentGrades.slice(-5), // Last 5
      pendingActivitiesCount: 3 // Placeholder
    };
  },

  async getClassObservatoryData(classId: string) {
    // Aggregation for class view
    return {
      studentsAtRisk: 4,
      averageDeliveryRate: 85,
      criticalCompetencies: ['Lógica Matemática', 'Física Dinâmica'],
      averageClassGrade: 72,
      recentAlerts: [
        { type: 'Erro Coletivo', message: '60% da turma errou a questão 4 do último simulado (Conceito de Frações)' }
      ]
    };
  }
};
