import admin from 'firebase-admin';
import { EduJarvisRequest, EduJarvisResponse, Intent } from '../../types/eduJarvisTypes';
import { detectIntent } from './agentRouter';
import { canExecute } from './permissionService';
import { pedagogicalAgent } from './agents/pedagogicalAgent';
import { assessmentAgent } from './agents/assessmentAgent';
import { performanceAgent } from './agents/performanceAgent';
import { teacherCopilotAgent } from './agents/teacherCopilotAgent';
import { learningPathAgent } from './agents/learningPathAgent';
import { interventionAgent } from './agents/interventionAgent';
import { predictionAgent } from './agents/predictionAgent';
import { memoryAgent } from './agents/memoryAgent';
import { visionAgent } from './agents/visionAgent';
import { biAgent } from './agents/biAgent';
import { automationAgent } from './agents/automationAgent';
import { securityAgent } from './security/securityAgent';
import { logAudit } from './security/auditLogger';

export async function processCommand(request: EduJarvisRequest): Promise<EduJarvisResponse> {
  const { userId, userRole, command, context, image } = request;
  const db = admin.firestore();

  // 1. Detectar Intenção
  let intent = detectIntent(command);
  
  if (image && intent === "COMANDO_GERAL") {
    intent = "CORRECAO_VISAO";
  }

  // 2. Proteção de Segurança de Camada de IA (ML Security)
  const isSafe = await securityAgent(userId, userRole, command, intent);
  if (!isSafe) {
    return { response: "⚠️ COMANDO BLOQUEADO: Detectamos um comportamento de risco. Sua conta foi sinalizada para auditoria administrativa." };
  }

  // 3. Validar Permissão e Auditoria
  if (!canExecute(userRole, intent)) {
    await logAudit(userId, userRole, intent, 'bloqueado', 'medio');
    return {
      response: "Desculpe, seu perfil não tem permissão para esta ação específica. O EduJarvis registrou sua solicitação para análise da coordenação."
    };
  }

  await logAudit(userId, userRole, intent, 'permitido', 'baixo');

  // 3. Recuperar Memória Pedagógica
  const memory = await memoryAgent.getMemory(userId);
  const enhancedContext = { ...context, memory };

  let result: EduJarvisResponse;

  try {
    // 4. Roteamento de Agentes
    switch (intent) {
      case "CONSULTAR_MEMORIA":
        const summary = await memoryAgent.getMemorySummary(userId);
        result = { response: summary, actionType: 'CONSULTAR_MEMORIA' };
        break;
      case "CORRECAO_VISAO":
        if (!image) {
          result = { response: "Para correção via visão, por favor envie uma imagem da prova ou exercício." };
        } else {
          result = await visionAgent(command, userId, image, enhancedContext);
        }
        break;
      case "GERAR_BI_INSIGHTS":
        result = await biAgent(command, userId, enhancedContext);
        break;
      case "GERAR_SIMULADO":
        result = await assessmentAgent(command, userId, enhancedContext);
        break;
      case "ANALISAR_DESEMPENHO":
        result = await performanceAgent(command, userId, enhancedContext);
        break;
      case "GERAR_TRILHA_APRENDIZAGEM":
        result = await learningPathAgent(command, userId, enhancedContext);
        break;
      case "SUGERIR_INTERVENCAO":
        result = await interventionAgent(command, userId, enhancedContext);
        break;
      case "ANALISAR_RISCO_ACADEMICO":
        result = await predictionAgent(command, userId, enhancedContext);
        break;
      case "GERAR_ESTUDO_CASO":
        result = await teacherCopilotAgent(command, userId, 'GERAR_ESTUDO_CASO', enhancedContext);
        break;
      case "GERAR_AULA_INVERTIDA":
        result = await teacherCopilotAgent(command, userId, 'GERAR_AULA_INVERTIDA', enhancedContext);
        break;
      case "GERAR_PLANO_AULA":
        result = await teacherCopilotAgent(command, userId, 'GERAR_PLANO_AULA', enhancedContext);
        break;
      case "EXPLICAR_CONTEUDO":
      case "COMANDO_GERAL":
      default:
        const aiRes = await pedagogicalAgent(command, enhancedContext);
        result = { response: aiRes.text, actionType: 'COMANDO_GERAL' };
        break;
    }

    // 5. Automação (n8n Webhooks)
    if (intent === "GERAR_RELATORIO_SEMANAL" || intent === "GERAR_PLANO_AULA") {
      await automationAgent(intent, result);
    }

    // 5.1 Salvar Insights na Memória
    if (result.response) {
      await memoryAgent.saveInsightsFromResponse(userId, result.response);
    }

    // 6. Atualizar Memória (Interação Recente)
    await memoryAgent.updateGeneric(userId, {
      usoTotal: admin.firestore.FieldValue.increment(1) as any,
      historicoInteracoes: admin.firestore.FieldValue.arrayUnion({
        intent,
        timestamp: new Date().toISOString()
      })
    });

    // 7. Registrar Logs de Operação
    await db.collection('jarvis_logs').add({
      usuarioId: userId,
      perfil: userRole,
      comando: command,
      resposta: result.response,
      tipoAcao: intent,
      status: 'sucesso',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return result;

  } catch (error: any) {
    console.error("[EduJarvis ProcessCommand] Error:", error);
    
    await db.collection('jarvis_logs').add({
      usuarioId: userId,
      perfil: userRole,
      comando: command,
      status: 'erro',
      erroMensagem: error.message,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      response: "Ocorreu um erro ao processar seu comando. Por favor, tente novamente em alguns instantes."
    };
  }
}
