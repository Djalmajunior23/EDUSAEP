import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PracticalLab, LabSubmission } from '../types';
import { gamificationService } from './gamificationService';

export const labService = {
  async createLab(lab: Omit<PracticalLab, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'labs'), {
      ...lab,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getAllLabs(): Promise<PracticalLab[]> {
    const q = query(collection(db, 'labs'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticalLab));
  },

  async getLab(labId: string): Promise<PracticalLab | null> {
    const docRef = doc(db, 'labs', labId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PracticalLab;
    }
    return null;
  },

  async submitLab(submission: Omit<LabSubmission, 'id' | 'status' | 'submittedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'lab_submissions'), {
      ...submission,
      status: 'pending',
      submittedAt: serverTimestamp()
    });

    // Award initial XP for submission
    await gamificationService.awardPoints(submission.studentId, 20, 'Entrega de Laboratório Prático');

    return docRef.id;
  },

  async getSubmissionsByStudent(studentId: string): Promise<LabSubmission[]> {
    const q = query(collection(db, 'lab_submissions'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabSubmission));
  }
};
