import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Megaphone, Plus, Send, User, Clock, Trash2, Loader2, MessageCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, where, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Announcement, ForumComment } from '../../types/edusaep.types';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

export function CommunicationCenter({ userProfile }: { userProfile: any }) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'forum'>('announcements');
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // New Item State
  const [newItem, setNewItem] = useState({ title: '', content: '' });

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'announcements'),
      where('type', '==', activeTab === 'announcements' ? 'announcement' : 'forum'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    if (!selectedItem) return;

    const q = query(
      collection(db, 'forum_comments'),
      where('announcementId', '==', selectedItem.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumComment)));
    });

    return () => unsubscribe();
  }, [selectedItem]);

  const handleCreateItem = async () => {
    if (!newItem.title || !newItem.content) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      await addDoc(collection(db, 'announcements'), {
        ...newItem,
        type: activeTab === 'announcements' ? 'announcement' : 'forum',
        createdBy: userProfile.uid,
        authorName: userProfile.displayName || 'Usuário',
        createdAt: serverTimestamp(),
        commentCount: 0
      });
      toast.success(activeTab === 'announcements' ? "Aviso publicado!" : "Tópico criado!");
      setIsCreating(false);
      setNewItem({ title: '', content: '' });
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Erro ao publicar.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedItem) return;

    try {
      await addDoc(collection(db, 'forum_comments'), {
        announcementId: selectedItem.id,
        userId: userProfile.uid,
        userName: userProfile.displayName || 'Usuário',
        content: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao comentar.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success("Excluído com sucesso.");
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" /> Central de Comunicação
            </h2>
            <p className="text-gray-500 mt-1">Avisos oficiais e fórum de discussão.</p>
          </div>
          {(userProfile.role === 'professor' || userProfile.role === 'admin') && !isCreating && !selectedItem && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> {activeTab === 'announcements' ? 'Novo Aviso' : 'Novo Tópico'}
            </button>
          )}
        </div>

        <div className="flex p-1 bg-gray-50 rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab('announcements'); setSelectedItem(null); setIsCreating(false); }}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'announcements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Megaphone size={18} /> Avisos
          </button>
          <button
            onClick={() => { setActiveTab('forum'); setSelectedItem(null); setIsCreating(false); }}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'forum' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MessageCircle size={18} /> Fórum
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {activeTab === 'announcements' ? 'Publicar Novo Aviso' : 'Criar Tópico de Discussão'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Título chamativo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (Markdown suportado)</label>
                <textarea
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  className="w-full h-48 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateItem}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Publicar
                </button>
              </div>
            </div>
          </motion.div>
        ) : selectedItem ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="mb-6 text-indigo-600 font-medium flex items-center gap-1 hover:underline"
              >
                <ArrowLeft size={18} /> Voltar para lista
              </button>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><User size={14} /> {selectedItem.authorName}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {selectedItem.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
                {(userProfile.role === 'admin' || userProfile.uid === selectedItem.createdBy) && (
                  <button
                    onClick={() => handleDeleteItem(selectedItem.id!)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <div className="prose prose-indigo max-w-none text-gray-700">
                <Markdown>{selectedItem.content}</Markdown>
              </div>
            </div>

            {/* Comments Section (only for Forum) */}
            {activeTab === 'forum' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h4 className="text-xl font-bold text-gray-900">Comentários ({comments.length})</h4>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {comments.map(comment => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-indigo-700 text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-400">{comment.createdAt?.toDate().toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleAddComment}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed text-gray-500">
                <p>Nenhum item encontrado nesta categoria.</p>
              </div>
            ) : (
              items.map(item => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User size={12} /> {item.authorName}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {item.createdAt?.toDate().toLocaleDateString()}</span>
                        {activeTab === 'forum' && (
                          <span className="flex items-center gap-1"><MessageCircle size={12} /> {item.commentCount || 0} comentários</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
