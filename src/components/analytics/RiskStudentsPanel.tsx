import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { AlertTriangle, AlertCircle, ArrowRight, Brain, Loader2 } from 'lucide-react';
import { Student360Drawer } from '../professor/command-center/Student360Drawer';

export function RiskStudentsPanel({ classId }: { classId?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    fetchRiskStudents();
  }, [classId]);

  const fetchRiskStudents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'studentRiskScores'),
        where('level', 'in', ['HIGH', 'MEDIUM'])
      );
      const snap = await getDocs(q);
      
      const results = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        let name = "Aluno " + d.id.substring(0, 5);
        
        // Try to fetch name
        try {
          const userDoc = await getDoc(doc(db, 'users', d.id));
          if (userDoc.exists()) name = userDoc.data().displayName || name;
        } catch (e) {}

        return { id: d.id, name, ...data };
      }));

      setStudents(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanAll = async () => {
    setScanning(true);
    try {
      // For demo / simple implementation, we'll scan all students found in 'users' collection
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'STUDENT')));
      
      for (const student of usersSnap.docs) {
        await fetch('/api/ai/dropout-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id })
        });
      }
      
      await fetchRiskStudents();
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  if (loading && !scanning) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

  return (
    <>
      <div className="bg-white border text-gray-800 border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={18} />
            Evasão (IA Dropout Risk)
          </h3>
          <button 
            onClick={handleScanAll}
            disabled={scanning}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="animate-spin" size={12} /> : <Brain size={12} />}
            {scanning ? 'Analisando...' : 'Escanear'}
          </button>
        </div>
        
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {students.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nenhum aluno em risco detectado.</div>
          ) : (
            students.map((st) => (
              <div key={st.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${st.level === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  {st.level === 'HIGH' ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{st.name}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Risco: {st.score}%</p>
                  
                  <div className="mt-3 space-y-1">
                    {(st.justifications || []).map((j: string, idx: number) => (
                      <p key={idx} className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block mr-2 mb-1">
                        {j}
                      </p>
                    ))}
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedStudent(st)}
                    className="px-3 py-1.5 bg-gray-900 text-white text-[10px] uppercase tracking-wider font-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Agir <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Student360Drawer 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        studentId={selectedStudent?.id || ''} 
        riskData={selectedStudent} 
      />
    </>
  );
}
