import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Question } from '../types/question';

export class AssessmentService {
  private static questionCollection = 'questions';

  static async createQuestion(questionData: Question) {
    return await addDoc(collection(db, this.questionCollection), {
      ...questionData,
      createdAt: serverTimestamp()
    });
  }

  static async getQuestionsByCompetency(competencyId: string) {
    const q = query(collection(db, this.questionCollection), where('competencyId', '==', competencyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  }
}
