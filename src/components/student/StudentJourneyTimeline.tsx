import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Map as MapIcon, 
  Flag, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export function StudentJourneyTimeline({ userId }: { userId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Combine multiple sources for the journey
    // In a real app, this might be a single 'journey_events' collection
    const unsub = onSnapshot(
      query(collection(db, 'exam_submissions'), where('studentId', '==', userId), orderBy('completedAt', 'desc')),
      (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          type: 'EXAM',
          title: `Simulado Concluído: ${d.data().score}/${d.data().maxScore}`,
          date: d.data().completedAt,
          status: 'success'
        }));
        setEvents(data);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapIcon className="text-emerald-600" />
            Jornada do Aluno
          </h2>
          <p className="text-sm text-gray-500">Linha do tempo completa de evolução pedagogica.</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />

        <div className="space-y-12">
          {events.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-12"
            >
              {/* Timeline Marker */}
              <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-4 border-emerald-500 z-10 flex items-center justify-center shadow-lg">
                {event.type === 'EXAM' ? <Flag size={16} className="text-emerald-500" /> : <BookOpen size={16} className="text-emerald-500" />}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-emerald-200 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    CONCLUÍDO
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  A análise da IA detectou evolução na Competência 2 e 5.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">
                        C{i}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">+200 XP Ganhos</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Start Point */}
          <div className="relative pl-12 opacity-50">
            <div className="absolute left-2.5 top-1 w-5 h-5 rounded-full bg-gray-200 z-10" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Início da Jornada</p>
          </div>
        </div>
      </div>
    </div>
  );
}
