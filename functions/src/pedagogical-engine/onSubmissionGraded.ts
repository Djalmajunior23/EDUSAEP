import * as functions from 'firebase-functions';
import { PedagogicalEngineService } from './services/PedagogicalEngineService';
import { logger } from './shared/logger';

export const onSubmissionGraded = functions.firestore
  .document('submissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const dataBefore = change.before.data();
    const dataAfter = change.after.data();

    // Trigger de Automação: Executar análise pedagógica de risco apenas se acabou ser de cotado / gradeado
    if (dataBefore.isGraded !== dataAfter.isGraded && dataAfter.isGraded) {
      const { studentId, classId } = dataAfter;
      
      if (studentId && classId) {
        logger.info(`Automated hook trigger: Submission ${context.params.submissionId} graded for student ${studentId}. Initializing engine.`);
        const service = new PedagogicalEngineService();
        
        // Dispara a reancoragem de todo o perfil daquele aluno impactado em background
        await service.processStudent(studentId, classId);
      }
    }
  });
