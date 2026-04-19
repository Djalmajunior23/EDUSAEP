import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  UserPlus, 
  CheckCircle2, 
  Search,
  Loader2,
  User as UserIcon,
  Mail,
  Hash,
  Users
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { ImportInconsistency } from '../types';
import { UserProfile } from '../../../types';
import { simuladoService } from '../services/simuladoService';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../../services/errorService';

export function ImportInconsistencyManager() {
  const [inconsistencies, setInconsistencies] = useState<ImportInconsistency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedInconsistency, setSelectedInconsistency] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'import_inconsistencies'),
      where('resolutionStatus', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInconsistencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImportInconsistency)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'import_inconsistencies');
    });

    const fetchStudents = async () => {
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'aluno'));
        const snap = await getDocs(studentsQuery);
        setAllStudents(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      } catch (err) {
        console.error("Error fetching students for mapping", err);
      }
    };
    fetchStudents();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedInconsistency) {
      const inc = inconsistencies.find(i => i.id === selectedInconsistency);
      if (inc) {
        updateSuggestions(inc, searchTerm);
      }
    }
  }, [selectedInconsistency, searchTerm, allStudents]);

  const updateSuggestions = (inc: ImportInconsistency | null, term: string) => {
    if (!inc && !term) {
      setStudents([]);
      return;
    }

    const searchTerms = term.toLowerCase().split(/\s+/).filter(Boolean);
    const incNameTerms = inc?.originalData.alunoNome?.toLowerCase().split(/\s+/).filter(Boolean) || [];
    const incEmail = inc?.originalData.alunoEmail?.toLowerCase() || '';
    const incMat = inc?.originalData.alunoMatricula?.toLowerCase() || '';

    const scoredStudents = allStudents
      .map(s => {
        let score = 0;
        const name = s.displayName?.toLowerCase() || '';
        const email = s.email?.toLowerCase() || '';
        const mat = s.matricula?.toLowerCase() || '';

        if (searchTerms.length > 0) {
          // Manual search
          searchTerms.forEach(t => {
            if (name.includes(t)) score += 3;
            if (email.includes(t)) score += 2;
            if (mat.includes(t)) score += 4;
          });
        } else if (inc) {
          // Auto-suggest based on inconsistency data
          incNameTerms.forEach(t => {
            if (t.length > 2 && name.includes(t)) score += 1;
          });
          if (email && incEmail && email === incEmail) score += 5;
          else if (email && incEmail && email.includes(incEmail.split('@')[0])) score += 2;
          
          if (mat && incMat && mat === incMat) score += 5;
          else if (mat && incMat && mat.includes(incMat)) score += 2;
        }
        
        return { ...s, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 suggestions
    
    setStudents(scoredStudents);
  };

  const handleSearchStudents = async () => {
    // Search is now handled automatically by the useEffect
    // This function is kept for the button click, but it's mostly redundant now
    const inc = inconsistencies.find(i => i.id === selectedInconsistency);
    updateSuggestions(inc || null, searchTerm);
  };

  const resolveInconsistency = async (inconsistencyId: string, studentId: string) => {
    try {
      const inconsistency = inconsistencies.find(i => i.id === inconsistencyId);
      if (!inconsistency) return;

      // 1. Update imported response with student ID
      await updateDoc(doc(db, 'imported_responses', inconsistency.importedResponseId), {
        alunoId: studentId,
        processingStatus: 'pending' // Set back to pending to trigger reprocessing
      });

      // 2. Mark inconsistency as resolved
      await updateDoc(doc(db, 'import_inconsistencies', inconsistencyId), {
        resolutionStatus: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: studentId, // Or the current user's ID
      });

      // 3. Trigger reprocessing
      await simuladoService.processImportedResponse(inconsistency.importedResponseId, inconsistency.importLogId);

      toast.success("Inconsistência resolvida e resposta processada!");
      setSelectedInconsistency(null);
      setStudents([]);
      setSearchTerm('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `import_inconsistencies/${inconsistencyId}`);
      toast.error("Erro ao resolver inconsistência.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inconsistências de Importação</h2>
          <p className="text-sm text-gray-500">Respostas que não puderam ser associadas automaticamente a um aluno.</p>
        </div>
      </div>

      {inconsistencies.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-300 mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Tudo limpo!</h3>
            <p className="text-gray-500">Não há inconsistências pendentes de resolução.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inconsistencies.map((inc) => (
            <div key={inc.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">
                      {inc.type}
                    </span>
                    <h4 className="font-bold text-gray-900">{inc.originalData.alunoNome}</h4>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Mail size={12} /> {inc.originalData.alunoEmail}</span>
                    <span className="flex items-center gap-1"><Hash size={12} /> {inc.originalData.alunoMatricula || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {inc.originalData.turma}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInconsistency(selectedInconsistency === inc.id ? null : inc.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Associar Aluno
                </button>
              </div>

              {selectedInconsistency === inc.id && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                        placeholder="Buscar por nome, email ou matrícula..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button 
                      onClick={handleSearchStudents}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
                    >
                      Buscar
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.uid} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{student.displayName}</p>
                            <p className="text-xs text-gray-500">{student.email} | {student.matricula || 'Sem matrícula'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => resolveInconsistency(inc.id, student.uid)}
                          className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all"
                        >
                          Selecionar
                        </button>
                      </div>
                    ))}
                    {students.length === 0 && searchTerm && (
                      <p className="text-center text-sm text-gray-500 py-4">Nenhum aluno encontrado.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
