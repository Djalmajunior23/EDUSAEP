import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Library, 
  Search, 
  Gamepad2, 
  Beaker, 
  BrainCircuit, 
  ChevronRight,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export const InteractiveLibraryView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'simulators' | 'labs' | 'quizzes'>('simulators');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const collectionName = activeTab === 'simulators' ? 'simulators' : (activeTab === 'labs' ? 'practical_labs' : 'quizzes');
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Library className="text-emerald-600" size={32} />
            Biblioteca Interativa
          </h2>
          <p className="text-gray-500 mt-1">Pratique, simule e domine novas competências.</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border shadow-sm self-start">
          <button 
            onClick={() => setActiveTab('simulators')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'simulators' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Gamepad2 size={18} />
            Simuladores
          </button>
          <button 
            onClick={() => setActiveTab('labs')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'labs' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Beaker size={18} />
            Laboratórios
          </button>
          <button 
            onClick={() => setActiveTab('quizzes')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'quizzes' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <BrainCircuit size={18} />
            Quizzes
          </button>
        </div>
      </div>

      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="O que você quer praticar hoje?"
          className="w-full pl-12 pr-4 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase())).map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-emerald-100/50 transition-all group"
            >
              <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 relative">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
                  {item.difficulty || 'Básico'}
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                  {activeTab === 'simulators' ? <Gamepad2 /> : (activeTab === 'labs' ? <Beaker /> : <BrainCircuit />)}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                    {item.description || item.objective || 'Embarque nesta jornada prática de aprendizagem.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {activeTab === 'quizzes' ? '5 min' : '20 min'}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Award size={14} />
                    {item.xpReward || 100} XP
                  </div>
                </div>

                <button className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  Começar agora
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="text-gray-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-400">Nenhum item disponível nesta categoria ainda.</h3>
              <p className="text-gray-400">Fique atento, seu professor está preparando novidades!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
