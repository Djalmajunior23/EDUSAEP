import { EduJarvisRequest, EduJarvisResponse } from "../../types/eduJarvisTypes";
import { AgentContext } from "./agents/baseAgent";
import { professorAgent } from "./agents/professorAgent";
import { gamificationAgent } from "./agents/gamificationAgent";

export class EduJarvisCore {
    
    public static async processRequest(
        request: EduJarvisRequest,
        context: AgentContext
    ): Promise<EduJarvisResponse> {
        console.log(`[EduJarvis] Orquestrando agente: ${request.agent} para usuário ${request.userId}`);
        
        // Em um sistema real, poderíamos ter um registro de agentes
        let agent;
        switch(request.agent) {
            case 'professor':
                agent = professorAgent;
                break;
            case 'gamification':
                agent = gamificationAgent;
                break;
            default:
                throw new Error("Agente não implementado na nova arquitetura.");
        }

        const data = await agent.process(request, context);
        
        return {
            response: "Processamento concluído com sucesso.",
            success: true,
            agent: request.agent,
            action: request.action,
            data,
            metadata: {
                createdAt: new Date().toISOString()
            }
        };
    }
}
