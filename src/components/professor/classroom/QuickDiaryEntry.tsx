import React, { useState } from 'react';
import { createDiaryEntry } from '../../../services/pedagogicalDiaryService';
import { toast } from 'sonner';
import { PenTool, Loader2 } from 'lucide-react';

export function QuickDiaryEntry({ teacherId, classId }: { teacherId: string, classId: string }) {
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!observations) return;
    setLoading(true);
    try {
      await createDiaryEntry({ teacherId, classId, observations, studentsToMonitor: [] });
      toast.success("Diário registrado!");
      setObservations('');
    } catch (e) {
      toast.error("Erro ao registrar no diário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <PenTool size={20} className="text-indigo-500" />
        Diário de Sala
      </h3>
      <textarea 
        className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Registre observações da aula..."
        value={observations}
        onChange={e => setObservations(e.target.value)}
        rows={3}
      />
      <button 
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Salvar Registro Inteligente"}
      </button>
    </div>
  );
}
