import { db } from '../../firebase';
import { collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { StudentEvaluationResult, ClassEvaluationResult, StudentMetrics } from '../types';

export class FirestoreRepository {
  /**
   * Salva o snapshot da avaliação do aluno no database.
   */
  public static async saveStudentEvaluation(result: StudentEvaluationResult): Promise<void> {
    try {
      const ref = doc(db, 'studentRiskScores', result.studentId);
      
      // Persiste risk, comp, e last evaluation logic
      await setDoc(ref, {
        level: result.risk.level,
        score: result.risk.score,
        justifications: result.risk.justifications,
        criticalCompetencies: result.criticalCompetencies,
        nextActions: {
          teacher: result.nextTeacherAction,
          student: result.nextStudentAction
        },
        evaluatedAt: result.evaluatedAt
      }, { merge: true });

      // Salva as recomendações numa subcoleção ou collection dedicada
      for (const rec of result.recommendations) {
        const recRef = doc(collection(db, 'studentRiskScores', result.studentId, 'recommendations'));
        await setDoc(recRef, { ...rec, createdAt: new Date() });
      }

    } catch (err) {
      console.error('Erro ao salvar Student Evaluation no Firestore:', err);
    }
  }

  /**
   * Salva a avaliação sumarizada da turma.
   */
  public static async saveClassEvaluation(result: ClassEvaluationResult): Promise<void> {
    try {
      const ref = doc(db, 'classHealthSnapshots', result.classId);
      await setDoc(ref, {
        averageScore: result.averageScore,
        deliveryRate: result.deliveryRate,
        attendanceRate: result.attendanceRate,
        studentsAtRiskCount: result.studentsAtRiskCount,
        criticalCompetencies: result.criticalCompetencies,
        readinessScore: result.readinessScore,
        evaluatedAt: result.evaluatedAt
      }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar Class Evaluation no Firestore:', err);
    }
  }

  // Métodos adicionais poderiam ser adicionados para buscar métricas cruas (`StudentMetrics`)
  // a partir de atividades entregues, mas as Functions no backend geram essa métrica
  // a seguir simularemos a recepção dessa query.
}
