// src/services/recommendationService.ts
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './errorService';

export interface Recomendacao {
  aluno_id: string;
  tipo_recomendacao: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta';
  data_geracao: string;
}

export async function salvarRecomendacao(recomendacao: Recomendacao) {
  try {
    await addDoc(collection(db, 'recomendacoes_pedagogicas'), {
      ...recomendacao,
      status: 'pendente'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'recomendacoes_pedagogicas');
    throw error;
  }
}

export async function buscarRecomendacoesPorAluno(aluno_id: string) {
  try {
    const q = query(collection(db, 'recomendacoes_pedagogicas'), where('aluno_id', '==', aluno_id));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'recomendacoes_pedagogicas');
    throw error;
  }
}
