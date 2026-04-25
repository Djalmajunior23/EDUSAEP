import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { InteractiveQuiz, QuizAttempt } from '../types';
import { gamificationService } from './gamificationService';

export const quizService = {
  async createQuiz(quiz: Omit<InteractiveQuiz, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'quizzes'), {
      ...quiz,
      isActive: true,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getQuizzesByClass(classId: string): Promise<InteractiveQuiz[]> {
    const q = query(collection(db, 'quizzes'), where('classId', '==', classId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InteractiveQuiz));
  },

  async getQuiz(quizId: string): Promise<InteractiveQuiz | null> {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as InteractiveQuiz;
    }
    return null;
  },

  async submitAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'quiz_attempts'), {
      ...attempt,
      completedAt: serverTimestamp()
    });

    // Award points based on score
    const points = attempt.score * 10; // 10 points per correct answer
    const experience = attempt.score * 20; // 20 XP per correct answer
    await gamificationService.awardPoints(attempt.studentId, points, experience);
    
    // Check for quiz master achievement if they completed multiple quizzes
    // (Logic for checking count can be added here or in gamificationService)

    return docRef.id;
  },

  async getAttemptsByStudent(studentId: string): Promise<QuizAttempt[]> {
    const q = query(collection(db, 'quiz_attempts'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  }
};
