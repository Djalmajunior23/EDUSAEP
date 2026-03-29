import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    console.log(`${type} criado com sucesso.`);
  } catch (error) {
    console.error(`Erro ao criar ${type}:`, error);
    throw error;
  }
}
