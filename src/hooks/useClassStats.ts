import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useClassStats(classId: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    
    const statsRef = doc(db, 'class_dashboard_stats', classId);
    return onSnapshot(statsRef, (doc) => {
      setStats(doc.exists() ? doc.data() : null);
      setLoading(false);
    });
  }, [classId]);

  return { stats, loading };
}
