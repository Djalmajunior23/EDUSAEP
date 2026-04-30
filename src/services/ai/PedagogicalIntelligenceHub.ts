export interface PedagogicalAnalysisInput {
  turmaId?: string;
  alunoId?: string;
  questoes?: any[];
  respostas?: any[];
  desempenho?: any;
  competencias?: any[];
}

export interface PedagogicalAnalysisResult {
  resumo: string;
  pontosFortes: string[];
  pontosDeAtencao: string[];
  recomendacoes: string[];
  nivelRisco: "baixo" | "medio" | "alto";
}

export class PedagogicalIntelligenceHub {
  static async analyze(
    input: PedagogicalAnalysisInput
  ): Promise<PedagogicalAnalysisResult> {
    try {
      // Simulação de chamada para o backend EduJarvis
      const response = await fetch("/api/edu-jarvis/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              userId: "system", // Em um cenário real, pegar o ID logado
              userRole: "TEACHER",
              agent: "bi",
              action: "pedagogicalAnalysis",
              input: input
          })
      });

      if (!response.ok) throw new Error("Falha na API de IA");
      
      const result = await response.json();
      
      if (result.success && result.data) {
          return {
              resumo: result.data.resumoExecutivo || "Análise concluída.",
              pontosFortes: result.data.pontosFortes || [],
              pontosDeAtencao: result.data.competenciasCriticas || [],
              recomendacoes: result.data.recomendacoesPedagogicas || [],
              nivelRisco: result.data.alunosEmRisco?.length > 0 ? "alto" : "baixo"
          };
      }

      return {
        resumo: "Análise pedagógica gerada com base nos dados disponíveis.",
        pontosFortes: [],
        pontosDeAtencao: [],
        recomendacoes: [
          "Revisar competências com menor desempenho.",
          "Aplicar atividades de recuperação direcionadas."
        ],
        nivelRisco: "baixo"
      };
    } catch (error) {
      console.error("Erro no PedagogicalIntelligenceHub:", error);

      return {
        resumo: "Não foi possível gerar a análise automática neste momento.",
        pontosFortes: [],
        pontosDeAtencao: ["Falha temporária na análise pedagógica."],
        recomendacoes: ["Tente novamente mais tarde."],
        nivelRisco: "medio"
      };
    }
  }
}

export default PedagogicalIntelligenceHub;
