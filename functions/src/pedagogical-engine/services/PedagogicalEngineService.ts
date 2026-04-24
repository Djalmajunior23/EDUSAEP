import { PedagogicalEngine } from '../engines/PedagogicalEngine';
import { FirestorePedagogicalRepository } from '../repositories/FirestorePedagogicalRepository';
import { logger } from '../shared/logger';
import { v4 as uuidv4 } from 'uuid';

export class PedagogicalEngineService {
  private engine = new PedagogicalEngine();
  private repo = new FirestorePedagogicalRepository();

  async processStudent(studentId: string, classId: string) {
    logger.info(`Starting Pedagogical Engine cycle for student: ${studentId}`);
    
    // Busca e agrega dados reais do Firestore
    const performanceData = await this.repo.getRecentStudentData(studentId, classId);
    
    // In real app, fetch from analytics/grade-metrics mappings related to competences
    const mockedCompetencyMap = {
      'Raciocínio Lógico e Algoritmos': performanceData.recentScores[0] || 50,
      'Arquitetura de Software': performanceData.recentScores[1] || 80,
      'Estrutura de Dados': performanceData.recentScores[2] || 35, // Forçando critical para testes
    };

    const decisionPartial = this.engine.run(performanceData, mockedCompetencyMap);
    
    const decision = {
      id: uuidv4(),
      ...decisionPartial,
      timestamp: new Date()
    };

    // Salva o Snapshot / Decisão
    await this.repo.saveDecision(decision);
    logger.info(`Engine Generated Risk: ${decision.riskLevel} for student ${studentId}`);

    return decision;
  }

  async processClass(classId: string) {
    logger.info(`Aggregating Class Health data for class: ${classId}`);
    const students = await this.repo.getStudentsInClass(classId);
    let totalRiskCount = 0;
    
    for (const studentId of students) {
      const decision = await this.processStudent(studentId, classId);
      if (decision.riskLevel === 'HIGH' || decision.riskLevel === 'MEDIUM') {
        totalRiskCount++;
      }
    }

    const healthStatus = totalRiskCount > (students.length / 3) 
      ? 'CRITICAL' 
      : totalRiskCount > 0 ? 'ATTENTION' : 'HEALTHY';
    
    // Updates global class status
    await this.repo.updateClassHealth({
      classId,
      learningHealthScore: 100 - (totalRiskCount * 10), // Example dynamic scoring scale
      status: healthStatus,
      averageScore: 75,
      deliveryRate: 90,
      attendanceRate: 85,
      studentsAtRiskCount: totalRiskCount,
      timestamp: new Date()
    });
    
    logger.info(`Class ${classId} full mapping done. Target Health Status: ${healthStatus}`);
  }
}
