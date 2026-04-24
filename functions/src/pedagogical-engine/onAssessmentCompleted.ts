import * as functions from 'firebase-functions';
import { PedagogicalEngineService } from './services/PedagogicalEngineService';
import { logger } from './shared/logger';

// Quando um simulado / SAEP em larga escala é finalizado
export const onAssessmentCompleted = functions.firestore
  .document('class_assessments/{assessmentId}')
  .onUpdate(async (change, context) => {
    const dataBefore = change.before.data();
    const dataAfter = change.after.data();

    // Quando o professor muda o status da avaliação inteira para fechada/completed
    if (dataBefore.status !== 'COMPLETED' && dataAfter.status === 'COMPLETED') {
      const { classId } = dataAfter;
      
      if (classId) {
        logger.info(`Assessment ${context.params.assessmentId} completed for class ${classId}. Running wide-scale pedagogical extraction.`);
        const service = new PedagogicalEngineService();
        await service.processClass(classId);
      }
    }
  });
