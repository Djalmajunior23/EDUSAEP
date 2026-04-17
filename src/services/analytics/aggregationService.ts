import { db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp, collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';

/**
 * Service to manage the aggregation of class statistics for the Dashboard.
 */
export const AggregationService = {
  /**
   * Updates aggregated statistics for a specific class.
   * This is called by triggers or manual batch jobs.
   */
  async updateClassStats(classId: string, data: {
    resultChange: number,
    isRiskDelta: number,
    deliveredCountDelta: number
  }) {
    const statsRef = doc(db, 'stats', 'classes', 'data', classId);
    
    // We use a transaction to ensure atomicity
    await setDoc(statsRef, {
      avgPerformance: increment(data.resultChange),
      riskCount: increment(data.isRiskDelta),
      deliveryRate: increment(data.deliveredCountDelta),
      lastUpdate: serverTimestamp()
    }, { merge: true });
  }
};
