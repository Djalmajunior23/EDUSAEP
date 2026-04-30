import * as functions from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { analyzeStudentError } from './pedagogical/errorIntelligenceEngine';
import { trackRecurringErrors } from './pedagogical/errorMemoryEngine';
import { reExplainContent } from './pedagogical/reExplainEngine';
import { generateTeacherInsights } from './pedagogical/teacherInsightsEngine';

initializeApp();
const db = getFirestore();

// ... existing pedagogical exports

export const analyzeError = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    const { answer, correctAnswer, context } = request.data;
    return await analyzeStudentError(answer, correctAnswer, context);
});

export const reportError = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    const { studentId, competencyId, errorType } = request.data;
    await trackRecurringErrors(studentId, competencyId, errorType);
    return { success: true };
});

export const reExplain = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    const { originalAnswer, studentProfile, format } = request.data;
    return await reExplainContent(originalAnswer, studentProfile, format);
});

export const getTeacherInsights = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Usuário não autenticado.");
    const { classId } = request.data;
    return await generateTeacherInsights(classId);
});

// ... existing onResultCreated

export const onResultCreated = functions.onDocumentCreated(
  { document: 'resultados/{resultadoId}' },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.classId) return;

    const classId = data.classId;
    const statsRef = db.doc(`stats/classes/data/${classId}`);

    const score = data.score || 0;
    const isRisk = score < 50 ? 1 : 0;

    await statsRef.set({
      avgPerformance: FieldValue.increment(score), // Note: Simplified increment, logic should ideally store count to calculate average
      riskCount: FieldValue.increment(isRisk),
      deliveryRate: FieldValue.increment(1),
      lastUpdate: FieldValue.serverTimestamp()
    }, { merge: true });
  }
);
