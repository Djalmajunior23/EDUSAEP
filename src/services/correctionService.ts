import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface CorrectionPlan {
  id: string;
  studentId: string;
  examId: string;
  wrongQuestionsKeys: string[];
  competenciesToRetake: string[];
  aiExplanations: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: any;
}

export class CorrectionService {
  /**
   * Generates a "Plano de Acerto" (Correction Plan) based on specific errors in an exam.
   */
  public static async generatePlan(studentId: string, examId: string, results: any): Promise<string> {
    const wrongQuestions = results.filter((r: any) => !r.correct);
    const competencies = Array.from(new Set(wrongQuestions.map((q: any) => q.competency)));
    
    const plan = {
      studentId,
      examId,
      wrongQuestionsKeys: wrongQuestions.map((q: any) => q.id),
      competenciesToRetake: competencies,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      aiExplanations: "Plano gerado automaticamente com base nos erros identificados. Foco em refazer as questões marcadas com apoio do tutor."
    };

    const docRef = await addDoc(collection(db, 'correction_plans'), plan);
    return docRef.id;
  }
}
