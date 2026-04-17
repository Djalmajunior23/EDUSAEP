import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

export async function updateClassStats(classId: string, performanceDelta: number, isRisk: boolean) {
  const statsRef = doc(db, 'class_dashboard_stats', classId);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    await updateDoc(statsRef, {
      avgPerformance: increment(performanceDelta),
      riskCount: increment(isRisk ? 1 : 0),
      lastUpdate: serverTimestamp()
    });
  } else {
    await setDoc(statsRef, {
      classId,
      healthScore: 100, // Default start
      riskCount: isRisk ? 1 : 0,
      avgPerformance: performanceDelta,
      deliveryRate: 0,
      lastUpdate: serverTimestamp()
    });
  }
}
