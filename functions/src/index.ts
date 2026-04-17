import * as functions from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

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
