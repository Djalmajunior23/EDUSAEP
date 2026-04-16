import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, Info, AlertCircle, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types/edusaep.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = notificationService.subscribeToUnreadNotifications(userId, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(userId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'activity_published': return <Calendar className="text-blue-500" size={18} />;
      case 'activity_submitted': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'activity_graded': return <CheckCircle2 className="text-indigo-500" size={18} />;
      case 'activity_returned': return <AlertCircle className="text-amber-500" size={18} />;
      case 'forum_reply': return <MessageSquare className="text-purple-500" size={18} />;
      default: return <Info className="text-gray-500" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notificações</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma nova notificação</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer group"
                      onClick={() => {
                        if (notif.link) window.location.hash = notif.link;
                        notificationService.markAsRead(notif.id!);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {notif.createdAt?.seconds 
                              ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true, locale: ptBR })
                              : 'Agora mesmo'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id!, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-all"
                          title="Marcar como lida"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-gray-100 text-center bg-gray-50/30">
                <button 
                  onClick={() => {
                    window.location.hash = '/notifications';
                    setIsOpen(false);
                  }}
                  className="text-sm text-gray-500 font-medium hover:text-indigo-600 transition-colors"
                >
                  Ver todo o histórico
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
