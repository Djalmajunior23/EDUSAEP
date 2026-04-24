import { httpsCallable } from 'firebase/functions';
import { cloudFunctions } from '../../firebase';

export class PedagogicalEngineClient {
  /**
   * Triggers the Cloud Function to evaluate a specific student.
   */
  public static async simulateStudentEvaluation(studentId: string, classId: string) {
    try {
      const runEvaluation = httpsCallable(cloudFunctions.instance, 'runStudentEvaluation');
      const result = await runEvaluation({ studentId, classId });
      return result.data;
    } catch (error) {
      console.error("Error running student evaluation simulation:", error);
      throw error;
    }
  }

  /**
   * Triggers the Cloud Function to run the full class engine.
   */
  public static async simulateClassEngine(classId: string) {
    try {
      const runClassEngine = httpsCallable(cloudFunctions.instance, 'runPedagogicalEngineForClass');
      const result = await runClassEngine({ classId });
      return result.data;
    } catch (error) {
      console.error("Error running class engine simulation:", error);
      throw error;
    }
  }
}
