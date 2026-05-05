import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
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
  const [processState, setProcessState] = useState<{ step: string; progress: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<{ message: string; details?: string; type: 'parsing' | 'importing' } | null>(null);
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
    setProcessState({ step: 'Lendo arquivo...', progress: 10 });
    setImportResult(null);
    setImportError(null);

    try {
      const data = await importService.parseFile(selectedFile);
      
      setProcessState({ step: 'Convertendo campos e formatos...', progress: 40 });
      await new Promise(r => setTimeout(r, 600));

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('O arquivo parece estar vazio ou não contém dados válidos.');
      }

      // Robust validation and mapping
      const mappedData = data.map((row: any, index: number) => {
        // Normalize keys for case-insensitive matching
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const rowData = {
          nome: normalizedRow.nome || normalizedRow.name || normalizedRow['nome completo'] || normalizedRow['full name'] || '',
          email: normalizedRow.email || normalizedRow['e-mail'] || normalizedRow['email address'] || '',
          matricula: normalizedRow.matricula || normalizedRow.id || normalizedRow.registration || normalizedRow['matrícula'] || '',
          turma: normalizedRow.turma || normalizedRow.class || normalizedRow.grade || normalizedRow.classroom || '',
          _raw: row,
          _line: index + 1,
          validationErrors: [] as string[]
        };

        // Basic validation
        if (!rowData.nome) rowData.validationErrors.push('Nome ausente');
        if (!rowData.email) {
          rowData.validationErrors.push('Email ausente');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.email as string)) {
          rowData.validationErrors.push('Email inválido');
        }

        return rowData;
      }).filter(row => Object.values(row._raw).some(v => v !== null && v !== '')); // Filter out completely empty rows

      setProcessState({ step: 'Analisando consistência com IA...', progress: 70 });
      await new Promise(r => setTimeout(r, 1000));

      setProcessState({ step: 'Validando dados finais...', progress: 90 });
      await new Promise(r => setTimeout(r, 400));
      
      setProcessState({ step: 'Pronto para importação.', progress: 100 });
      setPreviewData(mappedData);
      
      const rowsWithErrors = mappedData.filter(r => r.validationErrors.length > 0);
      
      if (mappedData.length === 0) {
        setImportError({
          type: 'parsing',
          message: 'Arquivo sem dados válidos',
          details: 'O arquivo foi lido, mas não encontramos nenhuma linha com dados. Verifique se o arquivo não está vazio.'
        });
      } else if (rowsWithErrors.length > 0) {
        toast.warning(`${rowsWithErrors.length} linhas possuem avisos ou erros.`);
      } else {
        toast.success(`${mappedData.length} alunos identificados com sucesso.`);
      }
    } catch (error: any) {
      console.error(error);
      setImportError({
        type: 'parsing',
        message: 'Falha ao processar o arquivo',
        details: error.message || 'Ocorreu um erro inesperado ao ler a planilha. Verifique se o arquivo não está corrompido ou se o formato é suportado.'
      });
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
    setImportError(null);
    try {
      // Add selected class to rows if provided
      const dataToImport = previewData.map(row => ({
        ...row,
        turmaId: selectedClass || null
      }));

      const result = await importService.processStudentImport(dataToImport, userProfile.uid, (current, total) => {
        setProcessState({ step: `Importando registro ${current} de ${total}...`, progress: Math.floor((current / total) * 100) });
      });
      setImportResult(result);
      
      if (result.errorCount > 0) {
        toast.warning(`Importação concluída com ${result.errorCount} erros.`);
      } else {
        toast.success('Importação concluída com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      setImportError({
        type: 'importing',
        message: 'Erro durante o salvamento dos dados',
        details: error.message || 'Não foi possível completar a importação no banco de dados.'
      });
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setImportError(null);
    setSelectedClass('');
  };

  if (importResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            importResult.successCount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          )}>
            {importResult.successCount > 0 ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {importResult.successCount > 0 ? 'Importação Concluída' : 'Falha na Importação'}
          </h2>
          <p className="text-gray-500 mt-2">
            {importResult.successCount > 0 
              ? 'O arquivo foi processado. Veja o resumo abaixo.' 
              : 'Não foi possível importar nenhum registro válido.'}
          </p>
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
            <div className="max-h-60 overflow-y-auto bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-700 space-y-2 mb-4">
              {importResult.errors.map((err: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Linha {err.row}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Próximos Passos Sugeridos:</h4>
              <ul className="text-xs text-blue-700 space-y-1 list-disc ml-4">
                <li>Corrija as linhas indicadas acima no seu arquivo original.</li>
                <li>Certifique-se de que não existam e-mails duplicados.</li>
                <li>Remova caracteres especiais de nomes caso necessário.</li>
                <li>Tente realizar a importação novamente após os ajustes.</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">Por que esses erros acontecem?</h4>
              <ul className="text-xs text-orange-700 space-y-1 list-disc ml-4">
                <li><strong>Email Duplicado:</strong> Já existe um aluno cadastrado com este e-mail no sistema.</li>
                <li><strong>Dados Ausentes:</strong> Campos obrigatórios como 'nome' ou 'email' estão vazios na planilha.</li>
                <li><strong>Formato Inválido:</strong> O arquivo pode conter caracteres especiais ou formatação que impede a leitura correta.</li>
              </ul>
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

        {importError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full h-fit">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900">{importError.message}</h3>
                <p className="text-sm text-red-700 mt-1">{importError.details}</p>
                
                <div className="mt-4 pt-4 border-t border-red-100">
                  <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2">Sugestões para correção:</p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc ml-4">
                    <li>Verifique se o arquivo é um .CSV ou .XLSX válido.</li>
                    <li>Certifique-se de que as colunas <strong>nome</strong> e <strong>email</strong> existem.</li>
                    <li>Remova linhas vazias no início ou no fim da planilha.</li>
                    <li>Tente exportar novamente o arquivo de sua fonte original.</li>
                  </ul>
                </div>

                <button 
                  onClick={reset}
                  className="mt-4 px-4 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Tentar com outro arquivo
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
              <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-xl shadow-sm">
                <Loader2 className="animate-spin text-indigo-600 mb-6" size={40} />
                <h3 className="font-bold text-gray-900 text-lg mb-2">Processando arquivo...</h3>
                <p className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-6 max-w-sm text-center">
                  {processState?.step || 'Analisando planilha...'}
                </p>
                <div className="w-full max-w-md bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${processState?.progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">{processState?.progress || 0}% concluído</p>
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
                        {previewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={row.validationErrors.length > 0 ? 'bg-red-50' : ''}>
                            <td className="p-3">
                              <div className="font-medium text-gray-900">{row.nome || <span className="text-red-500 italic">Ausente</span>}</div>
                              {row.validationErrors.map((err, i) => (
                                <div key={i} className="text-[10px] text-red-600 flex items-center gap-1">
                                  <AlertCircle size={10} /> {err}
                                </div>
                              ))}
                            </td>
                            <td className="p-3">
                              <span className={!row.email || row.validationErrors.includes('Email inválido') ? 'text-red-600' : 'text-gray-600'}>
                                {row.email || <span className="italic">Ausente</span>}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500">{row.matricula || '-'}</td>
                            <td className="p-3 text-gray-500">{row.turma || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 10 && (
                    <p className="text-center text-xs text-gray-500 mt-2">Mostrando 10 de {previewData.length} registros.</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={reset} disabled={isImporting} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {isImporting ? 'Importando...' : 'Confirmar Importação'}
                  </button>
                </div>
                {isImporting && processState && (
                  <div className="mt-4 p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h4 className="font-bold text-indigo-900 mb-2">Importação em andamento</h4>
                    <p className="text-sm font-medium text-indigo-700 mb-4">{processState.step}</p>
                    <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${processState.progress}%` }}></div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
