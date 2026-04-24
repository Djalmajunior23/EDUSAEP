import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BrainCircuit,
  BarChart3,
  Tag,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  History,
  Target,
  FileUp,
  FileText,
  Table,
  FileSpreadsheet,
  X,
  Save,
  ExternalLink,
  Zap,
  Code,
  Image as ImageIcon,
  Archive,
  Layout as LayoutIcon,
  Activity
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { generateContentWrapper, getSystemInstruction, parseQuestionsFromText, generateQuestionVariation, generateMultipleQuestionVariations, analyzeQuestionByPerformance, QuestionAnalysisResult } from '../../services/geminiService';
import { exportQuestionsToGoogleForms } from '../../services/googleFormsService';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import { Question } from '../../types';
import { AdvancedQuestionGenerator } from './AdvancedQuestionGenerator';
import { QuestionRenderer } from '../common/QuestionRenderer';
import { Eye, ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Competency {
  id: string;
  name: string;
}

export function QuestionsBankView({ user, userProfile, selectedModel }: { user: any, userProfile: any, selectedModel: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCompetency, setFilterCompetency] = useState('all');
  const [filterAiOnly, setFilterAiOnly] = useState(false);
  const [isGeneratingVariation, setIsGeneratingVariation] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [showAdvancedGenerator, setShowAdvancedGenerator] = useState(false);

  // Analysis states
  const [isAnalyzingQuestion, setIsAnalyzingQuestion] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{questionId: string, result: QuestionAnalysisResult} | null>(null);
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [missingCompetencies, setMissingCompetencies] = useState<string[]>([]);
  const [mappedCompetencies, setMappedCompetencies] = useState<Record<string, string>>({});
  const [tempQuestions, setTempQuestions] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Variation states
  const [variationModalConfig, setVariationModalConfig] = useState<{isOpen: boolean, question: Question | null, count: number}>({isOpen: false, question: null, count: 5});

  useEffect(() => {
    fetchQuestions();
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      const discSnap = await getDocs(query(collection(db, 'disciplines'), orderBy('name')));
      const compSnap = await getDocs(query(collection(db, 'competencias'), orderBy('name')));
      
      const list = [
        ...discSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...compSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      
      // Filter out empty names and duplicates
      const uniqueMap = new Map();
      list.forEach(item => {
        const n = ((item as any).nome || (item as any).name || '').trim();
        if (n && !uniqueMap.has(n)) {
          uniqueMap.set(n, item);
        }
      });
      
      setDisciplines(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching disciplines:", error);
    }
  };

  const handleEditClick = (quest: Question) => {
    setEditingQuestionId(quest.id!);
    setEditedQuestion(quest);
  };

  const handleCreateClick = () => {
    setEditingQuestionId('new');
    setEditedQuestion({
      enunciado: '',
      dificuldade: 'médio',
      bloom: 'compreender',
      tipoQuestao: 'multipla_escolha',
      competenciaNome: (disciplines[0] as any)?.nome || (disciplines[0] as any)?.name || 'Geral',
      competenciaId: disciplines[0]?.id || 'unknown',
      temaNome: 'Geral',
      tags: [],
      alternativas: [
        { id: 'A', texto: '' },
        { id: 'B', texto: '' },
        { id: 'C', texto: '' },
        { id: 'D', texto: '' }
      ],
      respostaCorreta: 'A',
      assets: []
    });
  };

  const addAsset = (type: 'image' | 'code' | 'table' | 'case_study' | 'diagram') => {
    const newAssets = [...(editedQuestion.assets || [])];
    newAssets.push({
      id: Math.random().toString(36).substring(7),
      type,
      content: '',
      title: '',
      caption: '',
      language: type === 'code' ? 'javascript' : undefined
    });
    setEditedQuestion({ ...editedQuestion, assets: newAssets });
    toast.info(`Recurso do tipo ${type} adicionado.`);
  };

  const removeAsset = (index: number) => {
    const newAssets = [...(editedQuestion.assets || [])];
    newAssets.splice(index, 1);
    setEditedQuestion({ ...editedQuestion, assets: newAssets });
  };

  const updateAsset = (index: number, updates: any) => {
    const newAssets = [...(editedQuestion.assets || [])];
    newAssets[index] = { ...newAssets[index], ...updates };
    setEditedQuestion({ ...editedQuestion, assets: newAssets });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestionId) return;
    setIsSavingEdit(true);
    try {
      if (editingQuestionId === 'new') {
        const questionData = {
          ...editedQuestion,
          origem: 'manual',
          usoTotal: 0,
          revisadaPorProfessor: true,
          status: 'publicado',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'questions'), questionData);
        toast.success("Questão criada com sucesso!");
      } else {
        const docRef = doc(db, 'questions', editingQuestionId);
        await updateDoc(docRef, {
          ...editedQuestion,
          updatedAt: serverTimestamp()
        });
        toast.success("Questão atualizada com sucesso!");
      }
      setEditingQuestionId(null);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Erro ao salvar questão.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (questId: string) => {
    try {
      await deleteDoc(doc(db, 'questions', questId));
      toast.success("Questão apagada!");
      fetchQuestions();
    } catch (e) {
      toast.error("Erro ao apagar questão.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      setIsImporting(true);
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const text = JSON.stringify(results.data);
          await processImportedQuestions(text);
        },
        error: (error) => {
          console.error("CSV Parse Error:", error);
          toast.error("Erro ao ler arquivo CSV.");
          setIsImporting(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          await processImportedQuestions(JSON.stringify(data));
        } catch (error) {
          console.error("Excel Parse Error:", error);
          toast.error("Erro ao ler arquivo Excel.");
          setIsImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileName.endsWith('.pdf')) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const typedarray = new Uint8Array(evt.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
            setImportProgress(Math.round((i / pdf.numPages) * 100));
          }
          
          await processImportedQuestions(fullText);
        } catch (error) {
          console.error("PDF Parse Error:", error);
          toast.error("Erro ao ler arquivo PDF.");
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileName.endsWith('.docx')) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          await processImportedQuestions(result.value);
        } catch (error) {
          console.error("DOCX Parse Error:", error);
          toast.error("Erro ao ler arquivo DOCX.");
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Formato de arquivo não suportado. Use CSV, Excel, PDF ou DOCX.");
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImportedQuestions = async (text: string) => {
    setImportProgress(0);
    try {
      toast.info("A IA está analisando o conteúdo e extraindo as questões...");
      const parsedQuestions = await parseQuestionsFromText(text, selectedModel, 'TEACHER');
      
      if (!parsedQuestions || parsedQuestions.length === 0) {
        toast.error("Nenhuma questão identificada no arquivo.");
        setIsImporting(false);
        return;
      }

      // Check for missing competencies
      const uniqueCompetencies = Array.from(new Set(parsedQuestions.map(q => q.competenciaNome)));
      const existingCompetencies = disciplines.map(d => d.name);
      const missing = uniqueCompetencies.filter(c => !existingCompetencies.includes(c));

      if (missing.length > 0) {
        setMissingCompetencies(missing);
        setTempQuestions(parsedQuestions);
        setShowMappingModal(true);
      } else {
        await saveImportedQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error("Error processing questions:", error);
      toast.error("Erro ao processar questões com IA.");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const saveImportedQuestions = async (questionsToSave: any[]) => {
    try {
      const batch = writeBatch(db);
      const questionsCol = collection(db, 'questions');
      
      questionsToSave.forEach(q => {
        const newDocRef = doc(questionsCol);
        batch.set(newDocRef, {
          ...q,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          usoTotal: 0,
          status: 'rascunho'
        });
      });

      await batch.commit();
      toast.success(`${questionsToSave.length} questões importadas com sucesso!`);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Erro ao salvar questões no banco.");
    }
  };

  const handleSaveMappedQuestions = async () => {
    const finalQuestions = tempQuestions.map(q => {
      const mappedName = mappedCompetencies[q.competenciaNome];
      if (mappedName) {
        return { ...q, competenciaNome: mappedName };
      }
      return q;
    });

    await saveImportedQuestions(finalQuestions);
    setShowMappingModal(false);
    setTempQuestions([]);
    setMappedCompetencies({});
  };

  const handleExportToGoogleForms = async () => {
    if (filteredQuestions.length === 0) {
      toast.error("Não há questões filtradas para exportar.");
      return;
    }

    try {
      toast.info("Preparando exportação para Google Forms...");
      const result = await exportQuestionsToGoogleForms("Banco de Questões - EDUSAEP", filteredQuestions);
      if (result.success) {
        toast.success("Exportação concluída!");
        window.open(result.formUrl, '_blank');
      } else {
        toast.error("Erro na exportação.");
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Erro ao exportar para Google Forms.");
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'questions'),
        orderBy('usoTotal', 'desc')
      );
      const snap = await getDocs(q);
      setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Erro ao carregar banco de questões.");
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleVariations = async () => {
    const original = variationModalConfig.question;
    const count = variationModalConfig.count;
    if (!original || !original.id) return;

    setVariationModalConfig(prev => ({ ...prev, isOpen: false }));
    setIsGeneratingVariation(original.id);
    
    try {
      toast.info(`A IA está gerando ${count} variações contextuais da questão...`);
      const newQuestions = await generateMultipleQuestionVariations(original, count, selectedModel, 'TEACHER');
      
      const batch = writeBatch(db);
      const questionsCol = collection(db, 'questions');

      newQuestions.forEach(newQ => {
        const newDocRef = doc(questionsCol);
        batch.set(newDocRef, {
          ...original,
          ...newQ,
          origem: 'ia_variacao_lote',
          originalQuestionId: original.id,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          usoTotal: 0,
          status: 'rascunho'
        });
      });

      await batch.commit();

      toast.success(`${newQuestions.length} variações geradas com sucesso e salvas como rascunho!`);
      fetchQuestions();
    } catch (error) {
      console.error("Error generating variations:", error);
      toast.error("Erro ao gerar variações da questão.");
    } finally {
      setIsGeneratingVariation(null);
    }
  };

  const handleAnalyzeQuestion = async (question: Question) => {
    if (!question.id) return;
    setIsAnalyzingQuestion(question.id);
    
    // Automatically expand the question so the analysis block is visible
    if (expandedQuestionId !== question.id) {
      setExpandedQuestionId(question.id);
    }
    
    try {
      toast.info('Analisando questão com base em dados simulados de desempenho...');
      // MOCK: in a real app, you would fetch real stats from completed exams that used this question.
      const mockStats = {
        totalAnswers: Math.floor(Math.random() * 50) + 10,
        correctAnswers: Math.floor(Math.random() * 20),
        commonErrors: [
          "Alunos confundiram a alternativa B com o conceito principal (erro de distração)",
          "Baixa taxa de conclusão para esta questão (possível erro de interpretação do enunciado)"
        ]
      };
      
      const analysis = await analyzeQuestionByPerformance(question, mockStats, selectedModel, 'professor');
      setAnalysisResult({ questionId: question.id, result: analysis });
      toast.success('Análise concluída com sucesso!');
    } catch (error) {
      console.error("Error analyzing question:", error);
      toast.error("Erro ao analisar questão.");
    } finally {
      setIsAnalyzingQuestion(null);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.enunciado.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         q.competenciaNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.dificuldade === filterDifficulty;
    const matchesCompetency = filterCompetency === 'all' || q.competenciaNome === filterCompetency;
    const matchesAi = !filterAiOnly || q.isAiGenerated;
    return matchesSearch && matchesDifficulty && matchesCompetency && matchesAi;
  });

  const filteredCompetencies = useMemo(() => {
    // Combine names from existing questions AND fetched disciplines/competencies
    const fromQuestions = questions.map(q => q.competenciaNome);
    const fromDisciplines = disciplines.map(d => d.nome || d.name);
    return Array.from(new Set([...fromQuestions, ...fromDisciplines])).filter(Boolean).sort();
  }, [questions, disciplines]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium">Acessando banco de inteligência...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.xlsx,.xls,.pdf,.docx"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Database className="text-indigo-600" size={32} /> Banco Inteligente de Questões
          </h2>
          <p className="text-gray-500 mt-1">Gestão centralizada, variações por IA e análise de calibração.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.href = '/question-optimizer'}
            className="px-4 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl font-bold hover:bg-amber-100 transition-all flex items-center gap-2"
          >
            <Sparkles size={20} /> Otimizar com IA
          </button>
          <button 
            onClick={handleExportToGoogleForms}
            className="px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ExternalLink size={20} /> Exportar Forms
          </button>
          <button 
            onClick={() => setShowAdvancedGenerator(true)}
            className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
          >
            <BrainCircuit size={20} /> Geração Avançada
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={20} className="animate-spin" /> : <FileUp size={20} />}
            Importar Arquivo
          </button>
          <button 
            onClick={handleCreateClick}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={20} /> Nova Questão
          </button>
        </div>
      </div>

      {/* Import Progress */}
      {isImporting && importProgress > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Processando documento...</span>
            <span className="text-sm font-bold text-indigo-600">{importProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300" 
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      <AnimatePresence>
        {showMappingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Mapeamento de Competências</h3>
                  <p className="text-sm text-gray-500">Algumas competências do arquivo não foram encontradas no sistema.</p>
                </div>
                <button onClick={() => setShowMappingModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                {missingCompetencies.map(missing => (
                  <div key={missing} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle size={18} />
                      <span className="font-bold text-sm">No Arquivo: {missing}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mapear para:</label>
                      <select 
                        value={mappedCompetencies[missing] || ''}
                        onChange={e => setMappedCompetencies({ ...mappedCompetencies, [missing]: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Criar nova competência: "{missing}"</option>
                        {disciplines.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowMappingModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveMappedQuestions}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Save size={20} /> Confirmar e Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por enunciado ou competência..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <select 
          value={filterDifficulty}
          onChange={e => setFilterDifficulty(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">Todas Dificuldades</option>
          <option value="fácil">Fácil</option>
          <option value="médio">Médio</option>
          <option value="difícil">Difícil</option>
        </select>
        <select 
          value={filterCompetency}
          onChange={e => setFilterCompetency(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">Todas Competências</option>
          {filteredCompetencies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl">
          <input type="checkbox" checked={filterAiOnly} onChange={e => setFilterAiOnly(e.target.checked)} />
          <span className="text-sm font-bold text-gray-700">Apenas IA</span>
        </label>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map(question => (
          <motion.div 
            key={question.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    question.dificuldade === 'difícil' ? 'bg-red-100 text-red-700' :
                    question.dificuldade === 'médio' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {question.dificuldade}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase">
                    {question.competenciaNome}
                  </span>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                    <BrainCircuit size={12} /> {question.bloom}
                  </span>
                  {question.isAiGenerated && (
                     <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <Sparkles size={12} /> IA
                    </span>
                  )}
                  {question.taxaAcerto !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                      question.taxaAcerto < 40 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Target size={12} /> {question.taxaAcerto}% Acerto
                    </span>
                  )}
                  {question.assets && question.assets.length > 0 && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <Zap size={12} /> Multimídia
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <p className={cn(
                    "text-gray-900 font-bold leading-relaxed transition-all",
                    expandedQuestionId !== question.id ? "line-clamp-2" : ""
                  )}>
                    {question.enunciado}
                  </p>
                  
                  <AnimatePresence>
                    {expandedQuestionId === question.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-4"
                      >
                        <QuestionRenderer question={question as any} showCorrectAnswer={true} />
                        
                        {analysisResult && analysisResult.questionId === question.id && (
                          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm mt-4">
                            <div className="flex items-center justify-between mb-4">
                               <h4 className="font-bold text-emerald-900 flex items-center gap-2 text-lg">
                                 <Activity size={20} className="text-emerald-600" /> 
                                 Análise Cognitiva e de Desempenho
                               </h4>
                               <button 
                                 onClick={() => setAnalysisResult(null)}
                                 className="text-emerald-500 hover:text-emerald-700"
                               >
                                 <X size={20} />
                               </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                   <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Diagnóstico do Enunciado</p>
                                   <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.result.diagnosticoEnunciado}</p>
                                   {analysisResult.result.sugestaoReformulacaoEnunciado && (
                                     <div className="mt-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                       <p className="text-xs font-bold text-emerald-700 mb-1">Sugestão de Reformulação:</p>
                                       <p className="text-sm text-emerald-900 italic font-medium">{analysisResult.result.sugestaoReformulacaoEnunciado}</p>
                                     </div>
                                   )}
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                   <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Adequação Pedagógica</p>
                                   <span className={cn(
                                     "px-3 py-1 rounded-full text-xs font-black uppercase inline-block",
                                     analysisResult.result.nivelAdequacao === 'Baixo' ? "bg-red-100 text-red-700" :
                                     analysisResult.result.nivelAdequacao === 'Médio' ? "bg-amber-100 text-amber-700" :
                                     "bg-emerald-100 text-emerald-700"
                                   )}>
                                     Nível {analysisResult.result.nivelAdequacao}
                                   </span>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                   <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Diagnóstico das Alternativas</p>
                                   <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.result.diagnosticoAlternativas}</p>
                                </div>
                                
                                {analysisResult.result.sugestaoReformulacaoAlternativas && analysisResult.result.sugestaoReformulacaoAlternativas.length > 0 && (
                                  <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-3">Sugestões (Distratores)</p>
                                    <div className="space-y-3">
                                      {analysisResult.result.sugestaoReformulacaoAlternativas.map((alt, i) => (
                                        <div key={i} className="text-sm border-l-2 border-emerald-300 pl-3">
                                          <p className="font-bold text-gray-900">Alternativa {alt.id}</p>
                                          <p className="text-gray-500 line-through text-xs mb-1">{alt.textoAtual}</p>
                                          <p className="text-emerald-700 font-medium text-xs mb-1">Novo: {alt.novoTextoSugerido}</p>
                                          <p className="text-gray-600 text-xs italic">"{alt.justificativa}"</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><History size={14} /> Usada {question.usoTotal} vezes</span>
                  <span className="flex items-center gap-1.5"><Tag size={14} /> {question.tags.join(', ')}</span>
                  <button 
                    onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id || null)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {expandedQuestionId === question.id ? <ChevronUpIcon size={14} /> : <Eye size={14} />}
                    {expandedQuestionId === question.id ? 'Fechar Detalhes' : 'Visualizar Rich Content'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleAnalyzeQuestion(question)}
                  disabled={isAnalyzingQuestion === question.id}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="Analisar Desempenho e Erros Cognitivos"
                >
                  {isAnalyzingQuestion === question.id ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} />}
                </button>
                <button 
                  onClick={() => setVariationModalConfig({ isOpen: true, question, count: 5 })}
                  disabled={isGeneratingVariation === question.id}
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  title="Gerar Múltiplas Variações com IA"
                >
                  {isGeneratingVariation === question.id ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>
                <button onClick={() => handleEditClick(question)} className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all shadow-sm">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDelete(question.id!)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
            <Database size={64} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-900">Nenhuma questão encontrada</h3>
            <p className="text-gray-500">Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {editingQuestionId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingQuestionId === 'new' ? <Plus size={24} className="text-emerald-600"/> : <Edit2 size={24} className="text-indigo-600"/>} 
                  {editingQuestionId === 'new' ? 'Criar Nova Questão' : 'Editar Questão'}
                </h3>
                <button onClick={() => setEditingQuestionId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Enunciado (Markdown)</label>
                    <button 
                      onClick={() => {
                        const tableTemplate = "\n\n| Item | Valor A | Valor B |\n| :--- | :---: | :---: |\n| Parâmetro 1 | 100 | 200 |\n| Parâmetro 2 | Ativo | Inativo |\n\n";
                        setEditedQuestion({...editedQuestion, enunciado: (editedQuestion.enunciado || '') + tableTemplate});
                      }}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                    >
                      <Table size={12} /> Inserir Tabela Comparativa
                    </button>
                  </div>
                  <textarea 
                    value={editedQuestion.enunciado || ''}
                    onChange={e => setEditedQuestion({...editedQuestion, enunciado: e.target.value})}
                    placeholder="Suporta Markdown e Tabelas..."
                    className="w-full p-3 rounded-xl border border-gray-200 min-h-[120px] font-mono text-sm"
                  />
                </div>

                {/* Preview Section within Edit Modal */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase text-gray-400">
                    <Eye size={12} /> Pré-visualização do Enunciado
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <QuestionRenderer question={{ ...editedQuestion as any }} showCorrectAnswer={false} className="space-y-0" />
                  </div>
                </div>

                {/* Asset Management Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                      <Zap size={18} className="text-indigo-600" /> Recursos da Questão ({editedQuestion.assets?.length || 0})
                    </label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => addAsset('image')}
                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        title="Adicionar Imagem via URL"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button 
                        onClick={() => addAsset('code')}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Adicionar Bloco de Código"
                      >
                        <Code size={16} />
                      </button>
                      <button 
                        onClick={() => addAsset('table')}
                        className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                        title="Adicionar Tabela (JSON)"
                      >
                        <Table size={16} />
                      </button>
                      <button 
                        onClick={() => addAsset('case_study')}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Adicionar Estudo de Caso"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        onClick={() => addAsset('diagram')}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        title="Adicionar Diagrama"
                      >
                        <LayoutIcon size={16} />
                      </button>
                    </div>
                  </div>

                  {editedQuestion.assets && editedQuestion.assets.length > 0 ? (
                    <div className="space-y-3">
                      {editedQuestion.assets.map((asset, index) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={asset.id} 
                          className="p-4 bg-gray-50 border border-gray-200 rounded-2xl relative group"
                        >
                          <button 
                            onClick={() => removeAsset(index)}
                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn(
                                "p-1.5 rounded-lg",
                                asset.type === 'image' ? "bg-purple-100 text-purple-600" :
                                asset.type === 'code' ? "bg-blue-100 text-blue-600" :
                                asset.type === 'table' ? "bg-pink-100 text-pink-600" :
                                asset.type === 'case_study' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                              )}>
                                {asset.type === 'image' ? <ImageIcon size={12} /> :
                                 asset.type === 'code' ? <Code size={12} /> :
                                 asset.type === 'table' ? <Table size={12} /> :
                                 asset.type === 'case_study' ? <FileText size={12} /> : <LayoutIcon size={12} />}
                              </div>
                              <span className="text-[10px] font-black uppercase text-gray-400">Recurso #{index + 1}: {asset.type.replace('_', ' ')}</span>
                            </div>
                            
                            <input 
                              type="text"
                              placeholder="Título (Ex: Arquitetura do Sistema)"
                              value={asset.title || ''}
                              onChange={e => updateAsset(index, { title: e.target.value })}
                              className="w-full p-2 text-sm font-bold border-b border-gray-200 bg-transparent focus:border-indigo-500 outline-none transition-all placeholder:font-normal"
                            />
                            
                            {asset.type === 'image' || asset.type === 'diagram' ? (
                              <input 
                                type="text"
                                placeholder="URL Pública da Imagem / Diagrama"
                                value={asset.content}
                                onChange={e => updateAsset(index, { content: e.target.value })}
                                className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                              />
                            ) : asset.type === 'code' ? (
                              <div className="space-y-2">
                                <div className="flex gap-2 flex-wrap">
                                  {['javascript', 'python', 'sql', 'cpp', 'java', 'html', 'css'].map(lang => (
                                    <button
                                      key={lang}
                                      onClick={() => updateAsset(index, { language: lang })}
                                      className={cn(
                                        "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all",
                                        asset.language === lang ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-200"
                                      )}
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </div>
                                <textarea 
                                  placeholder="Cole seu código aqui..."
                                  value={asset.content}
                                  onChange={e => updateAsset(index, { content: e.target.value })}
                                  className="w-full p-3 text-sm border border-gray-200 rounded-xl font-mono h-32 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                            ) : asset.type === 'table' ? (
                              <div className="space-y-2">
                                <textarea 
                                  placeholder='JSON da Tabela. Ex: {"headers": ["A", "B"], "rows": [["1", "2"]]}'
                                  value={asset.content}
                                  onChange={e => updateAsset(index, { content: e.target.value })}
                                  className="w-full p-3 text-sm border border-gray-200 rounded-xl font-mono h-32 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                                <button 
                                  onClick={() => {
                                    const example = JSON.stringify({
                                      headers: ["Item", "Especificação", "Valor"],
                                      rows: [
                                        ["Processador", "Octa-core", "2.8GHz"],
                                        ["RAM", "LPDDR5", "8GB"]
                                      ]
                                    }, null, 2);
                                    updateAsset(index, { content: example });
                                  }}
                                  className="text-[10px] font-black uppercase text-indigo-600 underline"
                                >
                                  Usar Exemplo de Tabela
                                </button>
                              </div>
                            ) : (
                               <textarea 
                                 placeholder="Descreva o Estudo de Caso ou Cenário aqui..."
                                 value={asset.content}
                                 onChange={e => updateAsset(index, { content: e.target.value })}
                                 className="w-full p-3 text-sm border border-gray-200 rounded-xl italic h-32 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                               />
                            )}
                            
                            <input 
                              type="text"
                              placeholder="Legenda pedagógica para o rodapé do recurso"
                              value={asset.caption || ''}
                              onChange={e => updateAsset(index, { caption: e.target.value })}
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl italic bg-white"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                      <p className="text-gray-400 text-sm italic">Nenhum recurso multimídia anexado. Use os ícones acima para adicionar imagens, código ou tabelas.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Dificuldade</label>
                  <select 
                    value={editedQuestion.dificuldade || 'médio'}
                    onChange={e => setEditedQuestion({...editedQuestion, dificuldade: e.target.value as any})}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="fácil">Fácil</option>
                    <option value="médio">Médio</option>
                    <option value="difícil">Difícil</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Alternativas</label>
                  {editedQuestion.alternativas?.map((alt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="font-bold text-gray-500">{alt.id})</span>
                      <input 
                        type="text" 
                        value={alt.texto}
                        onChange={e => {
                          const newAlts = [...editedQuestion.alternativas!];
                          newAlts[idx] = { ...newAlts[idx], texto: e.target.value };
                          setEditedQuestion({...editedQuestion, alternativas: newAlts});
                        }}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <button 
                        onClick={() => setEditedQuestion({...editedQuestion, respostaCorreta: alt.id})}
                        className={`px-3 py-1 text-xs font-bold rounded-lg ${editedQuestion.respostaCorreta === alt.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        Correta?
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => setEditingQuestionId(null)} className="px-6 py-2 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button disabled={isSavingEdit} onClick={handleSaveEdit} className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                  {isSavingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Variation Configuration Modal */}
      <AnimatePresence>
        {variationModalConfig.isOpen && variationModalConfig.question && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles size={24} className="text-indigo-600"/> Variações (IA)</h3>
                <button onClick={() => setVariationModalConfig(prev => ({...prev, isOpen: false }))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm mb-4">
                  O Gemini analisará a taxonomia desta questão e gerará novas versões mantendo o conceito original, mas mudando o cenário ou dados numéricos.
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade de Variações:</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    value={variationModalConfig.count}
                    onChange={e => setVariationModalConfig(prev => ({...prev, count: parseInt(e.target.value) || 1}))}
                    className="w-full p-3 rounded-xl border border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">Gera de 1 a 10 versões diferentes da mesma pergunta.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => setVariationModalConfig(prev => ({...prev, isOpen: false }))} className="px-6 py-2 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleMultipleVariations} className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                  <Sparkles size={16} /> 
                  Gerar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Question Generator Modal */}
      {showAdvancedGenerator && (
        <AdvancedQuestionGenerator
          competencies={disciplines}
          currentDiscipline="Geral"
          onClose={() => setShowAdvancedGenerator(false)}
          onQuestionsGenerated={async (newQuestions) => {
            await saveImportedQuestions(newQuestions);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}
