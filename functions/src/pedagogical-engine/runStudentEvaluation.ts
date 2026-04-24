import * as functions from 'firebase-functions';
import { PedagogicalEngineService } from './services/PedagogicalEngineService';
import { logger } from './shared/logger';

export const runStudentEvaluation = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Obrigatório Autenticação.');
  
  const { studentId, classId } = data;
  if (!studentId || !classId) {
    throw new functions.https.HttpsError('invalid-argument', 'studentId e classId obrigatórios.');
  }

  logger.info(`Manual recalculation called for student: ${studentId}`);
  const service = new PedagogicalEngineService();
  const decision = await service.processStudent(studentId, classId);

  return { success: true, decision };
});
