import { EduJarvisRequest, AgentType } from "../../types/eduJarvisTypes";
import { professorAgent } from "./agents/professorAgent";
import { studentAgent } from "./agents/studentAgent";
import { evaluatorAgent } from "./agents/evaluatorAgent";
import { questionAgent } from "./agents/questionAgent";
import { biAgent } from "./agents/biAgent";
import { tutorAgent } from "./agents/tutorAgent";
import { fallbackAgent } from "./agents/fallbackAgent";
import { adaptiveTrailAgent } from "./agents/adaptiveTrailAgent";

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
