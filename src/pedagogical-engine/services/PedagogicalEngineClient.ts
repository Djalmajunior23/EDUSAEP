import { httpsCallable } from 'firebase/functions';
import { cloudFunctions } from '../../firebase';

export class PedagogicalEngineClient {
  /**
   * Triggers the Cloud Function to evaluate a specific student, with retry robustness.
   */
  public static async simulateStudentEvaluation(studentId: string, classId: string, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const runEvaluation = httpsCallable(cloudFunctions.instance, 'runStudentEvaluation');
        const result = await Promise.race([
          runEvaluation({ studentId, classId }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]) as any;
        return result.data;
      } catch (error: any) {
        attempt++;
        if (attempt > retries) {
          console.error("Error running student evaluation simulation after retries:", error);
          throw error;
        }
        console.warn(`SimulateStudentEvaluation attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Triggers the Cloud Function to run the full class engine, with retry robustness.
   */
  public static async simulateClassEngine(classId: string, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const runClassEngine = httpsCallable(cloudFunctions.instance, 'runPedagogicalEngineForClass');
        // Adiciona promise.race para evitar que trave se a resposta demorar mais de 15s
        const result = await Promise.race([
          runClassEngine({ classId }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]) as any;
        return result.data;
      } catch (error: any) {
        attempt++;
        if (attempt > retries) {
          console.error("Error running class engine simulation after retries:", error);
          throw error;
        }
        console.warn(`SimulateClassEngine attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff basic
      }
    }
  }
}
