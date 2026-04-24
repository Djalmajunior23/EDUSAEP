import * as functions from 'firebase-functions';
import { PedagogicalEngineService } from './services/PedagogicalEngineService';
import { logger } from './shared/logger';

// Callable Trigger manual or via n8n/Automation
export const runPedagogicalEngineForClass = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requisito obrigatório: O solicitante precisa estar logado na plataforma.');
  }
  
  const { classId } = data;
  if (!classId) {
    throw new functions.https.HttpsError('invalid-argument', 'O classId da turma a ser processada deve ser fornecido.');
  }

  logger.info(`Call initiated to run Class Pedagogical Engine. classId: ${classId}`);
  
  const service = new PedagogicalEngineService();
  await service.processClass(classId);

  return { 
    success: true, 
    processedClassId: classId,
    message: 'Processamento pedagógico em lote finalizado para a turma apontada.'
  };
});
