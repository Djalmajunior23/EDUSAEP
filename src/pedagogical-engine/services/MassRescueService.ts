import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { TeacherCopilotService } from './TeacherCopilotService';

export interface RescueSummary {
  competencyId: string;
  competencyName: string;
  studentCount: number;
  students: { id: string, name: string, score: number }[];
}

export class MassRescueService {
  /**
   * Identifica grupos de alunos para resgate baseados em competências críticas
   */
  public static async identifyRescueGroups(classId: string): Promise<RescueSummary[]> {
    const decisionsRef = collection(db, 'pedagogicalDecisions');
    const q = query(decisionsRef, where('classId', '==', classId), where('riskLevel', '==', 'HIGH'));
    const snap = await getDocs(q);
    
    const competencyMap: Record<string, { name: string, students: any[] }> = {};
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      const studentId = data.studentId;
      // In a real app we would fetch the student name here or have it in decision
      const studentName = data.studentName || `Aluno ${studentId.substring(0, 5)}`;
      
      data.competencies.forEach((comp: any) => {
        if (comp.level === 'CRITICAL') {
          if (!competencyMap[comp.id]) {
            competencyMap[comp.id] = { name: comp.name, students: [] };
          }
          competencyMap[comp.id].students.push({
            id: studentId,
            name: studentName,
            score: comp.score
          });
        }
      });
    });

    return Object.entries(competencyMap).map(([id, data]) => ({
      competencyId: id,
      competencyName: data.name,
      studentCount: data.students.length,
      students: data.students
    }));
  }

  /**
   * Executa uma ação de resgate em massa
   */
  public static async executeMassRescue(
    teacherId: string, 
    classId: string, 
    group: RescueSummary, 
    actionType: 'notification' | 'activity' | 'sa'
  ) {
    // 1. Log da ação de resgate
    const rescueActionRef = await addDoc(collection(db, 'mass_rescue_actions'), {
      teacherId,
      classId,
      competencyId: group.competencyId,
      competencyName: group.competencyName,
      studentCount: group.studentCount,
      actionType,
      timestamp: serverTimestamp()
    });

    // 2. Se for atividade, podemos gerar uma via IA e notificar
    let activityId = null;
    if (actionType === 'activity' || actionType === 'sa') {
      // Usamos o Copilot para sugerir algo rápido
      const result = await TeacherCopilotService.generateAndSavePBLActivity(teacherId, group.competencyName);
      activityId = result.pblId;
    }

    // 3. Notificar cada aluno
    const batchPromises = group.students.map(student => {
      return addDoc(collection(db, 'notifications'), {
        userId: student.id,
        title: '🚀 Plano de Resgate Ativado!',
        message: `Seu professor ativou um plano de resgate para a competência "${group.competencyName}". Vamos superar esse desafio?`,
        type: 'rescue',
        relatedResourceId: activityId,
        metadata: {
          teacherId,
          competencyId: group.competencyId
        },
        read: false,
        createdAt: serverTimestamp()
      });
    });

    await Promise.all(batchPromises);

    return { success: true, activityId };
  }
}
