import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckCircle2, AlertCircle, Calendar, MessageSquare, Info, CheckSquare } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { AppNotification, NotificationType } from '../../types/eduai.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function NotificationCenter({ userProfile }: { userProfile: any }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [userProfile.uid]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const history = await notificationService.getNotificationHistory(userProfile.uid, 100);
      setNotifications(history);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userProfile.uid);
    fetchNotifications();
    toast.success("Todas as notificações marcadas como lidas");
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'activity_published': return <Calendar className="text-blue-500" />;
      case 'activity_submitted': return <CheckCircle2 className="text-emerald-500" />;
      case 'activity_graded': return <CheckCircle2 className="text-indigo-500" />;
      case 'activity_returned': return <AlertCircle className="text-amber-500" />;
      case 'forum_reply': return <MessageSquare className="text-purple-500" />;
      default: return <Info className="text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-indigo-600" /> Histórico de Notificações
          </h2>
          <p className="text-gray-500">Acompanhe todos os eventos e atualizações da plataforma.</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
        >
          <CheckSquare size={18} /> Marcar todas como lidas
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'Todas', icon: Bell },
          { id: 'activity_published', label: 'Atividades', icon: Calendar },
          { id: 'activity_graded', label: 'Correções', icon: CheckCircle2 },
          { id: 'activity_returned', label: 'Ajustes', icon: AlertCircle },
          { id: 'forum_reply', label: 'Fórum', icon: MessageSquare }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              filter === f.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            <f.icon size={16} />
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Carregando notificações...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 opacity-10" />
            <p>Nenhuma notificação encontrada para este filtro.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 flex gap-4 transition-colors ${notif.read ? 'opacity-60' : 'bg-indigo-50/30'}`}
              >
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                    <span className="text-xs text-gray-400">
                      {notif.createdAt?.seconds 
                        ? format(new Date(notif.createdAt.seconds * 1000), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                        : 'Agora'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{notif.message}</p>
                  <div className="mt-4 flex gap-3">
                    {!notif.read && (
                      <button
                        onClick={async () => {
                          await notificationService.markAsRead(notif.id!);
                          fetchNotifications();
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Marcar como lida
                      </button>
                    )}
                    {notif.link && (
                      <button
                        onClick={() => window.location.hash = notif.link!}
                        className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
