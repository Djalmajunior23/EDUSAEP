import { PedagogicalEngineService } from '../services/PedagogicalEngineService';
import { StudentMetrics } from '../types';

/**
 * Simulador de chamadas da Cloud Function
 * Onde estes métodos seriam engatados a eventos do Firebase ou via HTTPS.
 */

/**
 * onStudentActivitySubmited - Recalcular Risco
 * Cloud Function Trigger -> Firestore /activities/{activityId}/submissions/{submissionId}
 */
export const runStudentEvaluation = async (studentId: string, currentMetrics: StudentMetrics) => {
  try {
    return await PedagogicalEngineService.processStudentMetrics(studentId, currentMetrics);
  } catch (err) {
    console.error("Erro na execution da função runStudentEvaluation", err);
    throw err;
  }
};

/**
 * onClassMetricsUpdated - Recalcular a Turma
 * Cloud Function Scheduled (ex: daily) ou disparada manual
 */
export const runPedagogicalEngine = async (classId: string, studentsData: { id: string, metrics: StudentMetrics }[]) => {
  try {
    return await PedagogicalEngineService.processClassHealth(classId, studentsData);
  } catch (err) {
    console.error("Erro na execution da função runPedagogicalEngine", err);
    throw err;
  }
};
