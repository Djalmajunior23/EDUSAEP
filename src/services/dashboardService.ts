// src/services/dashboardService.ts
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Discipline } from '../types';

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
  };
}

export async function getDashboardData(filters: { disciplineId?: string }): Promise<DashboardData> {
  // Placeholder logic for fetching data from Firestore
  // In a real implementation, you would query based on filters
  
  const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
  
  // Mock data for demonstration
  return {
    kpi: {
      mediaGeral: 75,
      totalAlunos: usersSnap.size || 45,
      taxaConclusao: 85,
      alunosEmRisco: 12
    },
    charts: {
      competencias: [
        { name: 'Lógica', value: 80 }, 
        { name: 'Modelagem', value: 70 },
        { name: 'Redes', value: 65 },
        { name: 'Segurança', value: 90 }
      ],
      evolucao: [
        { date: 'Jan', value: 60 }, 
        { date: 'Fev', value: 65 },
        { date: 'Mar', value: 75 },
        { date: 'Abr', value: 80 }
      ],
      radar: [
        { subject: 'Lógica', A: 80, B: 65, fullMark: 100 },
        { subject: 'Modelagem', A: 70, B: 60, fullMark: 100 },
        { subject: 'Redes', A: 65, B: 85, fullMark: 100 },
        { subject: 'Segurança', A: 90, B: 75, fullMark: 100 },
        { subject: 'Banco de Dados', A: 85, B: 70, fullMark: 100 },
      ],
      ranking: [
        { id: '1', name: 'Ana Silva', score: 95, trend: 'up' },
        { id: '2', name: 'Carlos Souza', score: 88, trend: 'stable' },
        { id: '3', name: 'Beatriz Lima', score: 82, trend: 'up' },
        { id: '4', name: 'João Pedro', score: 75, trend: 'down' },
        { id: '5', name: 'Mariana Costa', score: 60, trend: 'down' },
      ]
    }
  };
}
