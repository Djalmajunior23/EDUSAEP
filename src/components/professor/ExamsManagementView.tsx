import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Users, 
  Calendar,
  Loader2,
  Sparkles,
  Target,
  ExternalLink,
  Eye,
  Upload,
  X,
  BrainCircuit,
  Save,
  Check
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, writeBatch, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { exportExamToGoogleForms } from '../../services/googleFormsService';
import { parseQuestionsFromText } from '../../services/geminiService';
import { Exam } from '../../types/eduai.types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ExamGenerator } from './exam/ExamGenerator';
import { handleFirestoreError, OperationType } from '../../services/errorService';

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
  const [showDetails, setShowDetails] = useState(false);
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<Exam | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchFullQuestions = async (exam: Exam) => {
    if (!exam.questions || exam.questions.length === 0) return exam.questions;
    
    // Check if we already have objects
    if (typeof exam.questions[0] === 'object' && exam.questions[0] !== null) {
      return exam.questions;
    }

    try {
      setIsLoadingDetails(true);
      const questionIds = exam.questions;
      // Firestore 'in' query supports up to 30 items
      const chunks = [];
      for (let i = 0; i < questionIds.length; i += 30) {
        chunks.push(questionIds.slice(i, i + 30));
      }

      let allFullQuestions: any[] = [];
      for (const chunk of chunks) {
        const qSnap = await getDocs(query(
          collection(db, 'questions'),
          where('__name__', 'in', chunk)
        ));
        allFullQuestions = [...allFullQuestions, ...qSnap.docs.map(d => ({ id: d.id, ...d.data() }))];
      }
      return allFullQuestions;
    } catch (error) {
      console.error("Error fetching full questions for details:", error);
      toast.error("Erro ao carregar detalhes das questões.");
      return exam.questions;
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleShowDetails = async (exam: Exam) => {
    setSelectedExamForDetails(exam);
    setShowDetails(true);
    
    const fullQuestions = await fetchFullQuestions(exam);
    setSelectedExamForDetails({ ...exam, questions: fullQuestions });
  };

  // Generative State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [autoFill, setAutoFill] = useState(false);
  const [autoFillCount, setAutoFillCount] = useState(10);

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
      const questions = await parseQuestionsFromText(text, selectedModel, userProfile?.role || 'TEACHER');
      setImportProgress(80);

      if (!questions || questions.length === 0) {
        throw new Error("Nenhuma questão encontrada no arquivo.");
      }

      // Save questions to bank and create exam
      const batch = writeBatch(db);
      const questionIds: string[] = [];

      const savedQuestions: any[] = [];
      for (const q of questions) {
        const qRef = doc(collection(db, 'questions'));
        const qData = {
          ...q,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          usoTotal: 0
        };
        batch.set(qRef, qData);
        savedQuestions.push({ id: qRef.id, ...qData });
      }

      const examRef = doc(collection(db, 'avaliacoes'));
      batch.set(examRef, {
        title: `Importado: ${file.name.split('.')[0]}`,
        description: `Avaliação importada do arquivo ${file.name}`,
        type: filterType === 'all' ? 'simulado' : filterType,
        status: 'rascunho',
        questions: savedQuestions,
        totalQuestions: savedQuestions.length,
        totalPoints: savedQuestions.length * 10,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      await batch.commit();
      setImportProgress(100);
      toast.success("Avaliação importada com sucesso!");
      fetchExams();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'avaliacoes');
      toast.error("Erro ao importar avaliação.");
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
        collection(db, 'avaliacoes'),
        where('createdBy', '==', user.uid),
        ...(filterType !== 'all' ? [where('type', '==', filterType)] : []),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'avaliacoes');
      toast.error(`Erro ao carregar simulados.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setAutoFill(false);
    setAutoFillCount(10);
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
    setAutoFill(false);
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
      let finalQuestions = currentExam.questions || [];
      // Only autofill on creation if enabled
      if (!currentExam.id && autoFill && finalQuestions.length === 0) {
        const qSnap = await getDocs(query(collection(db, 'questions'), limit(autoFillCount)));
        finalQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const examToSave = {
        ...currentExam,
        questions: finalQuestions,
        totalQuestions: finalQuestions.length,
        totalPoints: finalQuestions.length * 10,
        updatedAt: serverTimestamp()
      };

      if (currentExam.id) {
        await updateDoc(doc(db, 'avaliacoes', currentExam.id), examToSave);
        toast.success("Avaliação atualizada!");
      } else {
        await addDoc(collection(db, 'avaliacoes'), {
          ...examToSave,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
        toast.success("Avaliação criada!");
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'avaliacoes');
      toast.error("Erro ao salvar avaliação.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'avaliacoes', examToDelete));
      toast.success("Simulado excluído com sucesso.");
      fetchExams();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'avaliacoes');
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
      
      // If questions are already objects, use them. Otherwise fetch.
      let fullQuestions = [];
      if (exam.questions.length > 0 && typeof exam.questions[0] === 'object') {
        fullQuestions = exam.questions;
      } else {
        const questionsSnap = await getDocs(query(
          collection(db, 'questions'),
          where('__name__', 'in', exam.questions)
        ));
        fullQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

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
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-purple-50 text-purple-600 rounded-2xl font-bold hover:bg-purple-100 transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles size={20} /> IA Generativa
          </button>
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
              <div className="flex flex-col gap-2">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                  exam.status === 'publicado' ? 'bg-emerald-100 text-emerald-700' :
                  exam.status === 'encerrado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {exam.status}
                </div>
                {exam.isAdaptive && (
                  <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 self-start">
                    <BrainCircuit size={12} /> Adaptive
                  </div>
                )}
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

            <button 
              onClick={() => handleShowDetails(exam)}
              className="mt-6 w-full py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
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

                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-gray-700">Questões Selecionadas ({currentExam.questions?.length || 0})</label>
                       <button 
                         type="button"
                         onClick={() => setShowQuestionSelector(true)}
                         className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                       >
                         <Search size={14} /> Selecionar do Banco
                       </button>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-2 space-y-2">
                      {currentExam.questions && currentExam.questions.length > 0 ? (
                        currentExam.questions.map((q: any, idx: number) => (
                          <div key={q.id || idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 text-xs shadow-sm">
                            <span className="truncate flex-1 font-medium">Questão #{idx + 1}: {q.enunciado?.substring(0, 50)}...</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const newQs = currentExam.questions?.filter((item: any) => (item.id || item.questionUid) !== (q.id || q.questionUid)) || [];
                                setCurrentExam({...currentExam, questions: newQs});
                              }}
                              className="text-red-500 hover:text-red-700 px-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 text-center py-4 italic">Nenhuma questão selecionada manualmente.</p>
                      )}
                    </div>
                  </div>

                {!currentExam.id && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Preenchimento Automático</p>
                        <p className="text-[10px] text-gray-500">Selecionar questões aleatórias do banco</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={autoFill}
                          onChange={e => setAutoFill(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    {autoFill && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade de Questões (até 40)</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={autoFillCount}
                          onChange={e => setAutoFillCount(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Modo Adaptativo (Beta)</p>
                      <p className="text-[10px] text-indigo-600">O sistema ajusta a dificuldade em tempo real.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={currentExam.isAdaptive || false}
                      onChange={e => setCurrentExam({ ...currentExam, isAdaptive: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
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

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {showDetails && selectedExamForDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">
                      {selectedExamForDetails.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      selectedExamForDetails.status === 'publicado' ? 'bg-emerald-400 text-emerald-950' : 'bg-gray-400 text-gray-950'
                    }`}>
                      {selectedExamForDetails.status}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black">{selectedExamForDetails.title}</h3>
                  <p className="mt-2 text-indigo-100 font-medium">{selectedExamForDetails.description}</p>
                </div>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <p className="text-gray-500 font-bold">Carregando conteúdo da avaliação...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Questões</p>
                    <p className="text-2xl font-black text-gray-900">{selectedExamForDetails.totalQuestions}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duração</p>
                    <p className="text-2xl font-black text-gray-900">{selectedExamForDetails.duration} min</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entregas</p>
                    <p className="text-2xl font-black text-gray-900">{selectedExamForDetails.submissionsCount || 0}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-indigo-600" /> Conteúdo da Avaliação
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedExamForDetails.questions && selectedExamForDetails.questions.length > 0 ? (
                      selectedExamForDetails.questions.map((q: any, idx: number) => {
                        const isObject = typeof q === 'object' && q !== null;
                        return (
                          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                                {idx + 1}
                              </span>
                              {isObject && (
                                <span className="text-[10px] font-black uppercase text-gray-400">
                                  Dificuldade: {q.dificuldade || 'médio'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-800 font-medium leading-relaxed">
                              {isObject ? q.enunciado : `ID da Questão: ${q}`}
                            </p>
                            {isObject && q.opcoes && (
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.opcoes.map((opt: string, oIdx: number) => (
                                  <div 
                                    key={oIdx}
                                    className={`p-3 rounded-xl border text-sm flex gap-3 ${
                                      oIdx === q.respostaCorreta ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <span className="font-bold">{String.fromCharCode(65 + oIdx)})</span>
                                    <span>{opt}</span>
                                    {oIdx === q.respostaCorreta && (
                                      <Check size={16} className="ml-auto text-emerald-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                         <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                         <p className="text-gray-500 font-medium">Nenhuma questão vinculada a esta avaliação.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

              <div className="p-8 border-t bg-gray-50 flex justify-between items-center">
                <p className="text-sm font-bold text-gray-500">
                  Criado em: {selectedExamForDetails.createdAt?.seconds ? new Date(selectedExamForDetails.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
                <div className="flex gap-4">
                   <button 
                    onClick={() => {
                      setShowDetails(false);
                      handleEdit(selectedExamForDetails);
                    }}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                   >
                     <Edit2 size={18} /> Editar
                   </button>
                   <button 
                    onClick={() => setShowDetails(false)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                   >
                     Fechar
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GENERATE MODAL */}
      <ExamGenerator 
        isOpen={showGenerateModal} 
        onClose={() => setShowGenerateModal(false)} 
      />

      {/* QUESTION SELECTOR MODAL */}
      <AnimatePresence>
        {showQuestionSelector && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
                <div>
                  <h3 className="text-xl font-bold">Selecionar Questões do Banco</h3>
                  <p className="text-xs opacity-80">Escolha as questões que farão parte deste simulado.</p>
                </div>
                <button onClick={() => setShowQuestionSelector(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <BankQuestionPicker 
                  currentSelected={currentExam?.questions || []}
                  onToggle={(question) => {
                    if (!currentExam) return;
                    const prev = (currentExam.questions || []) as any[];
                    const questionId = question.id || question.questionUid;
                    const isSelected = prev.some(q => (q.id || q.questionUid) === questionId);
                    const next = isSelected 
                      ? prev.filter(q => (q.id || q.questionUid) !== questionId) 
                      : [...prev, question];
                    setCurrentExam({...currentExam, questions: next});
                  }}
                />
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">
                  {currentExam?.questions?.length || 0} questões selecionadas
                </span>
                <button 
                  onClick={() => setShowQuestionSelector(false)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all"
                >
                  Concluir Seleção
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function BankQuestionPicker({ currentSelected, onToggle }: { currentSelected: any[], onToggle: (q: any) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'questions'), orderBy('createdAt', 'desc'), limit(100)));
        setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        toast.error("Erro ao carregar banco");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = questions.filter(q => 
    q.enunciado.toLowerCase().includes(search.toLowerCase()) || 
    q.competenciaNome?.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (q: any) => currentSelected.some(s => (s.id || s.questionUid) === (q.id || q.questionUid));

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white z-10 pb-2">
        <input 
          type="text" 
          placeholder="Filtrar por enunciado ou competência..."
          className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(q => (
            <button
              key={q.id}
              onClick={() => onToggle(q)}
              className={`p-4 text-left border-2 rounded-2xl transition-all flex justify-between items-start gap-4 ${
                isSelected(q)
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-gray-100 hover:border-indigo-200 bg-white'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                     {q.competenciaNome || 'Geral'}
                   </span>
                   <span className="text-[10px] font-black uppercase text-gray-400">
                     {q.dificuldade || 'médio'}
                   </span>
                </div>
                <p className="text-sm font-medium text-gray-700 line-clamp-2">{q.enunciado}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected(q) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'
              }`}>
                {isSelected(q) && <Check size={14} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
