import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorService';

export async function createPedagogicalAlert(
  type: 'alertas_pedagogicos' | 'recomendacoes_pedagogicas',
  data: {
    recipientId: string;
    recipientEmail: string;
    content: string;
    priority: 'baixa' | 'média' | 'alta' | 'crítica';
  }
) {
  try {
    await addDoc(collection(db, type), {
      ...data,
      createdAt: serverTimestamp(),
      status: 'pendente'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, type);
    throw error;
  }
}
