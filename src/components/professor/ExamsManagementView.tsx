import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Calendar,
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  BarChart3,
  Download,
  ExternalLink,
  Eye,
  Upload,
  X,
  Save
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { exportExamToGoogleForms } from '../../services/googleFormsService';
import { parseQuestionsFromText } from '../../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Exam {
  id?: string;
  title: string;
  description: string;
  type: 'simulado' | 'avaliacao' | 'recuperacao' | 'exercicio';
  status: 'rascunho' | 'publicado' | 'encerrado';
  dueDate: string;
  duration: number; // minutes
  totalQuestions: number;
  totalPoints: number;
  questions: string[]; // IDs of questions
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  submissionsCount?: number;
  averageScore?: number;
}

export function ExamsManagementView({ user, userProfile, selectedModel, defaultType = 'simulado' }: { user: any, userProfile: any, selectedModel: string, defaultType?: 'simulado' | 'exercicio' }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'simulado' | 'exercicio' | 'all'>(defaultType);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // New States for Edit / Delete / Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Partial<Exam> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, [filterType]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setImportProgress(10);
    
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ');
          setImportProgress(10 + Math.floor((i / pdf.numPages) * 30));
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        setImportProgress(40);
      } else {
        text = await file.text();
        setImportProgress(40);
      }

      setImportProgress(50);
      const questions = await parseQuestionsFromText(text, selectedModel, userProfile?.role || 'professor');
      setImportProgress(80);

      if (!questions || questions.length === 0) {
        throw new Error("Nenhuma questão encontrada no arquivo.");
      }

      // Save questions to bank and create exam
      const batch = writeBatch(db);
      const questionIds: string[] = [];

      for (const q of questions) {
        const qRef = doc(collection(db, 'questions'));
        batch.set(qRef, {
          ...q,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          usoTotal: 0
        });
        questionIds.push(qRef.id);
      }

      const examRef = doc(collection(db, 'exams'));
      batch.set(examRef, {
        title: `Importado: ${file.name.split('.')[0]}`,
        description: `Avaliação importada do arquivo ${file.name}`,
        type: filterType === 'all' ? 'simulado' : filterType,
        status: 'rascunho',
        questions: questionIds,
        totalQuestions: questionIds.length,
        totalPoints: questionIds.length * 10,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      await batch.commit();
      setImportProgress(100);
      toast.success("Avaliação importada com sucesso!");
      fetchExams();
    } catch (error: any) {
      console.error("Import Error:", error);
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
      }, 1000);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'exams'),
        where('createdBy', '==', user.uid),
        ...(filterType !== 'all' ? [where('type', '==', filterType)] : []),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error(`Erro ao carregar ${filterType === 'simulado' ? 'simulados' : 'exercícios'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentExam({
      title: '',
      description: '',
      type: filterType === 'all' ? 'simulado' : filterType,
      status: 'rascunho',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 120,
      totalQuestions: 0,
      totalPoints: 100,
      questions: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setCurrentExam({
      ...exam,
      dueDate: exam.dueDate ? exam.dueDate.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // formats string for input date
    });
    setIsModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExam || !user) return;

    setIsSaving(true);
    try {
      if (currentExam.id) {
        await updateDoc(doc(db, 'exams', currentExam.id), {
          ...currentExam,
          updatedAt: serverTimestamp()
        });
        toast.success("Avaliação atualizada!");
      } else {
        await addDoc(collection(db, 'exams'), {
          ...currentExam,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success("Avaliação criada!");
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error("Erro ao salvar avaliação.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'exams', examToDelete));
      toast.success("Simulado excluído com sucesso.");
      fetchExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Erro ao excluir simulado.");
    } finally {
      setExamToDelete(null);
    }
  };

  const handleExportToForms = async (exam: Exam) => {
    if (!exam.id) return;
    setIsExporting(exam.id);
    
    try {
      toast.info("Exportando para Google Forms...");
      
      // Fetch full question data
      const questionsSnap = await getDocs(query(
        collection(db, 'questions'),
        where('__name__', 'in', exam.questions)
      ));
      const fullQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const result = await exportExamToGoogleForms(exam.title, fullQuestions);
      
      if (result.success) {
        toast.success("Exportação concluída!");
        window.open(result.formUrl, '_blank');
      } else {
        toast.error("Erro na exportação.");
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Erro ao exportar simulado.");
    } finally {
      setIsExporting(null);
    }
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium">Carregando simulados...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <FileText className="text-indigo-600" size={32} /> Gestão de Simulados
          </h2>
          <p className="text-gray-500 mt-1">Crie avaliações, acompanhe resultados e exporte para o Google Forms.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            id="exam-import" 
            className="hidden" 
            accept=".pdf,.docx,.csv,.xlsx"
            onChange={handleImportFile}
          />
          <label 
            htmlFor="exam-import"
            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            Importar
          </label>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={20} /> Novo Simulado
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-indigo-700">Importando avaliação...</span>
            <span className="text-sm font-bold text-indigo-700">{importProgress}%</span>
          </div>
          <div className="w-full bg-indigo-50 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300" 
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">Todos os Tipos</option>
          <option value="simulado">Simulado</option>
          <option value="exercicio">Exercício</option>
        </select>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">Todos os Status</option>
          <option value="rascunho">Rascunho</option>
          <option value="publicado">Publicado</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>

      {/* Exams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map(exam => (
          <motion.div 
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                exam.status === 'publicado' ? 'bg-emerald-100 text-emerald-700' :
                exam.status === 'encerrado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {exam.status}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleExportToForms(exam)}
                  disabled={isExporting === exam.id}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Exportar para Google Forms"
                >
                  {isExporting === exam.id ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                </button>
                <button 
                  onClick={() => handleEdit(exam)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => setExamToDelete(exam.id!)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              {exam.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
              {exam.description}
            </p>

            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><Target size={14} /> {exam.totalQuestions} Questões</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {exam.duration} min</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(exam.dueDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {exam.submissionsCount || 0} Entregas</span>
              </div>
            </div>

            <button className="mt-6 w-full py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
              <Eye size={18} /> Ver Detalhes
            </button>
          </motion.div>
        ))}

        {filteredExams.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
            <FileText size={64} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-900">Nenhum simulado encontrado</h3>
            <p className="text-gray-500">Comece criando seu primeiro simulado clicando no botão acima.</p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && currentExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentExam.id ? 'Editar Avaliação' : 'Nova Avaliação'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                  <input
                    required
                    type="text"
                    value={currentExam.title || ''}
                    onChange={e => setCurrentExam({ ...currentExam, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Simulado ENEM 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={currentExam.description || ''}
                    onChange={e => setCurrentExam({ ...currentExam, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Descrição da avaliação..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                    <select
                      value={currentExam.type || 'simulado'}
                      onChange={e => setCurrentExam({ ...currentExam, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="simulado">Simulado</option>
                      <option value="exercicio">Exercício</option>
                      <option value="avaliacao">Avaliação</option>
                      <option value="recuperacao">Recuperação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                    <select
                      value={currentExam.status || 'rascunho'}
                      onChange={e => setCurrentExam({ ...currentExam, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="publicado">Publicado</option>
                      <option value="encerrado">Encerrado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Data Limite</label>
                    <input
                      required
                      type="date"
                      value={currentExam.dueDate || ''}
                      onChange={e => setCurrentExam({ ...currentExam, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Duração (minutos)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={currentExam.duration || 0}
                      onChange={e => setCurrentExam({ ...currentExam, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full mt-4 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {examToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Avaliação?</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Tem certeza? Esta ação é irreversível e pode afetar as notas dos alunos que já responderam a esta avaliação.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExamToDelete(null)}
                  className="flex-1 py-3 text-gray-700 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
