import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AggregationService } from './aggregationService';

/**
 * Migration script to process existing data and populate stats.
 */
export async function migrateExistingClassStats() {
  console.log("Starting migration of class statistics...");
  
  // 1. Get all classes (this assumes an existing collections structure, adjust as needed)
  const classesSnap = await getDocs(collection(db, 'classes'));
  
  for (const docSnapshot of classesSnap.docs) {
    const classId = docSnapshot.id;
    
    // 2. Fetch all submissions/results for this class
    // This is a naive implementation; for large datasets, use batches
    const resultsQuery = await getDocs(collection(db, 'resultados')); // simplified
    
    let totalScore = 0;
    let count = 0;
    let riskCount = 0;

    resultsQuery.forEach((r) => {
      if (r.data().classId === classId) {
        totalScore += r.data().score || 0;
        count++;
        if ((r.data().score || 0) < 50) riskCount++; // Example risk threshold
      }
    });

    // 3. Initialize aggregate doc
    const statsRef = doc(db, 'stats', 'classes', 'data', classId);
    await setDoc(statsRef, {
      classId,
      avgPerformance: count > 0 ? (totalScore / count) : 0,
      riskCount: riskCount,
      deliveryRate: count, // simplified
      lastUpdate: serverTimestamp()
    });
    
    console.log(`Migrated class: ${classId}`);
  }
  
  console.log("Migration completed!");
}
