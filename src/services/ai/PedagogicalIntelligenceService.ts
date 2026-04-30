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

export class PedagogicalIntelligenceService {
  static async analyze(
    input: PedagogicalAnalysisInput
  ): Promise<PedagogicalAnalysisResult> {
    try {
      // Chamada para o backend EduJarvis
      const response = await fetch("/api/edu-jarvis/process", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
              userId: "system",
              userRole: "TEACHER",
              agent: "bi",
              action: "pedagogicalAnalysis",
              input: input
          })
      }).catch(err => {
        console.warn("[EduJarvis Service] Fetch Error:", err);
        throw new Error("Erro de comunicação backend");
      });

      if (!response.ok) {
        console.error(`[EduJarvis Service] HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error(`Falha na API de IA: ${response.status}`);
      }
      
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
      console.error("Erro no PedagogicalIntelligenceService:", error);

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

export default PedagogicalIntelligenceService;
