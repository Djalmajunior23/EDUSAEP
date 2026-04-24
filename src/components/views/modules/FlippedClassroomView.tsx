import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Video, ExternalLink, Activity, Plus } from 'lucide-react';
import { addFlippedMaterial } from '../../../services/flippedClassroomService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

export const FlippedClassroomView = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAddMaterial = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addFlippedMaterial({
        classId: 'dummy-class',
        teacherId: user.uid,
        title: 'Introdução à IA',
        url: 'https://youtube.com',
        type: 'video',
        assignedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'active'
      });
      toast.success('Material adicionado e notificação enviada via n8n!');
    } catch (e) {
      toast.error('Erro ao adicionar material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Aula Invertida</h1>
          <p className="text-gray-600">Módulo de Sala de Aula Invertida. Materiais prévios, checklists e acompanhamento.</p>
        </div>
        {userProfile?.role !== 'STUDENT' && (
          <button 
            onClick={handleAddMaterial}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={20} />
            {loading ? 'Adicionando...' : 'Novo Material'}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Video className="text-indigo-600" />
            <h3 className="font-bold">Vídeos e Aulas Prévias</h3>
          </div>
          <p className="text-sm text-gray-500">Acompanhe quem assistiu os materiais antes da aula.</p>
        </div>
        
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="text-emerald-600" />
            <h3 className="font-bold">Perguntas Orientadoras</h3>
          </div>
          <p className="text-sm text-gray-500">Valide o conhecimento antes da discussão presencial.</p>
        </div>
      </div>
    </div>
  );
};
