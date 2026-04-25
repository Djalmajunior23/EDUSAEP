import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export class MemoryEngine {
  async saveInteraction(userId: string, input: string, output: string, metadata: any) {
    await addDoc(collection(db, 'ai_interactions'), {
      userId,
      input,
      output,
      timestamp: new Date(),
      ...metadata
    });
  }

  async getRecentInteractions(userId: string) {
    const q = query(collection(db, 'ai_interactions'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  }
}
export const memoryEngine = new MemoryEngine();
