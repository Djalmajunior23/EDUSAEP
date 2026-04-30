import { EduJarvisRequest } from "../../../types/eduJarvisTypes";

export interface AgentContext {
    userId: string;
    role: string;
    classId?: string;
    metadata: Record<string, any>;
}

export interface Agent {
    name: string;
    systemInstruction: string;
    process: (request: EduJarvisRequest, context: AgentContext) => Promise<any>;
}
