import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp
} from "firebase/firestore";
import { db } from "../../../firebase";
import { 
  Simulado, 
  SimuladoForm, 
  ImportedResponse, 
  ResponseItem, 
  Question
} from "../types";
import { N8nFormProvider } from "../../../integrations/forms/N8nFormProvider";
import { handleFirestoreError, OperationType } from "../../../services/errorService";

export const simuladoService = {
  async createSimulado(data: Partial<Simulado>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "exams"), {
        ...data,
        status: data.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "exams");
      throw err;
    }
  },

  async updateSimulado(id: string, data: Partial<Simulado>): Promise<void> {
    try {
      await updateDoc(doc(db, "exams", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `exams/${id}`);
      throw err;
    }
  },

  async getSimulado(id: string): Promise<Simulado> {
    try {
      const docSnap = await getDoc(doc(db, "exams", id));
      if (!docSnap.exists()) throw new Error("Simulado not found");
      return { id: docSnap.id, ...docSnap.data() } as Simulado;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `exams/${id}`);
      throw err;
    }
  },

  async generateExternalForm(simuladoId: string, webhookUrl: string): Promise<string> {
    const simulado = await this.getSimulado(simuladoId);
    
    let questions: Question[] = [];
    
    // Check if questions are already embedded in the simulado object (as in App.tsx)
    if ((simulado as any).questions && (simulado as any).questions.length > 0) {
      questions = (simulado as any).questions;
    } else if (simulado.questionIds && simulado.questionIds.length > 0) {
      // Fetch questions from collection if only IDs are provided
      const questionsSnap = await Promise.all(
        simulado.questionIds.map(qId => getDoc(doc(db, "questions", qId)))
      );
      questions = questionsSnap.map(snap => ({ id: snap.id, ...snap.data() } as Question));
    } else {
      throw new Error("O simulado não possui questões cadastradas.");
    }

    const provider = new N8nFormProvider(webhookUrl);
    const result = await provider.createForm(simulado, questions);

    try {
      const formRef = await addDoc(collection(db, "simulado_forms"), {
        simuladoId,
        provider: 'n8n',
        externalFormId: result.externalFormId,
        publicUrl: result.publicUrl,
        adminUrl: result.adminUrl || '',
        status: 'active',
        createdAt: serverTimestamp(),
        responseCount: 0,
        integrationToken: result.integrationToken,
      });

      return formRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "simulado_forms");
      throw err;
    }
  },

  async syncFormResponses(formId: string, webhookUrl: string, userId: string): Promise<string> {
    let formSnap;
    try {
      formSnap = await getDoc(doc(db, "simulado_forms", formId));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `simulado_forms/${formId}`);
      throw err;
    }
    
    if (!formSnap.exists()) throw new Error("Form not found");
    const form = { id: formSnap.id, ...formSnap.data() } as SimuladoForm;

    const provider = new N8nFormProvider(webhookUrl);
    const responses = await provider.getResponses(form.externalFormId, form.integrationToken);

    let totalRead = responses.length;
    let totalImported = 0;
    let totalRejected = 0;
    let totalDuplicated = 0;

    let logRef;
    try {
      logRef = await addDoc(collection(db, "import_logs"), {
        simuladoId: form.simuladoId,
        formId,
        executedBy: userId,
        executedAt: serverTimestamp(),
        totalRead,
        status: 'pending',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "import_logs");
      throw err;
    }

    for (const res of responses) {
      // Check for duplicates
      try {
        const q = query(
          collection(db, "imported_responses"), 
          where("externalResponseId", "==", res.externalResponseId),
          where("simuladoId", "==", form.simuladoId)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
          totalDuplicated++;
          continue;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "imported_responses");
        // We might want to continue or break here depending on severity
        continue;
      }

      try {
        const hash = btoa(JSON.stringify(res.answers) + res.submittedAt.getTime());
        
        const importedResRef = await addDoc(collection(db, "imported_responses"), {
          simuladoId: form.simuladoId,
          formId,
          alunoNome: res.alunoNome,
          alunoEmail: res.alunoEmail,
          alunoMatricula: res.alunoMatricula,
          turma: res.turma,
          submittedAt: Timestamp.fromDate(res.submittedAt),
          source: 'external_form',
          answers: res.answers,
          processingStatus: 'pending',
          externalResponseId: res.externalResponseId,
          hash,
        });

        // Trigger processing (this would normally be a Cloud Function or separate service call)
        await this.processImportedResponse(importedResRef.id, logRef.id);
        totalImported++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "imported_responses");
        totalRejected++;
      }
    }

    try {
      await updateDoc(logRef, {
        totalImported,
        totalRejected,
        totalDuplicated,
        status: totalRejected > 0 ? 'partial' : 'success',
      });

      await updateDoc(doc(db, "simulado_forms", formId), {
        lastSyncAt: serverTimestamp(),
        responseCount: form.responseCount + totalImported,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `simulado_forms/${formId}`);
    }

    return logRef.id;
  },

  async processImportedResponse(responseId: string, logId?: string): Promise<void> {
    let resSnap;
    try {
      resSnap = await getDoc(doc(db, "imported_responses", responseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `imported_responses/${responseId}`);
      return;
    }
    
    if (!resSnap.exists()) return;
    const res = { id: resSnap.id, ...resSnap.data() } as ImportedResponse;

    const simulado = await this.getSimulado(res.simuladoId);
    
    // 1. Associate with student
    let alunoId = await this.findStudent(res.alunoMatricula, res.alunoEmail, res.alunoNome, res.turma);
    
    if (!alunoId) {
      try {
        await addDoc(collection(db, "import_inconsistencies"), {
          importLogId: logId || 'manual',
          importedResponseId: responseId,
          type: 'student_not_found',
          description: `Student not found for ${res.alunoNome} (${res.alunoMatricula})`,
          originalData: res,
          resolutionStatus: 'pending',
        });
        await updateDoc(doc(db, "imported_responses", responseId), {
          processingStatus: 'inconsistent',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "import_inconsistencies");
      }
      return;
    }

    // 2. Correct answers
    let questions;
    try {
      const questionsSnap = await Promise.all(
        simulado.questionIds.map(qId => getDoc(doc(db, "questions", qId)))
      );
      questions = questionsSnap.map(snap => ({ id: snap.id, ...snap.data() } as Question));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "questions");
      return;
    }

    let totalCorrect = 0;
    let totalWrong = 0;
    const responseItems: Partial<ResponseItem>[] = [];

    for (const question of questions) {
      const selected = res.answers[question.id];
      const correctAlt = String.fromCharCode(65 + question.correctOption); // A, B, C, D...
      const isCorrect = selected === correctAlt;

      if (isCorrect) totalCorrect++;
      else totalWrong++;

      responseItems.push({
        importedResponseId: responseId,
        questionId: question.id,
        selectedAlternative: selected,
        correctAlternative: correctAlt,
        isCorrect,
        competenceId: question.competency,
        disciplineId: question.disciplineId,
        descriptorId: question.descriptorId,
        difficultyLevel: question.difficulty,
      });
    }

    // 3. Save items
    try {
      await Promise.all(
        responseItems.map(item => addDoc(collection(db, "response_items"), item))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "response_items");
    }

    // 4. Update response
    const score = totalCorrect; // Simple score for now
    const percentage = (totalCorrect / questions.length) * 100;

    try {
      await updateDoc(doc(db, "imported_responses", responseId), {
        alunoId,
        totalCorrect,
        totalWrong,
        score,
        percentage,
        processingStatus: 'processed',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `imported_responses/${responseId}`);
    }

    // 5. Create Exam Submission for integration with existing dashboards
    try {
      const studentSnap = await getDoc(doc(db, "users", alunoId));
      const studentData = studentSnap.data();

      const competencyResults: { [key: string]: { correct: number, total: number } } = {};
      responseItems.forEach(item => {
        if (item.competenceId) {
          if (!competencyResults[item.competenceId]) {
            competencyResults[item.competenceId] = { correct: 0, total: 0 };
          }
          competencyResults[item.competenceId].total++;
          if (item.isCorrect) {
            competencyResults[item.competenceId].correct++;
          }
        }
      });

      await addDoc(collection(db, "exam_submissions"), {
        resourceId: res.simuladoId,
        type: 'exam',
        studentId: alunoId,
        studentName: studentData?.displayName || res.alunoNome,
        answers: questions.map(q => {
          const selected = res.answers[q.id];
          return selected ? selected.charCodeAt(0) - 65 : -1; // Convert A, B, C to 0, 1, 2
        }),
        score,
        maxScore: questions.length,
        completedAt: res.submittedAt,
        competencyResults,
        source: 'external_form',
        importedResponseId: responseId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "exam_submissions");
    }
  },

  async findStudent(matricula: string, email: string, nome: string, _turma: string): Promise<string | null> {
    try {
      // Search by matricula
      if (matricula) {
        const q2 = query(collection(db, "users"), where("matricula", "==", matricula));
        const snap = await getDocs(q2);
        if (!snap.empty) return snap.docs[0].id;
      }

      // Search by email
      if (email) {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].id;
      }

      // Search by name + class (simplified)
      const q3 = query(collection(db, "users"), where("displayName", "==", nome));
      const snap = await getDocs(q3);
      if (!snap.empty) {
          // Could filter by class here if class is stored in user profile
          return snap.docs[0].id;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "users");
    }

    return null;
  }
};
