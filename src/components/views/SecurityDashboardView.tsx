import React from 'react';
import { Shield, Target, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SecurityDashboardView() {
  const { userProfile } = useAuth();
  
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Shield className="text-red-500" size={32} />
          Cybersecurity & Intel
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Central de Monitoramento e Análise de Vulnerabilidades da Plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Vulnerabilidades", value: "4", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
          { title: "Riscos Mitigados", value: "112", icon: ShieldAlert, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Testes Red Team", value: "2", icon: Target, color: "text-orange-500", bg: "bg-orange-50" },
          { title: "Score Global", value: "A-", icon: Shield, color: "text-blue-500", bg: "bg-blue-50" }
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} dark:bg-gray-900`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center flex flex-col items-center justify-center">
        <Shield size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Motor de Cibersegurança em Desenvolvimento</h3>
        <p className="text-gray-500 max-w-lg mt-2 text-sm">
          A infraestrutura do EuAiCore está sendo preparada para receber os agentes de segurança: 
          PentesterAI, ThreatIntelAI e SOCAnalystAI. Em breve, você poderá realizar varreduras automatizadas e monitoramento contínuo.
        </p>
      </div>
    </div>
  );
}
