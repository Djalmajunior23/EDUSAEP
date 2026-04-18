import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Settings, Eye, Code, Terminal, Activity, 
  Lock, Unlock, Server, Database, Save, RefreshCw,
  Search, Filter, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { featureFlags, FeatureFlags } from '../../services/featureFlagService';
import { eventBus, SystemEventPayload } from '../../services/eventBusService';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function SystemGovernancePortal() {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags.getFlags());
  const [events, setEvents] = useState<SystemEventPayload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'flags' | 'logs'>('flags');

  useEffect(() => {
    const unsubFlags = featureFlags.subscribe(setFlags);
    
    const eventsQuery = query(
      collection(db, 'system_events'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => doc.data() as SystemEventPayload);
      setEvents(newEvents);
    });

    return () => {
      unsubFlags();
      unsubEvents();
    };
  }, []);

  const handleToggleFlag = async (key: keyof FeatureFlags) => {
    const newFlags = { ...flags, [key]: !flags[key] };
    setFlags(newFlags);
    
    try {
      setIsSaving(true);
      const configRef = doc(db, 'system_config', 'feature_flags');
      await updateDoc(configRef, { [key]: !flags[key] });
      toast.success(`Feature ${key} alterada com sucesso.`);
    } catch (err) {
      toast.error('Erro ao atualizar flag de sistema.');
      setFlags(flags); // Rollback
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[600px] rounded-[32px] border border-gray-200 overflow-hidden flex flex-col font-mono shadow-2xl">
      {/* Sidebar / Vertical Rail */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 bg-gray-900 flex flex-col items-center py-8 gap-6 border-r border-white/10">
          <button 
            onClick={() => setActiveTab('flags')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'flags' ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white")}
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'logs' ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white")}
          >
            <Activity size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase text-gray-900">
                {activeTab === 'flags' ? 'Governança & Módulos' : 'Audit Log & Monitoramento'}
              </h2>
              <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">
                Ambiente de Configuração de ALTA PERFORMANCE // BLOCK 10
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black border border-emerald-100">CLOUD_OK</span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black border border-indigo-100">V4.2</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'flags' ? (
              <motion.div 
                key="flags"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {(Object.entries(flags) as [keyof FeatureFlags, boolean][]).map(([key, enabled]) => (
                  <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl transition-colors", enabled ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400")}>
                        {enabled ? <Unlock size={20} /> : <Lock size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm tracking-tight capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          Módulo {enabled ? 'Ativo' : 'Desativado'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleFlag(key)}
                      disabled={isSaving}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        enabled ? "bg-emerald-500" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-900 rounded-3xl p-6 overflow-hidden border border-white/10"
              >
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">System Event Stream</span>
                  </div>
                  <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> LIVE_POLLING</span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {events.length > 0 ? events.map((event, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border-l-2 border-indigo-500/30">
                      <span className="text-indigo-400 opacity-50 shrink-0">
                        [{(event as any).timestamp?.toDate?.()?.toLocaleTimeString() || new Date().toLocaleTimeString()}]
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-indigo-300 font-black uppercase tracking-tighter">{event.type}</span>
                          <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-gray-400 uppercase">SYS_LOG</span>
                        </div>
                        <pre className="text-emerald-400/80 whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center text-white/20 italic">
                      Nenhum evento detectado na stream atual.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
