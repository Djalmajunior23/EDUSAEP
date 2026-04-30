import { db } from "../firebaseAdmin";
import * as admin from 'firebase-admin';

export async function trackRecurringErrors(studentId: string, competencyId: string, errorType: string) {
    const ref = db.collection('studentCognitiveProfiles').doc(studentId).collection('errorPatterns').doc(competencyId);
    
    await ref.set({
        lastErrorType: errorType,
        count: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}
