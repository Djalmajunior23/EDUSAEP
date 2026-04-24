// src/services/dashboardService.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Discipline } from '../types';
import { handleFirestoreError, OperationType } from './errorService';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'aluno' | 'professor' | 'admin';
  xp?: number;
  level?: number;
  badges?: string[];
}

export const calculateLevel = (xp: number = 0) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXPForNextLevel = (level: number) => {
  return Math.pow(level, 2) * 100;
};

export interface DashboardData {
  kpi: {
    mediaGeral: number;
    totalAlunos: number;
    taxaConclusao: number;
    alunosEmRisco: number;
  };
  charts: {
    competencias: { name: string; value: number }[];
    evolucao: { date: string; value: number }[];
    radar: { subject: string; A: number; B: number; fullMark: number }[];
    ranking: { id: string; name: string; score: number; trend: 'up' | 'down' | 'stable' }[];
    // New fields for aggregated BI
    performancePorDisciplina: { name: string; media: number; alunos: number }[];
  };
}

export interface StudentRiskProfile {
  id: string;
  name: string;
  email: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  averageGrade: number;
  submissionRate: number;
  lastAccess?: any;
}

export interface ClassObservatoryData {
  studentsAtRisk: StudentRiskProfile[];
  engagementMetrics: {
    averageSubmissionRate: number;
    forumParticipation: number;
    averageGrade: number;
  };
  competencyHeatmap: { competency: string; score: number; status: 'critical' | 'attention' | 'good' }[];
  evolution: { period: string; classAverage: number }[];
}

export async function getClassObservatoryData(turmaId?: string): Promise<ClassObservatoryData> {
  try {
    let studentQuery = query(collection(db, 'users'), where('role', '==', 'aluno'));
    if (turmaId && turmaId !== 'all') {
      studentQuery = query(collection(db, 'users'), where('role', '==', 'aluno'), where('turmaId', '==', turmaId));
    }
    const usersSnap = await getDocs(studentQuery);
    
    // If no students match the class, return empty but valid structure
    if (usersSnap.empty) {
      return {
        studentsAtRisk: [],
        engagementMetrics: { averageSubmissionRate: 0, forumParticipation: 0, averageGrade: 0 },
        competencyHeatmap: [],
        evolution: []
      };
    }
    
    const activitiesSnap = await getDocs(collection(db, 'activities'));
    const activitySubmissionsSnap = await getDocs(collection(db, 'activity_submissions'));
    const forumCommentsSnap = await getDocs(collection(db, 'forum_comments'));
    
    const students = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const submissions = activitySubmissionsSnap.docs.map(d => d.data() as any);
    const forumComments = forumCommentsSnap.docs.map(d => d.data() as any);

    const totalActivities = activities.length;
    
    const studentsAtRisk: StudentRiskProfile[] = students.map(student => {
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      const gradedSubmissions = studentSubmissions.filter(s => s.status === 'graded');
      
      const avgGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / gradedSubmissions.length 
        : 0;
        
      const submissionRate = totalActivities > 0 ? (studentSubmissions.length / totalActivities) * 100 : 0;
      
      const reasons: string[] = [];
      if (avgGrade < 60) reasons.push('Baixo desempenho acadêmico');
      if (submissionRate < 70) reasons.push('Baixa taxa de entrega de atividades');
      
      const forumPosts = forumComments.filter(c => c.userId === student.id).length;
      if (forumPosts === 0 && totalActivities > 0) reasons.push('Baixa participação em fóruns');

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (reasons.length >= 2 || avgGrade < 50) riskLevel = 'high';
      else if (reasons.length === 1 || avgGrade < 70) riskLevel = 'medium';

      return {
        id: student.id,
        name: student.displayName || student.email,
        email: student.email,
        riskLevel,
        reasons,
        averageGrade: Math.round(avgGrade),
        submissionRate: Math.round(submissionRate),
        lastAccess: student.lastAccess
      };
    }).filter(s => s.riskLevel !== 'low').sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

    const averageSubmissionRate = students.length > 0 
      ? students.reduce((acc, curr) => {
          const subCount = submissions.filter(s => s.studentId === curr.id).length;
          return acc + (totalActivities > 0 ? (subCount / totalActivities) * 100 : 0);
        }, 0) / students.length
      : 0;

    const forumParticipation = students.length > 0 
      ? (new Set(forumComments.map(c => c.userId)).size / students.length) * 100 
      : 0;

    const averageGrade = submissions.filter(s => s.status === 'graded').length > 0
      ? submissions.filter(s => s.status === 'graded').reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.filter(s => s.status === 'graded').length
      : 0;

    return {
      studentsAtRisk,
      engagementMetrics: {
        averageSubmissionRate: Math.round(averageSubmissionRate),
        forumParticipation: Math.round(forumParticipation),
        averageGrade: Math.round(averageGrade)
      },
      competencyHeatmap: [
        { competency: 'Lógica de Programação', score: 45, status: 'critical' },
        { competency: 'Banco de Dados', score: 62, status: 'attention' },
        { competency: 'Arquitetura de Sistemas', score: 78, status: 'good' },
        { competency: 'Segurança da Informação', score: 55, status: 'critical' }
      ],
      evolution: [
        { period: 'Semana 1', classAverage: 65 },
        { period: 'Semana 2', classAverage: 68 },
        { period: 'Semana 3', classAverage: 62 },
        { period: 'Semana 4', classAverage: 72 }
      ]
    };
  } catch (error) {
    console.error("Error fetching observatory data:", error);
    throw error;
  }
}

export async function getDashboardData(filters: { disciplineId?: string }): Promise<DashboardData> {
  try {
    const submissionsSnap = await getDocs(collection(db, 'exam_submissions'));
    const disciplinesSnap = await getDocs(collection(db, 'disciplines'));
    
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile & { id: string }));
    let submissions = submissionsSnap.docs.map(d => d.data());
    const disciplines = disciplinesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline));

    // Filter submissions if disciplineId is provided
    if (filters.disciplineId) {
      submissions = submissions.filter(s => s.disciplineId === filters.disciplineId);
    }

    const totalAlunos = users.length;
    
    // Calculate media geral
    let totalScore = 0;
    let maxScoreTotal = 0;
    submissions.forEach(sub => {
      totalScore += sub.score || 0;
      maxScoreTotal += sub.maxScore || 100;
    });
    const mediaGeral = maxScoreTotal > 0 ? Math.round((totalScore / maxScoreTotal) * 100) : 0;

    // Calculate student scores
    const studentScores: Record<string, { total: number; max: number }> = {};
    submissions.forEach(sub => {
      if (!sub.studentId) return;
      if (!studentScores[sub.studentId]) {
        studentScores[sub.studentId] = { total: 0, max: 0 };
      }
      studentScores[sub.studentId].total += sub.score || 0;
      studentScores[sub.studentId].max += sub.maxScore || 100;
    });

    let alunosEmRisco = 0;
    Object.values(studentScores).forEach(s => {
      if (s.max > 0 && (s.total / s.max) * 100 < 60) {
        alunosEmRisco++;
      }
    });

    // Performance por Disciplina (Aggregated BI)
    const performancePorDisciplina = disciplines.map(d => {
      // For this specific chart, we use all submissions but group by discipline
      const allSubmissions = submissionsSnap.docs.map(doc => doc.data());
      const subD = allSubmissions.filter(s => s.disciplineId === d.id);
      let dScore = 0;
      let dMax = 0;
      subD.forEach(s => {
        dScore += s.score || 0;
        dMax += s.maxScore || 100;
      });
      return {
        name: d.name,
        media: dMax > 0 ? Math.round((dScore / dMax) * 100) : 0,
        alunos: new Set(subD.map(s => s.studentId)).size
      };
    });

    // Ranking
    const ranking = users.map(u => {
      const s = studentScores[u.id];
      const avgScore = s && s.max > 0 ? (s.total / s.max) * 100 : 0;
      const finalScore = Math.round(avgScore);
      return {
        id: u.id,
        name: u.displayName || u.email || 'Aluno',
        score: finalScore,
        trend: finalScore > 70 ? 'up' : finalScore < 50 ? 'down' : 'stable' as 'up' | 'down' | 'stable'
      };
    }).sort((a, b) => b.score - a.score);

    return {
      kpi: {
        mediaGeral: mediaGeral,
        totalAlunos: totalAlunos,
        taxaConclusao: totalAlunos > 0 ? Math.round((new Set(submissions.map(s => s.studentId)).size / totalAlunos) * 100) : 0,
        alunosEmRisco: alunosEmRisco
      },
      charts: {
        competencias: [
          { name: 'Lógica', value: 80 }, 
          { name: 'Modelagem', value: 70 },
          { name: 'Redes', value: 65 },
          { name: 'Segurança', value: 90 }
        ],
        evolucao: (() => {
          const baseData = [
            { date: 'Out', value: 55 },
            { date: 'Nov', value: 58 },
            { date: 'Dez', value: 50 },
            { date: 'Jan', value: 60 },
            { date: 'Fev', value: 65 },
            { date: 'Mar', value: mediaGeral || 80 }
          ];
          
          let maxVariation = 0;
          let maxVariationIndex = -1;
          
          for (let i = 1; i < baseData.length; i++) {
            const variation = Math.abs(baseData[i].value - baseData[i-1].value);
            if (variation > maxVariation) {
              maxVariation = variation;
              maxVariationIndex = i;
            }
          }
          
          return baseData.map((item, index) => ({
            ...item,
            isMaxVariation: index === maxVariationIndex
          }));
        })(),
        radar: [
          { subject: 'Lógica', A: 80, B: 65, fullMark: 100 },
          { subject: 'Modelagem', A: 70, B: 60, fullMark: 100 },
          { subject: 'Redes', A: 65, B: 85, fullMark: 100 },
          { subject: 'Segurança', A: 90, B: 75, fullMark: 100 },
          { subject: 'Banco de Dados', A: 85, B: 70, fullMark: 100 },
        ],
        ranking: ranking,
        performancePorDisciplina: performancePorDisciplina
      }
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'dashboard_data');
    return {
      kpi: { mediaGeral: 75, totalAlunos: 45, taxaConclusao: 85, alunosEmRisco: 12 },
      charts: {
        competencias: [{ name: 'Lógica', value: 80 }, { name: 'Modelagem', value: 70 }],
        evolucao: (() => {
          const baseData = [
            { date: 'Out', value: 55 },
            { date: 'Nov', value: 58 },
            { date: 'Dez', value: 50 },
            { date: 'Jan', value: 60 },
            { date: 'Fev', value: 65 },
            { date: 'Mar', value: 75 }
          ];
          
          let maxVariation = 0;
          let maxVariationIndex = -1;
          
          for (let i = 1; i < baseData.length; i++) {
            const variation = Math.abs(baseData[i].value - baseData[i-1].value);
            if (variation > maxVariation) {
              maxVariation = variation;
              maxVariationIndex = i;
            }
          }
          
          return baseData.map((item, index) => ({
            ...item,
            isMaxVariation: index === maxVariationIndex
          }));
        })(),
        radar: [{ subject: 'Lógica', A: 80, B: 65, fullMark: 100 }],
        ranking: [{ id: '1', name: 'Ana Silva', score: 95, trend: 'up' }],
        performancePorDisciplina: [{ name: 'Lógica', media: 80, alunos: 10 }]
      }
    };
  }
}

export async function getClassCompetencyAverages(): Promise<{ competency: string; average: number }[]> {
  try {
    const submissionsSnap = await getDocs(collection(db, 'exam_submissions'));
    const submissions = submissionsSnap.docs.map(d => d.data());
    
    const competencyStats: Record<string, { totalAccuracy: number; count: number }> = {};
    
    submissions.forEach(sub => {
      if (sub.competencyResults) {
        Object.entries(sub.competencyResults).forEach(([comp, res]: [string, any]) => {
          if (!competencyStats[comp]) {
            competencyStats[comp] = { totalAccuracy: 0, count: 0 };
          }
          competencyStats[comp].totalAccuracy += res.acuracia || 0;
          competencyStats[comp].count += 1;
        });
      }
    });
    
    return Object.entries(competencyStats).map(([competency, stats]) => ({
      competency,
      average: stats.count > 0 ? (stats.totalAccuracy / stats.count) * 100 : 0
    }));
  } catch (error) {
    console.warn("Could not fetch class competency averages:", error);
    return [];
  }
}
