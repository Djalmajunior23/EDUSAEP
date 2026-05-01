import { EduJarvisRequest, EduJarvisResponse, AgentType } from "../../types/eduJarvisTypes";
import { generatePromptHash, getAICache, saveAICache } from "./aiCache";
import { logAIUsage } from "./aiLogger";
import { routeToAgent } from "./agentRouter";
import { logger } from "../../utils/logger";

const MODULE = 'JARVIS_CORE';

export class EduJarvisCore {
    
    private static canUseLocalRule(request: EduJarvisRequest): boolean {
        const localActions = [
            "calculateEduScore",
            "classifyPerformance",
            "recommendByScore",
            "simpleRanking"
        ];
        return localActions.includes(request.action || "");
    }

    private static executeLocalRule(request: EduJarvisRequest): any {
        const score = request.input?.score ?? 0;
        
        if (request.action === "classifyPerformance") {
            if (score < 40) return { level: "crítico", recommendation: "recuperação imediata" };
            if (score < 60) return { level: "baixo", recommendation: "reforço pedagógico" };
            if (score < 80) return { level: "médio", recommendation: "prática orientada" };
            return { level: "alto", recommendation: "desafio avançado" };
        }

        if (request.action === "calculateEduScore") {
            const performance = request.input?.performance ?? 0;
            const consistency = request.input?.consistency ?? 0;
            const evolution = request.input?.evolution ?? 0;

            return {
                eduScore: Math.round(performance * 0.5 + consistency * 0.25 + evolution * 0.25)
            };
        }

        return null;
    }

    public static async processRequest(
        request: EduJarvisRequest
    ): Promise<EduJarvisResponse> {
        const costMode = request.costMode ?? "economico";
        const userId = request.userId;

        try {
            // 1. Local Rule Check
            if (this.canUseLocalRule(request)) {
                const data = this.executeLocalRule(request);
                await logAIUsage({
                    userId,
                    agent: request.agent as string,
                    action: request.action as string,
                    source: "local_rule",
                    status: "success",
                    costMode
                });

                return {
                    success: true,
                    source: "local_rule",
                    agent: request.agent,
                    action: request.action,
                    response: "Processamento via motor de regras locais concluído.",
                    data,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        cached: false,
                        costMode
                    }
                };
            }

            // 2. Cache Check
            const hash = generatePromptHash({
                agent: request.agent,
                action: request.action,
                input: request.input,
                context: request.context,
                command: request.command
            });

            const cached = await getAICache(hash);
            if (cached) {
                await logAIUsage({
                    userId,
                    agent: request.agent as string,
                    action: request.action as string,
                    source: "cache",
                    status: "success",
                    costMode
                });

                return {
                    success: true,
                    source: "cache",
                    agent: request.agent,
                    action: request.action,
                    response: typeof cached === 'string' ? cached : "Dados recuperados do cache inteligente.",
                    data: typeof cached === 'object' ? cached : null,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        cached: true,
                        costMode
                    }
                };
            }

            // 3. AI Agent Routing
            logger.info(MODULE, `Routing request - Agent: ${request.agent}, Action: ${request.action}`);
            const data = await routeToAgent(request);

            // 4. Save to Cache
            await saveAICache({
                hash,
                response: data,
                feature: `${request.agent}:${request.action}`,
                ttlHours: 24
            });

            // 5. Log Success
            await logAIUsage({
                userId,
                agent: request.agent as string,
                action: request.action as string,
                source: "ai",
                status: "success",
                costMode
            });

            return {
                success: true,
                source: "ai",
                agent: request.agent,
                action: request.action,
                response: data.response || data.text || "Insight gerado com sucesso pelo EduJarvis.",
                data,
                metadata: {
                    createdAt: new Date().toISOString(),
                    cached: false,
                    costMode
                }
            };

        } catch (error: any) {
            logger.error(MODULE, `Agent error, trying fallback: ${error.message}`);
            
            try {
                // Tenta rotear para o fallbackAgent se o agente específico falhar
                const { fallbackAgent } = await import("./agents/fallbackAgent");
                const fallbackData = await fallbackAgent(request);
                
                return {
                    success: true,
                    source: "ai_fallback",
                    agent: "fallback",
                    action: request.action,
                    response: fallbackData.response || fallbackData.text || "Insight gerado via agente de contingência.",
                    data: fallbackData,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        cached: false,
                        costMode: "economico",
                        error_fallback: error.message
                    }
                };
            } catch (fallbackError: any) {
                logger.error(MODULE, "Critical Failure in Orchestrator", fallbackError);
                await logAIUsage({
                    userId,
                    agent: request.agent as string,
                    action: request.action as string,
                    source: "ai",
                    status: "error",
                    costMode,
                    error: `${error.message} | Fallback Error: ${fallbackError.message}`
                });

                return {
                    success: false,
                    response: "Não foi possível processar sua solicitação nem mesmo com o sistema de contingência. Por favor, tente um comando mais simples.",
                    data: null,
                    metadata: {
                        createdAt: new Date().toISOString(),
                        costMode
                    }
                };
            }
        }
    }
}
