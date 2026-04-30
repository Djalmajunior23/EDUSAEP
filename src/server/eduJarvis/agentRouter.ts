import { EduJarvisRequest, AgentType } from "../../types/eduJarvisTypes";
import { professorAgent } from "./agents/professorAgent";
import { studentAgent } from "./agents/studentAgent";
import { evaluatorAgent } from "./agents/evaluatorAgent";
import { questionAgent } from "./agents/questionAgent";
import { biAgent } from "./agents/biAgent";
import { tutorAgent } from "./agents/tutorAgent";
import { fallbackAgent } from "./agents/fallbackAgent";
import { adaptiveTrailAgent } from "./agents/adaptiveTrailAgent";

export function detectIntent(command?: string): string {
  if (!command) return "COMANDO_GERAL";
  
  const lowerCmd = command.toLowerCase();
  if (lowerCmd.includes("simulado") || lowerCmd.includes("prova")) return "GERAR_SIMULADO";
  if (lowerCmd.includes("trilha") || lowerCmd.includes("roteiro")) return "GERAR_TRILHA_APRENDIZAGEM";
  if (lowerCmd.includes("risco") || lowerCmd.includes("evasão")) return "ANALISAR_RISCO_ACADEMICO";
  if (lowerCmd.includes("bi") || lowerCmd.includes("insight")) return "GERAR_BI_INSIGHTS";
  if (lowerCmd.includes("plano de aula")) return "GERAR_PLANO_AULA";
  
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
    adaptiveTrail: adaptiveTrailAgent
  };

  const selectedAgent = agents[request.agent as string] || fallbackAgent;

  return await selectedAgent(request);
}
