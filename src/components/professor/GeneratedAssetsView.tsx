import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Question } from '../../types';
import { Loader2, Code, Image as ImageIcon, Table as TableIcon, Layout, FileText, Search } from 'lucide-react';

export function GeneratedAssetsView({ onClose }: { onClose: () => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'questions'));
        const snap = await getDocs(q);
        const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        
        const extractedAssets = questions.flatMap(q => 
          (q.assets || []).map(a => ({ ...a, questionText: q.enunciado, questionId: q.id }))
        );
        setAssets(extractedAssets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code size={16} />;
      case 'image': return <ImageIcon size={16} />;
      case 'table': return <TableIcon size={16} />;
      case 'diagram': return <Layout size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Meus Recursos Inteligentes</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">Fechar</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center p-20"><Loader2 className="animate-spin" /></div>
          ) : assets.map((asset, i) => (
            <div key={i} className="p-4 border rounded-2xl bg-gray-50 dark:bg-gray-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                {getIcon(asset.type)} {asset.type}
              </div>
              <h4 className="font-bold text-sm dark:text-white">{asset.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-2">{asset.questionText}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
