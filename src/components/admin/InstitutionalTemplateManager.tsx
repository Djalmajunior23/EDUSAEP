import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Library, 
  FileText, 
  Copy, 
  Plus, 
  Search, 
  Grid, 
  List,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export function InstitutionalTemplateManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'institutional_templates'), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Library className="text-emerald-600" />
            Templates Institucionais
          </h2>
          <p className="text-sm text-gray-500">Padronização de atividades, rubricas e feedbacks.</p>
        </div>
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center gap-2 transition-all">
          <Plus size={18} />
          Criar Novo Template
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        {['all', 'Atividade', 'Rubrica', 'Simulado', 'Feedback'].map((t) => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              (filter === t || (t === 'all' && filter === 'all'))
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? 'Ver Todos' : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="lg:col-span-3 py-20 text-center space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <FileText className="mx-auto text-gray-300" size={48} />
            <div>
              <p className="text-gray-900 font-bold">Nenhum template encontrado</p>
              <p className="text-sm text-gray-500">Comece padronizando sua primeira atividade institucional.</p>
            </div>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={10} />
                  Verificado
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{template.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{template.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{template.type}</span>
                <button className="p-2 text-gray-300 hover:text-emerald-600 transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
