import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { Skeleton } from '../common/Skeleton';

interface StudentDashboardViewProps {
  user: User | null;
  userProfile: UserProfile | null;
}

export function StudentDashboardView({ user, userProfile }: StudentDashboardViewProps) {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'diagnostics'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDiags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allDiags.filter((d: any) => 
        d.studentId === user.uid || 
        (d.studentEmail && d.studentEmail.toLowerCase() === user.email?.toLowerCase()) ||
        (d.studentMatricula && d.studentMatricula === userProfile?.matricula) ||
        (d.aluno && d.aluno.toLowerCase() === user.displayName?.toLowerCase())
      );
      
      setDiagnostics(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Gamification Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shrink-0">
            <span className="text-3xl font-black">{userProfile?.level || 1}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nível {userProfile?.level || 1}</h2>
            <p className="text-emerald-100 font-medium">{userProfile?.xp || 0} XP Acumulados</p>
            <div className="mt-3 w-48 h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${((userProfile?.xp || 0) % 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-100 mt-1 uppercase tracking-wider">
              {100 - ((userProfile?.xp || 0) % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Badges placeholder */}
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Primeiro Acesso">
            🌟
          </div>
          {(userProfile?.level || 1) >= 5 && (
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Nível 5 Alcançado">
              🔥
            </div>
          )}
          {(userProfile?.level || 1) >= 10 && (
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Nível 10 Alcançado">
              👑
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/student-exams')}
          className="bg-white p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4 dark:bg-gray-900"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Simulados</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avaliações completas para testar seus conhecimentos.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-emerald-600 text-xs font-bold">
            Acessar <ArrowRight size={14} />
          </div>
        </motion.button>
        {/* Adicionar mais cards aqui se necessário */}
      </div>
      
      {diagnostics.length > 0 && (
        <div className="space-y-4">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white">Meus Históricos</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {diagnostics.map(diag => (
               <div key={diag.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <p className="font-bold text-sm">{new Date(diag.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">Média: {(diag.result?.summary?.acuracia_geral * 100).toFixed(0)}%</p>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
