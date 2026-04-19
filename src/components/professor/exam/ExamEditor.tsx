
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export function ExamEditor({ exam, onSave }: { exam: any, onSave: (updatedExam: any) => void }) {
  const [editedExam, setEditedExam] = useState(exam);

  const handleSave = () => {
    onSave(editedExam);
    toast.success("Prova salva com sucesso!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Editor de Prova Inteligente</h2>
      
      <input 
        className="w-full text-xl font-bold p-2 border-b"
        value={editedExam.title}
        onChange={e => setEditedExam({...editedExam, title: e.target.value})}
      />

      <div className="space-y-4">
        {editedExam.questions.map((q: any, i: number) => (
          <div key={i} className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="font-bold mb-2">Questão {i + 1}</p>
            <textarea 
              className="w-full p-2 border rounded"
              value={q.enunciado}
              onChange={e => {
                const newQuestions = [...editedExam.questions];
                newQuestions[i].enunciado = e.target.value;
                setEditedExam({...editedExam, questions: newQuestions});
              }}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        className="fixed bottom-8 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
      >
        <Save />
      </button>
    </div>
  );
}
