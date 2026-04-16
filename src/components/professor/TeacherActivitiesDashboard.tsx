import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, ActivitySubmission } from '../../types/edusaep.types';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, TrendingUp, CheckCircle2, Clock, AlertCircle, FileText, ArrowLeft } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export function TeacherActivitiesDashboard({ userProfile, onBack }: { userProfile: any, onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);

  useEffect(() => {
    fetchData();
  }, [userProfile.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Activities
      const actQuery = query(collection(db, 'activities'), where('createdBy', '==', userProfile.uid));
      const actSnap = await getDocs(actQuery);
      const acts = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setActivities(acts);

      // Fetch Submissions (We fetch all submissions for these activities)
      // Note: In a very large scale app, we might need to chunk this or aggregate on the backend.
      // For this prototype, fetching all submissions for the teacher's activities is acceptable.
      if (acts.length > 0) {
        // To avoid 'in' query limit of 10, we fetch all submissions and filter in memory, 
        // or fetch in chunks. Let's fetch all and filter for simplicity in this demo.
        const subSnap = await getDocs(collection(db, 'activity_submissions'));
        const actIds = new Set(acts.map(a => a.id));
        const subs = subSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ActivitySubmission))
          .filter(sub => actIds.has(sub.activityId));
        setSubmissions(subs);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  // Calculate Metrics
  const totalActivities = activities.length;
  const totalSubmissions = submissions.length;
  
  const statusCount = {
    graded: submissions.filter(s => s.status === 'graded').length,
    grading: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
    returned: submissions.filter(s => s.status === 'returned').length,
  };

  const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.grade !== undefined);
  const averageGrade = gradedSubmissions.length > 0 
    ? (gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / gradedSubmissions.length).toFixed(1)
    : 'N/A';

  // Prepare Chart Data
  const statusChartData = [
    { name: 'Avaliadas', value: statusCount.graded },
    { name: 'Aguardando Correção', value: statusCount.grading },
    { name: 'Devolvidas', value: statusCount.returned },
  ];

  // Activities Performance (Top 5 most submitted)
  const activityStats = activities.map(act => {
    const actSubs = submissions.filter(s => s.activityId === act.id);
    const actGraded = actSubs.filter(s => s.status === 'graded');
    const avg = actGraded.length > 0 
      ? actGraded.reduce((acc, curr) => acc + (curr.grade || 0), 0) / actGraded.length 
      : 0;
    
    // Convert to percentage based on max points
    const avgPercentage = act.points > 0 ? (avg / act.points) * 100 : 0;

    return {
      name: act.title.length > 20 ? act.title.substring(0, 20) + '...' : act.title,
      entregas: actSubs.length,
      media: Math.round(avgPercentage)
    };
  }).sort((a, b) => b.entregas - a.entregas).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" /> Dashboard de Entregas
        </h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Atividades</p>
            <p className="text-2xl font-bold text-gray-900">{totalActivities}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Entregas</p>
            <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aguardando Correção</p>
            <p className="text-2xl font-bold text-gray-900">{statusCount.grading}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Média Geral (Pts)</p>
            <p className="text-2xl font-bold text-gray-900">{averageGrade}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-6">Status das Entregas</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Activities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-6">Engajamento por Atividade (Top 5)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" orientation="left" stroke="#6366F1" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="entregas" name="Qtd. Entregas" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="media" name="Média (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
