// src/components/admin/DataImportView.tsx
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { n8nEvents } from '../../services/n8nService';

export function DataImportView() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    
    try {
      // Save metadata to Firestore
      await addDoc(collection(db, 'importacoes'), {
        origem: 'Upload Manual (SIAC)',
        arquivo_nome: file.name,
        data_importacao: serverTimestamp(),
        status: 'Processando',
        observacoes: 'Aguardando processamento do n8n'
      });

      // Trigger n8n automation
      const success = await n8nEvents.fileImport(file);
      
      if (!success) {
        throw new Error("Falha ao enviar arquivo para o n8n. Verifique a configuração do Webhook.");
      }
      
      setStatus('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'importacoes');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importação de Dados (SIAC)</h1>
        <p className="text-gray-500 mt-2">Faça o upload de planilhas de notas ou dados do SIAC para processamento via n8n.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet size={32} />
            </div>
            <span className="text-lg font-medium text-gray-900">
              {file ? file.name : 'Clique para selecionar a planilha'}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              Suporta arquivos CSV e Excel (.xlsx)
            </span>
          </label>
        </div>

        {file && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={status === 'uploading' || status === 'success'}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {status === 'uploading' ? (
                <>Processando no n8n...</>
              ) : status === 'success' ? (
                <>Enviado com Sucesso</>
              ) : (
                <>
                  <Upload size={20} />
                  Processar Planilha
                </>
              )}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-start gap-3 border border-green-200">
            <CheckCircle2 className="mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Arquivo enviado para o n8n!</h4>
              <p className="text-sm mt-1">O fluxo de automação está processando os dados. Os insights e recomendações aparecerão no Dashboard em breve.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertCircle className="mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Erro na importação</h4>
              <p className="text-sm mt-1">Não foi possível conectar ao webhook do n8n. Verifique a configuração.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2">Como funciona a integração?</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>O arquivo é enviado para um Webhook no n8n.</li>
          <li>O n8n lê, limpa e padroniza as colunas (Nome, Disciplina, Nota).</li>
          <li>Os dados são cruzados com a matriz de competências no Firestore.</li>
          <li>A IA (Gemini) é acionada para gerar o diagnóstico da turma.</li>
          <li>O Motor de Recomendação gera alertas para alunos em risco.</li>
        </ol>
      </div>
    </div>
  );
}
