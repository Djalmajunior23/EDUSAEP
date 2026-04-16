import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X, Users } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { importService } from '../../services/importService';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface PreviewRow {
  nome: string;
  email: string;
  matricula?: string;
  turma?: string;
  [key: string]: any;
}

export function StudentImportUploader({ userProfile }: { userProfile: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch existing classes for mapping
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setImportResult(null);

    try {
      const data = await importService.parseFile(selectedFile);
      
      // Basic validation and mapping
      const mappedData = data.map((row: any) => ({
        nome: row.nome || row.Nome || row.name || row.Name || '',
        email: row.email || row.Email || row.e_mail || '',
        matricula: row.matricula || row.Matricula || row.id || '',
        turma: row.turma || row.Turma || row.class || '',
        _raw: row
      })).filter(row => row.nome || row.email); // Filter out completely empty rows

      setPreviewData(mappedData);
      
      if (mappedData.length === 0) {
        toast.error('Nenhum dado válido encontrado no arquivo. Verifique as colunas (nome, email).');
      } else {
        toast.success(`${mappedData.length} alunos identificados.`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao ler arquivo: ${error.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleImport = async () => {
    if (previewData.length === 0) return;
    
    setIsImporting(true);
    try {
      // Add selected class to rows if provided
      const dataToImport = previewData.map(row => ({
        ...row,
        turmaId: selectedClass || null
      }));

      const result = await importService.processStudentImport(dataToImport, userProfile.uid);
      setImportResult(result);
      toast.success('Importação concluída!');
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setSelectedClass('');
  };

  if (importResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Importação Concluída</h2>
          <p className="text-gray-500 mt-2">O arquivo foi processado com sucesso.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Processado</p>
            <p className="text-2xl font-bold text-gray-900">{importResult.successCount + importResult.errorCount}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <p className="text-sm text-emerald-600 font-medium mb-1">Sucesso</p>
            <p className="text-2xl font-bold text-emerald-700">{importResult.successCount}</p>
          </div>
        </div>

        {importResult.errors?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3">
              <AlertCircle size={16} /> Erros Encontrados ({importResult.errorCount})
            </h3>
            <div className="max-h-40 overflow-y-auto bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-700 space-y-2">
              {importResult.errors.map((err: any, i: number) => (
                <div key={i}>Linha {err.row}: {err.message}</div>
              ))}
            </div>
          </div>
        )}

        <button onClick={reset} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          Nova Importação
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Importar Alunos</h2>
            <p className="text-sm text-gray-500">Faça upload de uma planilha (CSV, XLSX) para cadastrar alunos em lote.</p>
          </div>
        </div>

        {!file ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Arraste e solte sua planilha aqui</h3>
            <p className="text-gray-500 text-sm mb-4">ou clique para selecionar o arquivo do seu computador</p>
            <p className="text-xs text-gray-400">Formatos suportados: .csv, .xlsx, .xls (Máx: 5MB)</p>
            <p className="text-xs text-gray-400 mt-2">Colunas esperadas: nome, email, matricula (opcional), turma (opcional)</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-indigo-600" size={24} />
                <div>
                  <p className="font-medium text-indigo-900">{file.name}</p>
                  <p className="text-xs text-indigo-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={reset} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Analisando planilha...</p>
              </div>
            ) : previewData.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vincular a uma Turma Existente (Opcional)</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Não vincular / Usar coluna da planilha --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Pré-visualização ({previewData.length} registros)</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-medium">Nome</th>
                          <th className="p-3 font-medium">E-mail</th>
                          <th className="p-3 font-medium">Matrícula</th>
                          <th className="p-3 font-medium">Turma</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className={!row.nome || !row.email ? 'bg-red-50' : ''}>
                            <td className="p-3">{row.nome || <span className="text-red-500 text-xs">Faltando</span>}</td>
                            <td className="p-3">{row.email || <span className="text-red-500 text-xs">Faltando</span>}</td>
                            <td className="p-3 text-gray-500">{row.matricula || '-'}</td>
                            <td className="p-3 text-gray-500">{row.turma || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 5 && (
                    <p className="text-center text-xs text-gray-500 mt-2">Mostrando apenas os 5 primeiros registros.</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={reset} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    Confirmar Importação
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
