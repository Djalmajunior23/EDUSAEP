import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { SimuladoForm, Simulado } from '../../types';
import { ExternalFormManager } from './ExternalFormManager';
import { ImportInconsistencyManager } from './ImportInconsistencyManager';
import { 
  LayoutDashboard, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../services/errorService';

interface ExternalFormsViewProps {
  user: User | null;
  userProfile: UserProfile | null;
}

export function ExternalFormsView({ user, userProfile }: ExternalFormsViewProps) {
  const [activeTab, setActiveTab] = useState<'forms' | 'inconsistencies'>('forms');
  const [forms, setForms] = useState<SimuladoForm[]>([]);
  const [exams, setExams] = useState<Record<string, Simulado>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch forms
    const q = query(collection(db, 'simulado_forms'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimuladoForm));
        setForms(formsData);

        // Fetch related exams
        const examIds = Array.from(new Set(formsData.map(f => f.simuladoId)));
        const examPromises = examIds.map(id => getDoc(doc(db, 'exams', id)));
        const examSnaps = await Promise.all(examPromises);
        
        const examsMap: Record<string, Simulado> = {};
        examSnaps.forEach(snap => {
          if (snap.exists()) {
            examsMap[snap.id] = { id: snap.id, ...snap.data() } as Simulado;
          }
        });
        setExams(examsMap);
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'simulado_forms/exams');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'simulado_forms');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredForms = forms.filter(form => {
    const exam = exams[form.simuladoId];
    return exam?.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           form.externalFormId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestão de Formulários Externos</h2>
          <p className="text-gray-500">Sincronize respostas e resolva inconsistências de integração.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab('forms')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'forms' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <ExternalLink size={18} />
            Formulários Ativos
          </button>
          <button
            onClick={() => setActiveTab('inconsistencies')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'inconsistencies' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <AlertCircle size={18} />
            Inconsistências
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'forms' ? (
          <motion.div
            key="forms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Buscar por título do simulado ou ID do formulário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
                  <ExternalLink size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">Nenhum formulário ativo</h3>
                  <p className="text-gray-500">Gere formulários externos na tela de Gerenciamento de Simulados.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredForms.map(form => (
                  <div key={form.id} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <LayoutDashboard size={16} className="text-emerald-600" />
                      <h4 className="font-bold text-gray-700">{exams[form.simuladoId]?.title || 'Simulado Desconhecido'}</h4>
                    </div>
                    <ExternalFormManager 
                      simuladoId={form.simuladoId}
                      user={user}
                      webhookUrl={userProfile?.settings?.webhookUrl || ''}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="inconsistencies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ImportInconsistencyManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
