import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  SwitchCamera, 
  Plus, 
  Trash2, 
  Play, 
  History,
  AlertTriangle,
  Zap,
  Info,
  Check
} from 'lucide-react';
import { RuleEngineService, PedagogicalRule } from '../../services/ruleEngineService';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function PedagogicalRulesManager() {
  const [rules, setRules] = useState<PedagogicalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pedagogical_rules'), (snap) => {
      setRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as PedagogicalRule)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleRule = async (ruleId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'pedagogical_rules', ruleId), { active: !currentStatus });
  };

  const deleteRule = async (ruleId: string) => {
    if (confirm('Deseja realmente excluir esta regra pedagógica?')) {
      await deleteDoc(doc(db, 'pedagogical_rules', ruleId));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-amber-500" />
            Central de Regras Pedagógicas
          </h2>
          <p className="text-sm text-gray-500">Configure a lógica de automação e tomada de decisão do sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="px-4 py-2 flex items-center gap-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            <History size={16} />
            Logs de Execução
          </button>
          <button className="px-4 py-2 flex items-center gap-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
            <Plus size={16} />
            Nova Regra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <motion.div 
            key={rule.id}
            layout
            className={`p-6 bg-white rounded-2xl border ${rule.active ? 'border-emerald-100' : 'border-gray-100 opacity-60'} shadow-sm flex items-center justify-between group transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${rule.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                <Settings size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{rule.name}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    rule.actions[0]?.priority === 'critical' ? 'bg-red-100 text-red-600' : 
                    rule.actions[0]?.priority === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    Prio {rule.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-500 max-w-lg">{rule.description}</p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                    SE {rule.condition.metric} {rule.condition.operator} {rule.condition.value}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                    AÇÃO: {rule.actions.map(a => a.type).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleRule(rule.id!, rule.active)}
                className={`p-2 rounded-xl transition-all ${rule.active ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 bg-gray-50'}`}
              >
                <Check size={20} />
              </button>
              <button 
                onClick={() => deleteRule(rule.id!)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showLogs && (
        <div className="mt-12 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <History className="text-gray-400" size={20} />
            Histórico Recente de Disparos
          </h3>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-600">Regra</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Alvo (Aluno/Turma)</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Valor Captado</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Ações</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">Risco Crítico de Desempenho</td>
                  <td className="px-6 py-4">Ana Souza (Turma A)</td>
                  <td className="px-6 py-4 text-red-500 font-bold">28%</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold">Alertar Professor</span></td>
                  <td className="px-6 py-4 text-gray-400">Há 2 horas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
