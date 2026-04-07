import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Question } from '../types';

export class QuestionService {
  private static collectionName = 'questions';

  static async createQuestion(questionData: Partial<Question>, userId: string, userRole: string): Promise<string> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem criar questões.");
    }

    // Basic validation
    if (!questionData.enunciado || !questionData.alternativas || questionData.alternativas.length < 2) {
      throw new Error("Dados inválidos: A questão deve ter um enunciado e pelo menos duas alternativas.");
    }

    const now = new Date().toISOString();
    const uniqueHash = this.generateHash(questionData.enunciado);

    const newQuestion = {
      ...questionData,
      questionUid: questionData.questionUid || `Q-${Math.random().toString(36).substr(2, 9)}`,
      contextoHash: uniqueHash,
      createdBy: userId,
      createdAt: serverTimestamp(),
      criadoEm: now,
      atualizadoEm: now,
      status: questionData.status || 'rascunho'
    };

    try {
      const docRef = await addDoc(collection(db, this.collectionName), newQuestion);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar questão:", error);
      throw new Error("Falha ao salvar a questão no banco de dados.");
    }
  }

  static async updateQuestion(questionId: string, questionData: Partial<Question>, userId: string, userRole: string): Promise<void> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem editar questões.");
    }

    try {
      const docRef = doc(db, this.collectionName, questionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error("Questão não encontrada.");
      }

      await updateDoc(docRef, {
        ...questionData,
        atualizadoEm: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao atualizar questão:", error);
      throw new Error("Falha ao atualizar a questão no banco de dados.");
    }
  }

  static async deleteQuestion(questionId: string, userRole: string): Promise<void> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem excluir questões.");
    }

    try {
      await deleteDoc(doc(db, this.collectionName, questionId));
    } catch (error) {
      console.error("Erro ao excluir questão:", error);
      throw new Error("Falha ao excluir a questão do banco de dados.");
    }
  }

  private static generateHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}
