import admin from 'firebase-admin';

export interface CognitiveProfile {
  studentId: string;
  learningPace: 'fast' | 'normal' | 'slow';
  preferredFormat: 'visual' | 'text' | 'practical';
  masteryLevels: Record<string, number>;
  recurringErrors: string[];
  lastStudySession: any;
  engagementScore: number;
}

export async function getCognitiveProfile(studentId: string): Promise<CognitiveProfile | null> {
  const db = admin.firestore();
  const doc = await db.collection('student_cognitive_profiles').doc(studentId).get();
  return doc.exists ? doc.data() as CognitiveProfile : null;
}

export async function updateCognitiveProfile(studentId: string, delta: Partial<CognitiveProfile>) {
  const db = admin.firestore();
  await db.collection('student_cognitive_profiles').doc(studentId).set({
    ...delta,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}
