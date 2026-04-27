import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AILogEntry } from '../types/ai.types';

export class FirebaseAIService {
  public static async logRequest(entry: AILogEntry) {
    try {
      await addDoc(collection(db, 'historico_interacoes_ia'), {
        ...entry,
        createdAt: new Date()
      });
    } catch (e) {
      console.warn("Could not log AI request", e);
    }
  }

  public static async saveGeneratedContent(collectionName: string, content: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...content,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (e) {
      console.error("Failed to save content", e);
    }
    return null;
  }
}

