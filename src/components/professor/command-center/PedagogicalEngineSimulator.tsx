import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Database, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function PedagogicalEngineSimulator({ onRefresh }: { onRefresh?: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info' | 'success' | 'error' }[]>([]);

  const addLog = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev]);
  };

  const simulateBatchClassEvaluation = async () => {
    setIsProcessing(true);
    addLog('Solicitando execução em batch via N8N Webhook/Cloud Function no servidor...', 'info');
    
    // Mostramos toast para melhor feedback
    const toastId = toast.loading('Motor Pedagógico trabalhando...');

    try {
      // Simulate real delay as the cloud function processes components
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Since we removed the backend proxy/client for cleanup, we use local simulation
      addLog('Motor avaliou todos os alunos de "Turma 3º Ano - TDS".', 'info');
      addLog('Saúde da turma recalculada (ClassHealthSnapshot atualizado).', 'success');
      toast.success('Lote processado com sucesso!', { id: toastId });
      if (onRefresh) onRefresh();
    } catch (error: any) {
      addLog(`Falha na requisição: ${error.message || 'Erro desconhecido'}`, 'error');
      toast.error('Simulação travou! Verifique o console.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl flex items-center gap-2">
            <RefreshCw size={24} className="text-indigo-400" />
            Engrenagem do Motor Pedagógico
          </h3>
          <p className="text-xs text-slate-400 mt-1">Dispare chamadas para o Backend (Simula N8N/Hooks)</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase">
          Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button 
          onClick={simulateBatchClassEvaluation}
          disabled={isProcessing}
          className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex flex-col gap-2 transition-colors border border-indigo-500"
        >
          <div className="flex items-center gap-2 font-bold">
            <Database size={18} /> Processar Turma Inteira
          </div>
          <p className="text-xs text-indigo-200 text-left">Roda recalculação de score de risco e proficiência para toda a turma de TDS.</p>
        </button>

        <button 
          disabled={true}
          className="p-4 bg-slate-800 opacity-60 cursor-not-allowed rounded-2xl flex flex-col gap-2 border border-slate-700"
        >
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <Play size={18} /> Forçar Aluno (Hook de Submissão)
          </div>
          <p className="text-xs text-slate-500 text-left">Simula o envio de uma prova por um aluno específico.</p>
        </button>
      </div>

      <div className="bg-black/50 border border-slate-700 rounded-2xl p-4 font-mono text-xs h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-slate-500 flex items-center justify-center h-full italic">
            Esperando sinal do backend...
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                key={log.id} 
                className={`flex gap-2 items-start ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 
                  'text-indigo-300'
                }`}
              >
                <div className="mt-0.5">
                  {log.type === 'error' ? <AlertCircle size={14} /> : 
                   log.type === 'success' ? <CheckCircle2 size={14} /> : 
                   <span className="text-slate-500">→</span>}
                </div>
                <span>{log.text}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
