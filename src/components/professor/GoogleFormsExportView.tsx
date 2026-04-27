import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { exportQuestionsToGoogleForms, exportExamToGoogleForms, syncFormResponses } from '../../services/googleFormsService';
import { 
  Share2, FileText, ExternalLink, CheckCircle2, Loader2, Search, 
  Calendar, Users, Globe, Lock, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export function GoogleFormsExportView({ user, userProfile }: { user: any, userProfile: any }) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formType, setFormType] = useState<'internal' | 'external'>('external');
  const [importing, setImporting] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<any[]>([]);

  const handleImportQuestions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    
    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setImportedQuestions(results.data);
            setImporting(false);
            toast.success(`${results.data.length} questões importadas!`);
          }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setImportedQuestions(json);
          setImporting(false);
          toast.success(`${json.length} questões importadas!`);
        };
        reader.readAsBinaryString(file);
      } else if (file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ');
          }
          setImportedQuestions([{ enunciado: text }]);
          setImporting(false);
          toast.success(`Questões importadas do PDF!`);
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          setImportedQuestions([{ enunciado: text }]);
          setImporting(false);
          toast.success(`Questões importadas do documento!`);
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar arquivo.');
      setImporting(false);
    }
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleExport = async (exam: any) => {
    setExporting(exam.id);
    try {
      const result = await exportExamToGoogleForms(exam.id, { ...exam, formType });
      toast.success(`Simulado "${exam.title}" exportado como ${formType === 'internal' ? 'interno' : 'externo'} com sucesso!`);
      
      // Refresh local state
      setExams(prev => prev.map(e => e.id === exam.id ? { 
        ...e, 
        publicUrl: result.publicUrl,
        externalFormId: result.formId,
        formType: formType
      } : e));
    } catch (err) {
      toast.error('Erro ao exportar para Google Forms.');
    } finally {
      setExporting(null);
    }
  };

  const handleSync = async (exam: any) => {
    if (!exam.externalFormId) return;
    setSyncing(exam.id);
    try {
      await syncFormResponses(exam.id, exam.externalFormId);
      toast.success(`Respostas do simulado "${exam.title}" sincronizadas!`);
    } catch (err) {
      toast.error('Erro ao sincronizar respostas.');
    } finally {
      setSyncing(null);
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.discipline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Share2 className="text-emerald-600" size={32} />
            Exportação Google Forms
          </h1>
          <p className="text-gray-500 mt-1">Sincronize seus simulados SAEP com formulários externos via n8n.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFormType('internal')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                formType === 'internal' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Interno
            </button>
            <button
              onClick={() => setFormType('external')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                formType === 'external' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Externo
            </button>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer transition-all shadow-md">
            {importing ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
            Importar Questões
            <input type="file" accept=".csv,.xlsx,.pdf,.docx,.doc" className="hidden" onChange={handleImportQuestions} />
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar simulado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4 items-start">
        <Globe className="text-blue-600 shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-blue-900">Como funciona a integração?</h3>
          <p className="text-sm text-blue-700 mt-1 leading-relaxed">
            Ao clicar em exportar, o JuniorsStudent envia os dados do simulado para um workflow no n8n. 
            O n8n cria automaticamente o formulário no Google Forms e retorna o link público. 
            Isso permite que você aplique a prova em qualquer lugar e receba os resultados de volta na plataforma.
          </p>
        </div>
      </div>

      {/* Imported Questions Preview */}
      {importedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Questões Importadas ({importedQuestions.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setImporting(true);
                  try {
                    const result = await exportQuestionsToGoogleForms(
                      `Importação ${new Date().toLocaleDateString()}`,
                      importedQuestions
                    );
                    if (result.publicUrl) {
                      window.open(result.publicUrl, '_blank');
                      toast.success("Formulário criado com sucesso!");
                    }
                  } catch (e) {
                    toast.error("Erro ao exportar questões.");
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
              >
                {importing ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
                Exportar para Google Forms
              </button>
              <button 
                onClick={() => setImportedQuestions([])}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {importedQuestions.map((q, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                <p className="font-bold text-gray-900">{i + 1}. {q.enunciado || q.question || 'Sem enunciado'}</p>
                <div className="mt-2 text-gray-600">
                  {Object.entries(q).filter(([k]) => k.startsWith('alt')).map(([k, v]) => (
                    <p key={k}>{k}: {v as string}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <motion.div 
              key={exam.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  {exam.publicUrl ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={10} /> Sincronizado
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock size={10} /> Local
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{exam.discipline} • {exam.questions?.length || 0} questões</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    {exam.submissionsCount || 0} Respostas
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {exam.createdAt instanceof Timestamp ? exam.createdAt.toDate().toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                {exam.publicUrl ? (
                  <>
                    <a 
                      href={exam.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                    >
                      <ExternalLink size={14} />
                      Ver Form
                    </a>
                    <button 
                      onClick={() => handleSync(exam)}
                      disabled={syncing === exam.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {syncing === exam.id ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                      Sincronizar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleExport(exam)}
                    disabled={exporting === exam.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {exporting === exam.id ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
                    Exportar para Google Forms
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
