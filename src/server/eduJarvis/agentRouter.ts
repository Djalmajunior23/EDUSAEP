import { EduJarvisRequest, AgentType } from "../../types/eduJarvisTypes";
import { professorAgent } from "./agents/professorAgent";
import { studentAgent } from "./agents/studentAgent";
import { evaluatorAgent } from "./agents/evaluatorAgent";
import { questionAgent } from "./agents/questionAgent";
import { biAgent } from "./agents/biAgent";
import { tutorAgent } from "./agents/tutorAgent";
import { fallbackAgent } from "./agents/fallbackAgent";
import { adaptiveTrailAgent } from "./agents/adaptiveTrailAgent";
import { pedagogicalAgent } from "./agents/pedagogicalAgent";
import { assessmentAgent } from "./agents/assessmentAgent";
import { performanceAgent } from "./agents/performanceAgent";
import { learningPathAgent } from "./agents/learningPathAgent";
import { interventionAgent } from "./agents/interventionAgent";

export function detectIntent(command?: string): string {
  if (!command) return "COMANDO_GERAL";
  
  const lowerCmd = command.toLowerCase();
  
  // Orquestrador - Mapeamento de Intenções Ultra
  if (lowerCmd.includes("simulado") || lowerCmd.includes("prova")) return "GERAR_SIMULADO";
  if (lowerCmd.includes("trilha") || lowerCmd.includes("roteiro")) return "GERAR_TRILHA_APRENDIZAGEM";
  if (lowerCmd.includes("risco") || lowerCmd.includes("evasão")) return "ANALISAR_RISCO_ACADEMICO";
  if (lowerCmd.includes("bi") || lowerCmd.includes("insight")) return "GERAR_BI_INSIGHTS";
  if (lowerCmd.includes("desempenho") || lowerCmd.includes("análise de dados")) return "ANALISAR_DESEMPENHO";
  if (lowerCmd.includes("plano de aula") || lowerCmd.includes("planejamento")) return "GERAR_PLANO_AULA";
  if (lowerCmd.includes("aula invertida") || lowerCmd.includes("flipped")) return "GERAR_AULA_INVERTIDA";
  if (lowerCmd.includes("estudo de caso")) return "GERAR_ESTUDO_CASO";
  if (lowerCmd.includes("rubrica")) return "GERAR_RUBRICA";
  if (lowerCmd.includes("aula") && lowerCmd.includes("gerar")) return "GERAR_AULA";
  if (lowerCmd.includes("dúvida") || lowerCmd.includes("explicar") || lowerCmd.includes("o que é")) return "EXPLICAR_CONTEUDO";
  if (lowerCmd.includes("atividade") || lowerCmd.includes("exercício")) return "GERAR_ATIVIDADE";
  if (lowerCmd.includes("intervenção") || lowerCmd.includes("ajuda")) return "SUGERIR_INTERVENCAO";
  if (lowerCmd.includes("corrigir") || lowerCmd.includes("correção")) return "CORRIGIR_RESPOSTA";
  if (lowerCmd.includes("avaliar") || lowerCmd.includes("avaliação")) return "AVALIAR_CONTEUDO";
  if (lowerCmd.includes("erro conceitual") || lowerCmd.includes("diagnóstico")) return "IDENTIFICAR_ERROS";
  if (lowerCmd.includes("plano de estudo") || lowerCmd.includes("recuperação")) return "CRIAR_PLANO_ESTUDO";
  if (lowerCmd.includes("taxonomia") || lowerCmd.includes("bloom")) return "CLASSIFICAR_BLOOM";
  
  return "COMANDO_GERAL";
}

export async function routeToAgent(request: EduJarvisRequest) {
  const agents: Record<string, (req: EduJarvisRequest) => Promise<any>> = {
    professor: (req) => professorAgent.process(req, { userId: req.userId, role: req.userRole, metadata: {} }),
    student: studentAgent,
    evaluator: evaluatorAgent,
    question: questionAgent,
    bi: biAgent,
    tutor: tutorAgent,
    fallback: fallbackAgent,
    adaptiveTrail: adaptiveTrailAgent,
    pedagogical: (req) => pedagogicalAgent(req.command || "", req.context),
    assessment: assessmentAgent,
    performance: performanceAgent,
    learningPath: learningPathAgent,
    intervention: interventionAgent
  };

  // Logic to handle auto-detection if agent is not specified or is 'auto'
  let targetAgentName = request.agent as string;
  if (!targetAgentName || targetAgentName === 'auto') {
    const intent = detectIntent(request.command);
    if (intent.includes("SIMULADO")) targetAgentName = "assessment";
    else if (intent.includes("TRILHA") || intent.includes("PLANO_ESTUDO")) targetAgentName = "learningPath";
    else if (intent.includes("RISCO") || intent.includes("DESEMPENHO")) targetAgentName = "performance";
    else if (intent.includes("BI")) targetAgentName = "bi";
    else if (intent.includes("CORRIGIR") || intent.includes("ERRO")) targetAgentName = "evaluator";
    else if (intent.includes("RUBRICA") || intent.includes("AULA") || intent.includes("CASO")) targetAgentName = "pedagogical";
    else if (intent.includes("ATIVIDADE")) targetAgentName = "question";
    else targetAgentName = "fallback";
  }

  const selectedAgent = agents[targetAgentName] || fallbackAgent;

  return await selectedAgent(request);
}
