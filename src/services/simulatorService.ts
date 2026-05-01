import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Simulator } from '../types';
import { gamificationService } from './gamificationService';

export const simulatorService = {
  async createSimulator(sim: Omit<Simulator, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'simulators'), {
      ...sim,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getAllSimulators(): Promise<Simulator[]> {
    const q = query(collection(db, 'simulators'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Simulator));
  },

  async finishSimulator(userId: string, simulatorId: string, xp: number): Promise<void> {
    await gamificationService.awardPoints(userId, xp, 'Simulador Concluído');
  }
};
