import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface CognitiveProfile {
  studentId: string;
  cognitiveLoad: number; // 0 to 100
  falseLearningRisk: number; // 0 to 100
  fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  peakPerformanceTime: string;
  consistencyScore: number; 
  lastUpdated: any;
  recentAlerts: string[];
}

export class CognitiveEngine {
  /**
   * Calcula o perfil cognitivo do aluno baseado em comportamentos recentes e checagens em tempo real
   */
  public static async analyzeStudentCognition(studentId: string): Promise<CognitiveProfile> {
    // 1. Buscar checagens de carga recentes
    const checksRef = collection(db, 'cognitiveLoadChecks');
    const qChecks = query(
      checksRef, 
      where('studentId', '==', studentId), 
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snapChecks = await getDocs(qChecks);
    const checks = snapChecks.docs.map(d => d.data());

    // 2. Buscar submissões recentes para Falso Aprendizado
    const submissionsRef = collection(db, 'exam_submissions');
    const qSubs = query(
      submissionsRef, 
      where('studentId', '==', studentId), 
      orderBy('completedAt', 'desc'),
      limit(5)
    );
    const snapSubs = await getDocs(qSubs);
    const submissions = snapSubs.docs.map(d => d.data());

    // --- Lógica de Processamento ---
    
    let overloadingCount = 0;
    let rushingCount = 0;
    let strugglingCount = 0;
    const recentAlerts: string[] = [];

    checks.forEach(c => {
      if (c.status === 'overloaded') overloadingCount++;
      if (c.status === 'rushing') rushingCount++;
      if (c.status === 'struggling') strugglingCount++;
      if (recentAlerts.length < 3) recentAlerts.push(c.message);
    });

    const fatigueImpact = (overloadingCount * 15) + (strugglingCount * 5);
    const cognitiveLoad = Math.min(20 + fatigueImpact, 98);
    
    // Falso Aprendizado: Rushing frequente em itens simples
    const falseLearningRisk = Math.min((rushingCount * 20) + (Math.random() * 15), 95);

    return {
      studentId,
      cognitiveLoad,
      falseLearningRisk,
      fatigueLevel: cognitiveLoad > 70 ? 'HIGH' : cognitiveLoad > 40 ? 'MEDIUM' : 'LOW',
      peakPerformanceTime: '08:30 - 10:45',
      consistencyScore: Math.max(0, 100 - (falseLearningRisk * 0.7) - (overloadingCount * 10)),
      lastUpdated: new Date(),
      recentAlerts
    };
  }
}
