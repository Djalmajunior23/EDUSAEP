import React, { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Share2,
  Brain,
  Download,
  UserCheck,
  Pencil,
  Check,
  Trash2,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
  Zap,
  Users,
  Search,
  MessageSquare,
  History,
  TrendingDown,
  TrendingUp,
  Target,
  FileText,
  RotateCcw,
  Star,
  Plus,
  HelpCircle,
  XCircle,
  X,
  Lock,
  Settings,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import {
  DiagnosticResult,
  generateSuggestions,
  generateRecoveryPlan,
} from "../../services/geminiService";
import { UserProfile } from "../../types";
import {
  handleFirestoreError,
  OperationType,
} from "../../services/errorService";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { pdfExportService } from "../../services/pdfExportService";
import { n8nEvents } from "../../services/n8nService";
import { useAuth } from "../../contexts/AuthContext";

interface AlunoViewProps {
  result: DiagnosticResult | null;
  onUpdateResult: (newResult: DiagnosticResult) => void;
  diagnosticId: string | null;
  userProfile: UserProfile | null;
  history: any[];
  classAverages: Record<string, number>;
  selectedModel: string;
}

export function AlunoView({
  result,
  onUpdateResult,
  diagnosticId,
  userProfile,
  history,
  classAverages,
  selectedModel,
}: AlunoViewProps) {
  const { user, isProfessor } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "Todos" | "Forte" | "Atenção" | "Crítico"
  >("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none");
  const [editingComp, setEditingComp] = useState<string | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [editingQuestionFeedback, setEditingQuestionFeedback] = useState<
    string | null
  >(null);
  const [editingPrivateNote, setEditingPrivateNote] = useState<string | null>(
    null,
  );
  const [activeQuestionTabs, setActiveQuestionTabs] = useState<
    Record<string, "question" | "feedback">
  >({});
  const [editValue, setEditValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [notaValue, setNotaValue] = useState<string | number>("");
  const [privateNoteValue, setPrivateNoteValue] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<
    Record<string, boolean>
  >({});
  const reportRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  const studentHistory = useMemo(() => {
    if (!result || !history) return [];
    return history
      .filter((h) => h.result?.aluno === result.aluno)
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateA - dateB;
      });
  }, [result, history]);

  const uniqueCompetencies = useMemo(() => {
    const comps = new Set<string>();
    studentHistory.forEach((h) => {
      if (h.result?.diagnostico_por_competencia) {
        h.result.diagnostico_por_competencia.forEach((c: any) =>
          comps.add(c.competencia),
        );
      }
    });
    return Array.from(comps);
  }, [studentHistory]);

  const evolutionData = useMemo(() => {
    return studentHistory.map((h, i) => {
      const date = h.createdAt
        ? new Date(h.createdAt.seconds * 1000).toLocaleDateString()
        : `Simulado ${i + 1}`;
      const dataPoint: any = { name: date };
      if (h.result?.diagnostico_por_competencia) {
        h.result.diagnostico_por_competencia.forEach((c: any) => {
          dataPoint[c.competencia] = Math.round(c.acuracia_ponderada * 100);
        });
      }
      return dataPoint;
    });
  }, [studentHistory]);

  const CHART_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  const fetchSuggestions = async (comp: any) => {
    if (suggestions[comp.competencia]) return;
    setLoadingSuggestions((prev) => ({ ...prev, [comp.competencia]: true }));
    try {
      const newSuggestions = await generateSuggestions(
        comp.conhecimentos_fracos,
        comp.recomendacoes,
        selectedModel,
        (userProfile?.role as any) || "STUDENT",
      );
      setSuggestions((prev) => ({
        ...prev,
        [comp.competencia]: newSuggestions,
      }));
    } catch (err) {
      toast.error("Erro ao gerar sugestões.");
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [comp.competencia]: false }));
    }
  };

  const setQuestionTab = (
    questionKey: string,
    tab: "question" | "feedback",
  ) => {
    setActiveQuestionTabs((prev) => ({ ...prev, [questionKey]: tab }));
  };

  const exportToPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      await pdfExportService.exportElementToPDF(
        reportRef.current,
        "relatorio_diagnostico.pdf",
      );
      toast.success("Relatório exportado com sucesso!");
    } catch (err: any) {
      toast.error(
        `Erro ao gerar o PDF do relatório: ${err?.message || "Erro desconhecido"}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateRecoveryPlan = async () => {
    if (!result) return;
    setGeneratingPlan(true);
    try {
      let studentId = "";

      if (userProfile?.role === "STUDENT") {
        studentId = auth.currentUser?.uid || "";
      } else {
        const submissionsQuery = query(
          collection(db, "exam_submissions"),
          isProfessor
            ? where("studentId", "==", studentId)
            : where("studentId", "==", user?.uid),
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);

        if (!submissionsSnapshot.empty) {
          studentId = submissionsSnapshot.docs[0].data().studentId;
        } else {
          const usersQuery = query(
            collection(db, "users"),
            where("displayName", "==", result.aluno),
          );
          const usersSnapshot = await getDocs(usersQuery);
          if (!usersSnapshot.empty) {
            studentId = usersSnapshot.docs[0].id;
          }
        }
      }

      if (!studentId) {
        toast.error("Não foi possível identificar o ID do aluno.");
        setGeneratingPlan(false);
        return;
      }

      const analysesQuery = query(
        collection(db, "cognitive_error_analyses"),
        where("userId", "==", studentId),
      );
      const analysesSnapshot = await getDocs(analysesQuery);

      if (analysesSnapshot.empty) {
        toast.warning("Nenhuma análise de erro cognitivo encontrada.");
        setGeneratingPlan(false);
        return;
      }

      const studentAnalyses = analysesSnapshot.docs.map((doc) => doc.data());
      const aggregatedErrors = studentAnalyses.reduce(
        (acc: any[], curr: any) => {
          return acc.concat(curr.errors || []);
        },
        [],
      );

      const studentData = {
        studentId,
        studentName: result.aluno,
        totalErrors: aggregatedErrors.length,
        errors: aggregatedErrors,
      };

      const plan = await generateRecoveryPlan(
        studentData,
        selectedModel,
        (userProfile?.role as any) || "STUDENT",
      );

      await addDoc(collection(db, "recovery_plans"), {
        userId: studentId,
        studentName: result.aluno,
        ...plan,
        diagnosticId: diagnosticId,
        createdAt: serverTimestamp(),
      });

      const { notificationService } =
        await import("../../services/notificationService");
      await notificationService.createNotification({
        userId: studentId,
        title: "Novo Plano de Recuperação",
        message: "Um novo plano de estudos personalizado foi gerado para você.",
        type: "info" as any,
        link: "/study-plan",
      });

      try {
        const studentDoc = await getDoc(doc(db, "users", studentId));
        const studentInfo = studentDoc.exists() ? studentDoc.data() : null;

        await n8nEvents.recoveryPlanGenerated({
          studentId,
          studentEmail: studentInfo?.email,
          studentName: result.aluno,
          submissionId: diagnosticId || "diagnostic",
          plan: plan,
        });
      } catch (n8nErr) {
        console.warn("Failed to trigger n8n notification:", n8nErr);
      }

      toast.success("Plano de recuperação gerado!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "recovery_plans");
      toast.error("Erro ao gerar plano de recuperação.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const filteredCompetencias = useMemo(() => {
    if (!result) return [];
    let comps = result.diagnostico_por_competencia;

    if (filter !== "Todos") {
      comps = comps.filter((c) => c.nivel === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      comps = comps.filter((c) => c.competencia.toLowerCase().includes(term));
    }

    if (sortOrder !== "none") {
      const levelValues = { Forte: 3, Atenção: 2, Crítico: 1 };
      comps = [...comps].sort((a, b) => {
        const valA = levelValues[a.nivel as keyof typeof levelValues] || 0;
        const valB = levelValues[b.nivel as keyof typeof levelValues] || 0;
        if (valA !== valB) {
          return sortOrder === "desc" ? valA - valB : valB - valA;
        }
        return sortOrder === "desc"
          ? a.acuracia_ponderada - b.acuracia_ponderada
          : b.acuracia_ponderada - a.acuracia_ponderada;
      });
    }
    return comps;
  }, [result, filter, sortOrder, searchTerm]);

  const nextStepComp = useMemo(() => {
    if (!result) return null;
    return [...result.diagnostico_por_competencia].sort(
      (a, b) => a.acuracia_ponderada - b.acuracia_ponderada,
    )[0];
  }, [result]);

  const handleSaveEdit = async (
    competenciaName: string,
    type: string,
    value?: string | number,
    questionId?: string | number,
    nota?: string | number,
  ) => {
    if (!result) return;
    let updatedResult = { ...result };
    const newCompetencias = [...result.diagnostico_por_competencia];
    const idx = newCompetencias.findIndex(
      (c) => c.competencia === competenciaName,
    );

    if (type === "studentMessage") {
      updatedResult = {
        ...result,
        mensagem_para_o_aluno: (value !== undefined
          ? value
          : editValue) as string,
      };
    } else if (idx !== -1) {
      if (type === "recommendation") {
        newCompetencias[idx] = {
          ...newCompetencias[idx],
          recomendacoes: (value !== undefined ? value : editValue) as string,
        };
      } else if (type === "professorFeedback") {
        newCompetencias[idx] = {
          ...newCompetencias[idx],
          professor_feedback: (value !== undefined
            ? value
            : feedbackValue) as string,
        };
      } else if (type === "professorNota") {
        newCompetencias[idx] = {
          ...newCompetencias[idx],
          professor_nota: value !== undefined ? value : notaValue,
        };
      } else if (type === "fullFeedback") {
        newCompetencias[idx] = {
          ...newCompetencias[idx],
          professor_feedback: (value !== undefined
            ? value
            : feedbackValue) as string,
          professor_nota: nota !== undefined ? nota : notaValue,
        };
      } else if (
        type === "questionFeedback" ||
        type === "questionNota" ||
        type === "fullQuestionFeedback" ||
        type === "questionPrivateNote"
      ) {
        const qIdx = newCompetencias[idx].questoes?.findIndex(
          (q) => q.id === questionId,
        );
        if (
          qIdx !== undefined &&
          qIdx !== -1 &&
          newCompetencias[idx].questoes
        ) {
          const updatedQuestoes = [...newCompetencias[idx].questoes!];
          if (type === "questionFeedback") {
            updatedQuestoes[qIdx] = {
              ...updatedQuestoes[qIdx],
              professor_feedback: (value !== undefined
                ? value
                : feedbackValue) as string,
            };
          } else if (type === "questionNota") {
            updatedQuestoes[qIdx] = {
              ...updatedQuestoes[qIdx],
              professor_nota: value !== undefined ? value : notaValue,
            };
          } else if (type === "fullQuestionFeedback") {
            updatedQuestoes[qIdx] = {
              ...updatedQuestoes[qIdx],
              professor_feedback: (value !== undefined
                ? value
                : feedbackValue) as string,
              professor_nota: nota !== undefined ? nota : notaValue,
            };
          } else if (type === "questionPrivateNote") {
            updatedQuestoes[qIdx] = {
              ...updatedQuestoes[qIdx],
              private_notes: (value !== undefined
                ? value
                : privateNoteValue) as string,
            };
          }
          newCompetencias[idx] = {
            ...newCompetencias[idx],
            questoes: updatedQuestoes,
          };
        }
      } else {
        newCompetencias[idx] = {
          ...newCompetencias[idx],
          private_notes: (value !== undefined
            ? value
            : privateNoteValue) as string,
        };
      }
      updatedResult = {
        ...result,
        diagnostico_por_competencia: newCompetencias,
      };
    }

    onUpdateResult(updatedResult);

    if (diagnosticId) {
      try {
        await updateDoc(doc(db, "diagnostics", diagnosticId), {
          result: updatedResult,
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `diagnostics/${diagnosticId}`,
        );
      }
    }

    setEditingComp(null);
    setEditingFeedback(null);
    setEditingQuestionFeedback(null);
    setEditingPrivateNote(null);
    setNotaValue("");
    setFeedbackValue("");
  };

  if (!result)
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-500">Nenhum diagnóstico selecionado.</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            navigate(diagnosticId ? `/dashboard/${diagnosticId}` : "/dashboard")
          }
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Voltar ao Dashboard
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/shared-diagnostic/${diagnosticId}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success("Link copiado!");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            <Share2 size={14} /> Compartilhar
          </button>
          <button
            onClick={handleGenerateRecoveryPlan}
            disabled={generatingPlan}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            {generatingPlan ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Brain size={14} />
            )}{" "}
            Gerar Plano
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Download size={14} />
            )}{" "}
            PDF
          </button>
        </div>
      </div>

      <div
        ref={reportRef}
        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <UserCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {result.aluno}
              </h2>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                Relatório Individual
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col md:w-1/2 relative group">
            <h3 className="text-sm font-bold text-emerald-900 mb-2">
              Mensagem para o Aluno
            </h3>
            {isProfessor && editingComp !== "studentMessage" && (
              <button
                onClick={() => {
                  setEditingComp("studentMessage");
                  setEditValue(result.mensagem_para_o_aluno);
                }}
                className="absolute top-4 right-4 p-1 text-emerald-600 hover:bg-emerald-100 rounded opacity-0 group-hover:opacity-100"
              >
                <Pencil size={14} />
              </button>
            )}
            {editingComp === "studentMessage" ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border-2 border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingComp(null)}
                    className="text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveEdit("", "studentMessage")}
                    className="px-3 py-1 bg-emerald-600 text-white rounded font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-emerald-800 italic">
                "{result.mensagem_para_o_aluno}"
              </p>
            )}
          </div>
        </div>

        {/* Cognitive Profile */}
        {result.diagnostico_por_competencia.some((c) =>
          c.questoes?.some((q) => !q.acertou && q.analise_erro),
        ) && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Brain size={20} className="text-amber-600" /> Perfil de
              Dificuldades Cognitivas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Interpretação", "Conceito", "Atenção", "Lógica"].map((cat) => {
                const count = result.diagnostico_por_competencia.reduce(
                  (acc, c) =>
                    acc +
                    (c.questoes?.filter(
                      (q) => !q.acertou && q.analise_erro?.categoria === cat,
                    ).length || 0),
                  0,
                );
                if (count === 0) return null;
                return (
                  <div
                    key={cat}
                    className={cn(
                      "p-4 rounded-xl border text-center",
                      cat === "Interpretação"
                        ? "bg-blue-50 border-blue-100 text-blue-900"
                        : cat === "Conceito"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                          : cat === "Atenção"
                            ? "bg-amber-50 border-amber-100 text-amber-900"
                            : "bg-red-50 border-red-100 text-red-900",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      {cat}
                    </p>
                    <p className="text-3xl font-black">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico Histórico */}
        {studentHistory.length > 1 && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" /> Histórico de
              Evolução
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                  />
                  {uniqueCompetencies.map((comp, idx) => (
                    <Line
                      key={comp}
                      type="monotone"
                      dataKey={comp}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChartIcon size={20} className="text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Análise por Competência
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Forte">Forte</option>
                <option value="Atenção">Atenção</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredCompetencias.map((comp, idx) => (
              <motion.div
                key={idx}
                className={cn(
                  "p-6 bg-white border rounded-2xl shadow-sm",
                  comp.nivel === "Crítico"
                    ? "border-red-400 bg-red-50/10"
                    : "border-gray-100",
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        comp.nivel === "Forte"
                          ? "bg-emerald-500"
                          : comp.nivel === "Atenção"
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                    />
                    <h4 className="text-lg font-bold">{comp.competencia}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">
                      {Math.round(comp.acuracia_ponderada * 100)}%
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        comp.nivel === "Forte"
                          ? "text-emerald-600"
                          : comp.nivel === "Atenção"
                            ? "text-amber-600"
                            : "text-red-600",
                      )}
                    >
                      {comp.nivel}
                    </p>
                  </div>
                </div>

                {/* Comparison Bar */}
                <div className="mb-6 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>
                      Média da Turma:{" "}
                      {Math.round(classAverages[comp.competencia] || 0)}%
                    </span>
                    <span>
                      Status:{" "}
                      {Math.round(comp.acuracia_ponderada * 100) >=
                      (classAverages[comp.competencia] || 0)
                        ? "Acima"
                        : "Abaixo"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        comp.nivel === "Forte"
                          ? "bg-emerald-500"
                          : comp.nivel === "Atenção"
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                      style={{ width: `${comp.acuracia_ponderada * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      A Reforçar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comp.conhecimentos_fracos.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-50 text-xs rounded border border-gray-100"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        Recomendações
                      </p>
                      {isProfessor && (
                        <button
                          onClick={() => {
                            setEditingComp(comp.competencia);
                            setEditValue(comp.recomendacoes);
                          }}
                          className="text-[10px] text-emerald-600 font-bold hover:underline"
                        >
                          Personalizar
                        </button>
                      )}
                    </div>
                    {editingComp === comp.competencia ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-2 text-sm border-2 border-emerald-100 rounded-lg outline-none min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingComp(null)}
                            className="text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() =>
                              handleSaveEdit(comp.competencia, "recommendation")
                            }
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">
                        "{comp.recomendacoes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Sub-component: Questions Check */}
                {comp.questoes && comp.questoes.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-50">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4">
                      Detalhamento das Questões
                    </h5>
                    <div className="space-y-3">
                      {comp.questoes.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className={cn(
                            "p-4 rounded-xl border",
                            q.acertou
                              ? "bg-emerald-50/50 border-emerald-100"
                              : "bg-red-50/50 border-red-100",
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded",
                                q.acertou
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700",
                              )}
                            >
                              Questão {q.id}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {q.acertou ? "ACERTOU" : "ERROU"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium mb-3">
                            {q.enunciado || `Questão sobre ${comp.competencia}`}
                          </p>

                          {/* Feedback Tabs */}
                          <div className="flex items-center gap-2 mb-3">
                            <button
                              onClick={() =>
                                setQuestionTab(
                                  `${comp.competencia}-${q.id}`,
                                  "question",
                                )
                              }
                              className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded",
                                (activeQuestionTabs[
                                  `${comp.competencia}-${q.id}`
                                ] || "question") === "question"
                                  ? "bg-white shadow"
                                  : "text-gray-500",
                              )}
                            >
                              Pergunta
                            </button>
                            <button
                              onClick={() =>
                                setQuestionTab(
                                  `${comp.competencia}-${q.id}`,
                                  "feedback",
                                )
                              }
                              className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded",
                                activeQuestionTabs[
                                  `${comp.competencia}-${q.id}`
                                ] === "feedback"
                                  ? "bg-white shadow"
                                  : "text-gray-500",
                              )}
                            >
                              Feedback {q.professor_feedback && "✓"}
                            </button>
                          </div>

                          {(activeQuestionTabs[`${comp.competencia}-${q.id}`] ||
                            "question") === "question" ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-2 rounded border border-gray-100">
                                <p className="text-[9px] text-gray-400 font-bold uppercase">
                                  Resposta: {q.resposta_aluno}
                                </p>
                              </div>
                              <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                <p className="text-[9px] text-emerald-700 font-bold uppercase">
                                  Gabarito: {q.gabarito}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {isProfessor &&
                              editingQuestionFeedback ===
                                `${comp.competencia}-${q.id}` ? (
                                <div className="space-y-3 bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                                  <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">
                                        Nota (0-10)
                                      </label>
                                      <input
                                        type="text"
                                        value={notaValue}
                                        onChange={(e) =>
                                          setNotaValue(e.target.value)
                                        }
                                        className="w-full p-2 border rounded font-black text-center"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">
                                        Feedback
                                      </label>
                                      <textarea
                                        value={feedbackValue}
                                        onChange={(e) =>
                                          setFeedbackValue(e.target.value)
                                        }
                                        className="w-full p-2 border rounded text-xs min-h-[60px]"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        setEditingQuestionFeedback(null)
                                      }
                                      className="text-xs"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSaveEdit(
                                          comp.competencia,
                                          "fullQuestionFeedback",
                                          feedbackValue,
                                          q.id,
                                          notaValue,
                                        )
                                      }
                                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-white/50 rounded-lg">
                                  {q.professor_nota && (
                                    <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 font-black rounded text-xs mr-3">
                                      {q.professor_nota}
                                    </div>
                                  )}
                                  <p className="text-sm italic inline">
                                    "
                                    {q.professor_feedback ||
                                      "Nenhum feedback do professor."}
                                    "
                                  </p>
                                  {isProfessor && (
                                    <button
                                      onClick={() => {
                                        setEditingQuestionFeedback(
                                          `${comp.competencia}-${q.id}`,
                                        );
                                        setFeedbackValue(
                                          q.professor_feedback || "",
                                        );
                                        setNotaValue(q.professor_nota || "");
                                      }}
                                      className="ml-3 p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
