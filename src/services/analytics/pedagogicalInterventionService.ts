import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { generateRecoveryTrack } from '../geminiService';

export const PedagogicalInterventionService = {
  async detectAndGenerateRecovery(studentId: string, competencyId: string, diagnosticData: any) {
    // 1. Call Gemini to generate the track
    const track = await generateRecoveryTrack({
        studentId,
        competencyId,
        diagnosticData
    });

    // 2. Persist to Firestore
    const planRef = doc(collection(db, 'recovery_plans'));
    await setDoc(planRef, {
        userId: studentId,
        studentId,
        riskLevel: track.riskLevel || 'Médio',
        summary: track.summary || 'Trilha automática gerada pela IA para reforço pedagógico.',
        recommendedActivities: track.activities || [],
        professorInterventions: track.interventions || [],
        createdAt: serverTimestamp()
    });
    
    return planRef.id;
  }
};
