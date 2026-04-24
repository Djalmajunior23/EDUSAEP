import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Question } from '../types';
import { AIService } from './aiService';

export class QuestionService {
  private static collectionName = 'questions';

  static async generateDiscursiveQuestion(
    topic: string,
    difficulty: 'fácil' | 'médio' | 'difícil',
    context: string,
    userId: string,
    userRole: string
  ): Promise<Partial<Question>> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem gerar questões com IA.");
    }

    const prompt = `
      Gere uma questão discursiva sobre o tema: "${topic}".
      Dificuldade: ${difficulty}.
      Contexto/Referência: "${context}".
      
      A resposta deve estar em formato JSON estrito com os campos:
      - enunciado (string)
      - respostaEsperada (string)
      - criteriosAvaliacao (string[]) - mínimo 3 critérios
      - dificuldade (deve ser: 'fácil', 'médio' ou 'difícil')
      - tipoQuestao (deve ser: 'discursiva')
    `;

    const response = await AIService.generatePedagogicalContent(prompt, userRole, true);
    
    try {
      const generatedQuestion: Partial<Question> = JSON.parse(response);
      return generatedQuestion;
    } catch (e) {
      console.error("Erro ao parsear JSON da IA:", response);
      throw new Error("Erro ao estruturar a questão gerada pela IA.");
    }
  }

  // ... (validateQuestionPayload e outros métodos permanecem abaixo)

  private static validateQuestionPayload(data: Partial<Question>, isUpdate: boolean = false) {
    // Enunciado
    if (!isUpdate || data.enunciado !== undefined) {
      if (!data.enunciado || typeof data.enunciado !== 'string' || data.enunciado.trim() === '') {
        throw new Error("O campo 'enunciado' é obrigatório e não pode estar vazio.");
      }
    }

    if (data.tipoQuestao === 'discursiva') {
      // Validação específica para questões discursivas
      if (!isUpdate || data.respostaEsperada !== undefined) {
        if (!data.respostaEsperada || typeof data.respostaEsperada !== 'string' || data.respostaEsperada.trim() === '') {
          throw new Error("O campo 'respostaEsperada' é obrigatório para questões discursivas.");
        }
      }
      if (!isUpdate || data.criteriosAvaliacao !== undefined) {
        if (!data.criteriosAvaliacao || !Array.isArray(data.criteriosAvaliacao) || data.criteriosAvaliacao.length === 0) {
          throw new Error("A questão discursiva deve ter critérios de avaliação definidos.");
        }
      }
    } else {
      // Alternativas (apenas para múltipla escolha)
      if (!isUpdate || data.alternativas !== undefined) {
        if (!data.alternativas || !Array.isArray(data.alternativas) || data.alternativas.length < 2) {
          throw new Error("A questão deve ter pelo menos duas alternativas válidas.");
        }
        data.alternativas.forEach((alt, index) => {
          if (!alt.id || typeof alt.id !== 'string' || alt.id.trim() === '') {
            throw new Error(`A alternativa na posição ${index + 1} deve ter um 'id' válido.`);
          }
          if (!alt.texto || typeof alt.texto !== 'string' || alt.texto.trim() === '') {
            throw new Error(`A alternativa '${alt.id}' deve ter um 'texto' não vazio.`);
          }
        });
      }

      // Resposta Correta (apenas para múltipla escolha)
      if (!isUpdate || data.respostaCorreta !== undefined) {
        if (!data.respostaCorreta || typeof data.respostaCorreta !== 'string' || data.respostaCorreta.trim() === '') {
          throw new Error("O campo 'respostaCorreta' é obrigatório.");
        }
        
        if (data.alternativas && data.respostaCorreta) {
          const validAlternativeIds = data.alternativas.map(a => a.id);
          if (!validAlternativeIds.includes(data.respostaCorreta)) {
            throw new Error(`A 'respostaCorreta' (${data.respostaCorreta}) deve corresponder a uma das alternativas fornecidas.`);
          }
        }
      }
    }

    // Dificuldade
    if (!isUpdate || data.dificuldade !== undefined) {
      if (!data.dificuldade || typeof data.dificuldade !== 'string' || data.dificuldade.trim() === '') {
        throw new Error("O campo 'dificuldade' é obrigatório.");
      }
      const allowedDifficulties = ['fácil', 'médio', 'difícil'];
      if (!allowedDifficulties.includes(data.dificuldade.toLowerCase().trim())) {
        throw new Error("O campo 'dificuldade' deve ser 'fácil', 'médio' ou 'difícil'.");
      }
    }
  }

  static async createQuestion(questionData: Partial<Question>, userId: string, userRole: string): Promise<string> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem criar questões.");
    }

    this.validateQuestionPayload(questionData, false);

    const now = new Date().toISOString();
    const uniqueHash = this.generateHash(questionData.enunciado!);

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

  static async updateQuestion(questionId: string, questionData: Partial<Question>, _userId: string, userRole: string): Promise<void> {
    if (userRole !== 'admin' && userRole !== 'professor') {
      throw new Error("Permissão negada: Apenas professores e administradores podem editar questões.");
    }

    try {
      const docRef = doc(db, this.collectionName, questionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error("Questão não encontrada.");
      }

      const existingData = docSnap.data() as Question;
      const mergedData = { ...existingData, ...questionData };
      
      this.validateQuestionPayload(mergedData, false);

      await updateDoc(docRef, {
        ...questionData,
        atualizadoEm: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Erro ao atualizar questão:", error);
      throw new Error(error.message || "Falha ao atualizar a questão no banco de dados.");
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
