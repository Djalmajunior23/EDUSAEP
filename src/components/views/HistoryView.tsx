import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Trash2, Archive, ArchiveRestore, CheckSquare, 
  Square, Search, ChevronLeft, ChevronRight, History 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { UserProfile } from '../../types';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../services/errorService';

interface HistoryViewProps {
  history: any[];
  deleteDiagnostic: (id: string) => void;
  archiveDiagnostic: (id: string, currentStatus: boolean) => void;
  setResult: (res: any) => void;
  navigate: any;
  setCurrentDiagnosticId: (id: string) => void;
  userProfile: UserProfile | null;
}

import { useAuth } from '../../contexts/AuthContext';

export function HistoryView({ 
  history, deleteDiagnostic, archiveDiagnostic, setResult, 
  navigate, setCurrentDiagnosticId, userProfile 
}: HistoryViewProps) {
  const { isProfessor: authIsProfessor, isAluno: authIsStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');

  const isStudent = authIsStudent || userProfile?.role === 'STUDENT' || userProfile?.role === 'MONITOR';
  const isProfessor = authIsProfessor || userProfile?.role === 'TEACHER' || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDINATOR';

  const filteredHistory = useMemo(() => {
    const filtered = history.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const studentMatch = item.aluno?.toLowerCase().includes(searchLower) || false;
      
      const getDate = (createdAt: any) => {
        if (!createdAt) return new Date(0);
        if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
        return new Date(createdAt);
      };
      
      const dateMatch = getDate(item.createdAt).toLocaleDateString().includes(searchLower);
      const matchesSearch = studentMatch || dateMatch;
      const matchesArchived = viewMode === 'archived' ? item.archived : !item.archived;
      
      return matchesSearch && matchesArchived;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOption.startsWith('name')) {
        comparison = (a.aluno || '').localeCompare(b.aluno || '');
      } else {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        comparison = dateA - dateB;
      }
      return sortOption.endsWith('asc') ? comparison : -comparison;
    });
  }, [history, searchTerm, viewMode, sortOption]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, viewMode]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedHistory.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    toast.info(`Excluindo ${selectedIds.size} diagnósticos...`);

    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'diagnostics', id));
      });
      await batch.commit();
      setSelectedIds(new Set());
      setIsBulkEdit(false);
      toast.success(`${selectedIds.size} diagnósticos excluídos com sucesso.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'diagnostics');
      toast.error("Erro ao excluir alguns diagnósticos.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isStudent ? 'Meus Diagnósticos' : 'Histórico de Diagnósticos'}</h2>
          <p className="text-gray-500">{isStudent ? 'Acesse seus resultados anteriores.' : 'Acesse diagnósticos gerados anteriormente.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {isProfessor && (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('active')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'active' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Ativos
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'archived' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Arquivados
              </button>
            </div>
          )}
          {isProfessor && filteredHistory.length > 0 && (
            <button
              onClick={() => {
                setIsBulkEdit(!isBulkEdit);
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isBulkEdit ? "bg-gray-200 text-gray-700" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              {isBulkEdit ? <X size={14} /> : <CheckSquare size={14} />}
              {isBulkEdit ? 'Cancelar Seleção' : 'Seleção em Massa'}
            </button>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-xs text-gray-500 font-medium">
              {filteredHistory.length} resultados encontrados
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              <span>Ordenar:</span>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent outline-none font-bold text-emerald-600"
              >
                <option value="date-desc">Data (Mais recente)</option>
                <option value="date-asc">Data (Mais antiga)</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              <span>Mostrar:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none font-bold text-emerald-600"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={isStudent ? "Buscar por data..." : "Buscar por aluno ou data..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>

      {isBulkEdit && isProfessor && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
            >
              {selectedIds.size === paginatedHistory.length ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedIds.size === paginatedHistory.length ? 'Desmarcar Todos' : 'Selecionar Todos na Página'}
            </button>
            <span className="text-xs font-medium text-emerald-600">
              {selectedIds.size} selecionado(s)
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-100 transition-all"
          >
            <Trash2 size={14} />
            Excluir Selecionados
          </button>
        </motion.div>
      )}

      {filteredHistory.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-gray-200 text-center space-y-4">
          <History className="mx-auto text-gray-300" size={48} />
          <p className="text-gray-500">Nenhum diagnóstico encontrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedHistory.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all group relative hover:scale-[1.02] hover:shadow-lg",
                  isBulkEdit && selectedIds.has(item.id) ? "border-emerald-500 shadow-md" : "border-gray-200 shadow-sm hover:shadow-md",
                  isBulkEdit && "cursor-pointer hover:scale-100 hover:shadow-sm"
                )}
                onClick={() => isBulkEdit && toggleSelect(item.id)}
              >
                {isBulkEdit && isProfessor && (
                  <div className="absolute top-4 left-4 z-10">
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="text-emerald-600" size={20} />
                    ) : (
                      <Square className="text-gray-300" size={20} />
                    )}
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600",
                    isBulkEdit && "ml-8"
                  )}>
                    <FileText size={20} />
                  </div>
                  {!isStudent && !isBulkEdit && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveDiagnostic(item.id, item.archived);
                        }}
                        className={cn(
                          "p-2 transition-all opacity-0 group-hover:opacity-100 rounded-lg",
                          item.archived ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                        )}
                        title={item.archived ? "Restaurar" : "Arquivar"}
                      >
                        {item.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDiagnostic(item.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "font-bold text-gray-900 truncate",
                    isBulkEdit && "ml-8"
                  )}>{item.aluno}</h3>
                  {item.archived && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">Arquivado</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {item.result?.diagnostico_por_competencia?.sort((a: any, b: any) => a.acuracia - b.acuracia)[0]?.competencia || 'Sem competência'}
                </div>
                <div className={cn(
                  "text-xs text-gray-400 mb-4",
                  isBulkEdit && "ml-8"
                )}>
                  {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()} às {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() : new Date(item.createdAt).toLocaleTimeString()}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">
                      {((item.result?.summary?.acuracia_geral || 0) * 100).toFixed(0)}%
                    </span>
                    <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(item.result?.summary?.acuracia_geral || 0) * 100}%` }} />
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.result) {
                        setResult(item.result);
                        setCurrentDiagnosticId(item.id);
                        navigate(`/dashboard/${item.id}`);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Página {currentPage} de {totalPages} • {filteredHistory.length} resultados
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                          currentPage === pageNum 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

import { X } from 'lucide-react';
