// src/components/admin/DataImportView.tsx
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import { exportStudentsToCSV } from '../../services/exportService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { n8nEvents } from '../../services/n8nService';
import * as XLSX from 'xlsx';
import { generatePedagogicalAnalysis } from '../../services/geminiService';
import { toast } from 'sonner';

export function DataImportView() {
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importDate, setImportDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!importName.trim()) { toast.error('O nome da importação é obrigatório.'); return; }
    if (!importDate) { toast.error('A data da importação é obrigatória.'); return; }
    
    setStatus('uploading');
    setIsAnalyzing(true);
    
    try {
      // Parse file locally
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Save metadata to Firestore
      const importRef = await addDoc(collection(db, 'importacoes'), {
        origem: 'Upload Manual (SIAC)',
        nome: importName,
        data: importDate,
        arquivo_nome: file.name,
        data_importacao: serverTimestamp(),
        status: 'Processando',
        observacoes: 'Processando dados e gerando insights...'
      });

      // Generate insights using Gemini
      toast.info('Analisando dados do SIAC com IA...');
      const analysis = await generatePedagogicalAnalysis({
        source: 'SIAC_Import',
        fileName: file.name,
        data: jsonData.slice(0, 100) // Limit to first 100 rows to avoid huge payloads
      });

      // Save insights
      await addDoc(collection(db, 'insights_ia'), {
        tipo: 'analise_siac',
        resumo: analysis.resumo_geral,
        json_resposta: analysis,
        data_geracao: serverTimestamp(),
        importacao_id: importRef.id
      });

      // Also trigger n8n automation as fallback/additional processing
      try {
        await n8nEvents.fileImport(file);
      } catch (e) {
        console.warn("n8n webhook failed, but local analysis succeeded.", e);
      }
      
      setStatus('success');
      toast.success('Planilha analisada e insights gerados com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'importacoes');
      setStatus('error');
      toast.error('Erro ao processar a planilha.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importação de Dados (SIAC)</h1>
        <p className="text-gray-500 mt-2">Faça o upload de planilhas de notas ou dados do SIAC para análise inteligente.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Importação</label>
            <input type="text" value={importName} onChange={(e) => setImportName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Ex: Notas 1º Bimestre" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data da Importação</label>
            <input type="date" value={importDate} onChange={(e) => setImportDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
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
              disabled={status === 'uploading' || status === 'success' || isAnalyzing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analisando com IA...
                </>
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
              <h4 className="font-bold">Análise Concluída!</h4>
              <p className="text-sm mt-1">Os dados foram processados e os insights gerados pela IA já estão disponíveis no Dashboard de Inteligência Educacional.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertCircle className="mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Erro na importação</h4>
              <p className="text-sm mt-1">Ocorreu um erro ao processar a planilha ou gerar os insights.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gerenciamento de Alunos</h3>
        <button
          onClick={() => {
            toast.info("Processando lista de alunos...");
            exportStudentsToCSV([{ id: "1", name: "Dados processados em Nuvem", status: "Em sincronia" }]);
            toast.success("Download iniciado");
          }}
          className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Download size={20} />
          Exportar Lista de Alunos (CSV)
        </button>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2">Como funciona a integração?</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>O arquivo é lido diretamente no navegador.</li>
          <li>Os dados são enviados para a IA (Gemini) para análise pedagógica.</li>
          <li>A IA gera insights, identifica alunos em risco e sugere planos de ação.</li>
          <li>Os resultados são salvos e exibidos no Dashboard de Inteligência Educacional.</li>
          <li>Uma cópia também é enviada ao n8n para fluxos de automação adicionais.</li>
        </ol>
      </div>
    </div>
  );
}
