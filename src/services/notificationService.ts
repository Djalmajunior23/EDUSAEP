import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification, NotificationType } from '../types/eduai.types';

export const notificationService = {
  /**
   * Cria uma nova notificação no sistema
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  },

  /**
   * Notifica múltiplos usuários (ex: todos os alunos de uma turma)
   */
  async notifyMultipleUsers(userIds: string[], notificationData: Omit<AppNotification, 'id' | 'userId' | 'read' | 'createdAt'>) {
    const batch = writeBatch(db);
    userIds.forEach(userId => {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        ...notificationData,
        userId,
        read: false,
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  },

  /**
   * Escuta notificações não lidas em tempo real
   */
  subscribeToUnreadNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      callback(notifications);
    });
  },

  /**
   * Busca histórico completo de notificações
   */
  async getNotificationHistory(userId: string, limitCount: number = 50) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppNotification[];
  },

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string) {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  },

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }
};
