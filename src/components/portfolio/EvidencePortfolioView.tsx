import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Archive, Plus, ExternalLink, Award, FileText, ArrowRight, Loader2, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { pdfExportService } from '../../services/pdfExportService';

interface PortfolioItem {
  id: string;
  studentId: string;
  title: string;
  description: string;
  evidenceUrl: string;
  competencies: string[];
  createdAt: any;
}

export function EvidencePortfolioView() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Item State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [competencies, setCompetencies] = useState('');

  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const fetchPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'evidence_portfolio'),
        where('studentId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem)));
    } catch (err) {
      console.error("Erro ao buscar portfólio", err);
      toast.error("Não foi possível carregar o portfólio de evidências.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsAdding(true);
    try {
      const compArray = competencies.split(',').map(c => c.trim()).filter(Boolean);
      
      const newItem = {
        studentId: user.uid,
        title,
        description,
        evidenceUrl,
        competencies: compArray,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'evidence_portfolio'), newItem);
      toast.success("Evidência adicionada ao portfólio!");
      
      setTitle('');
      setDescription('');
      setEvidenceUrl('');
      setCompetencies('');
      
      fetchPortfolio();
    } catch (err) {
      console.error("Erro ao adicionar evidência", err);
      toast.error("Ocorreu um erro ao salvar sua evidência.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    toast.info("Preparando a exportação do portfólio...");
    try {
      await pdfExportService.exportElementToPDF(reportRef.current, `Portfolio_Evidencias_${new Date().getTime()}`);
      toast.success("Portfólio exportado com sucesso!");
    } catch (error) {
      toast.error("Falha ao exportar PDF do portfólio.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <span className="font-medium">Carregando Acervo Digital...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Archive className="text-indigo-600" size={32} /> Portfólio por Evidência
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Seu registro longitudinal de aprendizagem (Módulo 8).</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={18} /> Exportar Acervo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form to Add New Evidence */}
        <div className="lg:col-span-1 border border-gray-200 bg-white shadow-sm p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="text-indigo-500" /> Nova Evidência
          </h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Atividade ou Projeto</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Ex: Redação Nota 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição / Reflexão</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Descreva o que você aprendeu com esta evidência..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Link de Comprovação (URL)</label>
              <input 
                type="url" 
                required
                value={evidenceUrl}
                onChange={e => setEvidenceUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Competências Desenvolvidas</label>
              <input 
                type="text" 
                required
                value={competencies}
                onChange={e => setCompetencies(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Ex: Escrita Criativa, Gramática (separadas por vírgula)"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar no Portfólio"}
            </button>
          </form>
        </div>

        {/* Portfolio Listing */}
        <div className="lg:col-span-2 space-y-6" ref={reportRef}>
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-4">
            <Award className="text-indigo-600 shrink-0 w-8 h-8" />
            <div>
              <h3 className="font-bold text-indigo-900">Seu DNA Estudantil</h3>
              <p className="text-indigo-800 text-sm mt-1 text-balance">
                O portfólio por evidências é o seu histórico ativo. Universitários e instituições valorizam cada vez mais não apenas as notas (desempenho), mas a trajetória e os artefatos construídos durante o aprendizado.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700">O seu portfólio está vazio.</h3>
                <p className="text-gray-500">Adicione seu primeiro projeto, medalha ou certificado ao lado.</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 pr-8">{item.title}</h3>
                    <a 
                      href={item.evidenceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Abrir Evidência Externa"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                  
                  <p className="text-gray-600 mb-6 text-sm italic border-l-2 border-gray-100 pl-4">
                    "{item.description}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.competencies.map((comp, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold flex items-center gap-1">
                        <ArrowRight size={12} className="opacity-50" /> {comp}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 text-xs font-medium text-gray-400 pt-4 border-t border-gray-50 flex items-center gap-2">
                    <Clock size={12} /> Adicionado em: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
