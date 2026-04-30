import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  activityId: string;
  content: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  submittedAt: any;
}

export function ActivityGradingPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId) return;

    const fetchData = async () => {
      try {
        // Fetch Activity
        const activityDoc = await getDoc(doc(db, 'activities', activityId));
        if (activityDoc.exists()) {
          setActivity(activityDoc.data());
        }

        // Fetch Submissions
        const q = query(collection(db, 'submissions'), where('activityId', '==', activityId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar entregas.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activityId]);

  const handleGrade = async (submissionId: string, grade: number, feedback: string, status: 'graded' | 'returned') => {
    try {
        await updateDoc(doc(db, 'submissions', submissionId), {
            grade,
            feedback,
            status,
            gradedAt: new Date()
        });
        
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, grade, feedback, status } : s));
        toast.success(status === 'graded' ? 'Nota atribuída com sucesso!' : 'Atividade devolvida para reenvio.');
    } catch (error) {
        console.error('Error grading:', error);
        toast.error('Erro ao salvar avaliação.');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button className="mb-4 flex items-center text-gray-600 hover:text-gray-900" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {activity?.title || 'Gerenciamento de Entregas'}
      </h1>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{sub.studentName}</h3>
                <p className="text-sm text-gray-500">Status: {sub.status}</p>
              </div>
              <div className="flex gap-2">
                {sub.status === 'submitted' && (
                    <button className="flex items-center bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700" onClick={() => handleGrade(sub.id, sub.grade || 0, sub.feedback || '', 'graded')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                    </button>
                )}
                <button className="flex items-center border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100" onClick={() => handleGrade(sub.id, sub.grade || 0, sub.feedback || '', 'returned')}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Solicitar Reenvio
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="whitespace-pre-wrap">{sub.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Nota"
                    value={sub.grade || ''}
                    onChange={(e) => setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, grade: Number(e.target.value) } : s))}
                />
                <textarea 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Feedback"
                    value={sub.feedback || ''}
                    onChange={(e) => setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, feedback: e.target.value } : s))}
                />
            </div>
          </div>
        ))}
        {submissions.length === 0 && <p className="text-gray-500">Nenhuma entrega encontrada para esta atividade.</p>}
      </div>
    </div>
  );
}
