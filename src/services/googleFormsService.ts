import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorService';

export const exportQuestionsToGoogleForms = async (title: string, questions: any[]) => {
  try {
    const exportData = {
      titulo: title,
      descricao: 'Questões exportadas do JuniorsStudent',
      questoes: questions.map((q: any) => ({
        enunciado: q.enunciado || q.question,
        alternativas: Array.isArray(q.alternativas) 
          ? q.alternativas.map((a: any) => typeof a === 'string' ? a : a.texto)
          : [q.altA, q.altB, q.altC, q.altD, q.altE].filter(Boolean),
        respostaCorreta: q.respostaCorreta || q.correctAnswer,
        comentario: q.comentarioGabarito || q.explanation
      }))
    };

    const response = await fetch('/api/n8n/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    });

    if (!response.ok) {
      throw new Error('Falha ao comunicar com o servidor de exportação');
    }
    
    return await response.json();
  } catch (err) {
    console.error("Export error:", err);
    throw err;
  }
};

export const exportExamToGoogleForms = async (examId: string, examData: any, webhookUrl?: string) => {
  try {
    // 1. Prepare data for export
    const exportData = {
      simuladoId: examId,
      titulo: examData.title,
      descricao: examData.description || 'Simulado SAEP gerado pelo JuniorsStudent',
      questoes: examData.questions.map((q: any) => ({
        enunciado: q.enunciado,
        alternativas: q.alternativas.map((a: any) => a.texto),
        respostaCorreta: q.respostaCorreta, // This is usually 'A', 'B', etc.
        comentario: q.comentarioGabarito
      }))
    };

    // 2. Trigger n8n workflow
    // Use the specific forms endpoint if configured in server.ts
    const response = await fetch('/api/n8n/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    });

    if (!response.ok) {
      throw new Error('Falha ao comunicar com o servidor de exportação');
    }
    
    const result = await response.json();
    
    // 3. Update exam with external form info
    if (result.publicUrl) {
      await updateDoc(doc(db, 'exams', examId), {
        externalFormId: result.formId || 'pending',
        publicUrl: result.publicUrl,
        applicationMode: 'hybrid',
        updatedAt: serverTimestamp()
      });
      
      // Also create a record in simulado_forms for tracking
      await addDoc(collection(db, 'simulado_forms'), {
        simuladoId: examId,
        provider: 'google_forms',
        externalFormId: result.formId,
        publicUrl: result.publicUrl,
        status: 'active',
        createdAt: serverTimestamp()
      });
    }

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'exams');
    throw err;
  }
};

export const syncFormResponses = async (examId: string, formId: string) => {
  try {
    const response = await fetch('/api/simulados/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, formId })
    });

    if (!response.ok) {
      throw new Error('Falha ao sincronizar respostas');
    }

    return await response.json();
  } catch (err) {
    console.error("Sync error:", err);
    throw err;
  }
};
