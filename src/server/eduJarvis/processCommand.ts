import admin from 'firebase-admin';
import { importAgent } from './agents/importAgent';
import { EduJarvisRequest, EduJarvisResponse, Intent } from '../../types/eduJarvisTypes';
import { detectIntent } from './agentRouter';
import { canExecute } from './permissionService';
import { pedagogicalAgent } from './agents/pedagogicalAgent';
import { assessmentAgent } from './agents/assessmentAgent';
import { performanceAgent } from './agents/performanceAgent';
import { teacherCopilotAgent } from './agents/teacherCopilotAgent';
import { professorAgent } from './agents/professorAgent';
import { evaluatorAgent } from './agents/evaluatorAgent';
import { learningPathAgent } from './agents/learningPathAgent';
import { interventionAgent } from './agents/interventionAgent';
import { predictionAgent } from './agents/predictionAgent';
import { memoryAgent } from './agents/memoryAgent';
import { visionAgent } from './agents/visionAgent';
import { biAgent } from './agents/biAgent';
import { automationAgent } from './agents/automationAgent';
import { securityAgent } from './security/securityAgent';
import { logAudit } from './security/auditLogger';
import { questionOptimizerAgent } from './agents/questionOptimizerAgent';

export async function processCommand(request: EduJarvisRequest): Promise<EduJarvisResponse> {
  const { userId, userRole, command, context, image } = request;
  const db = admin.firestore();

  // 1. Detectar Intenção
  let intent = detectIntent(command);
  
  if (image && intent === "COMANDO_GERAL") {
    intent = "CORRECAO_VISAO";
  }

  // 2. Proteção de Segurança de Camada de IA (ML Security)
  const isSafe = await securityAgent(userId, userRole, command || "", intent);
  if (!isSafe) {
    return { 
      success: false,
      response: "⚠️ COMANDO BLOQUEADO: Detectamos um comportamento de risco. Sua conta foi sinalizada para auditoria administrativa.",
      metadata: { createdAt: new Date().toISOString() }
    };
  }

  // 3. Validar Permissão e Auditoria
  if (!canExecute(userRole, intent as any)) {
    await logAudit(userId, userRole, intent, 'bloqueado', 'medio');
    return {
      success: false,
      response: "Desculpe, seu perfil não tem permissão para esta ação específica. O EduJarvis registrou sua solicitação para análise da coordenação.",
      metadata: { createdAt: new Date().toISOString() }
    };
  }

  await logAudit(userId, userRole, intent, 'permitido', 'baixo');

  // 3. Recuperar Memória Pedagógica
  const memory = await memoryAgent.getMemory(userId);
  const memorySummary = await memoryAgent.getMemorySummary(userId);
  const enhancedContext = { ...context, memory, memorySummary };

  let result: EduJarvisResponse;

  const responseMetadata = {
    createdAt: new Date().toISOString(),
    costMode: request.costMode || "normal" as const
  };

  try {
    // 4. Roteamento de Agentes
    switch (intent as any) {
      case "CONSULTAR_MEMORIA":
        const summary = await memoryAgent.getMemorySummary(userId);
        result = { 
          success: true,
          response: summary, 
          action: 'CONSULTAR_MEMORIA',
          metadata: responseMetadata
        };
        break;
      case "CORRECAO_VISAO":
        if (!image) {
          result = { 
            success: false,
            response: "Para correção via visão, por favor envie uma imagem da prova ou exercício.",
            metadata: responseMetadata
          };
        } else {
          const visionResult = await visionAgent(command || "", userId, image, enhancedContext);
          result = {
            success: true,
            ...visionResult,
            metadata: responseMetadata
          };
        }
        break;
      case "GERAR_BI_INSIGHTS":
        const biResult = await biAgent(request);
        result = {
          success: true,
          response: biResult.resumoExecutivo || "Insights gerados.",
          data: biResult,
          action: intent,
          metadata: responseMetadata
        };
        break;
      case "GERAR_SIMULADO":
        const assessmentResult = await assessmentAgent(command || "", userId, enhancedContext);
        result = {
          success: true,
          ...assessmentResult,
          metadata: responseMetadata
        };
        break;
      case "ANALISAR_DESEMPENHO":
        const perfResult = await performanceAgent(command || "", userId, enhancedContext);
        result = {
          success: true,
          ...perfResult,
          metadata: responseMetadata
        };
        break;
      case "GERAR_TRILHA_APRENDIZAGEM":
        const lpResult = await learningPathAgent(command || "", userId, enhancedContext);
        result = {
          success: true,
          ...lpResult,
          metadata: responseMetadata
        };
        break;
      case "IMPORTAR_QUESTOES":
        const questionsImported = await importAgent(command || "", enhancedContext);
        result = { 
          success: true,
          response: `EduJarvis processou ${questionsImported.length} questões com sucesso.`, 
          data: questionsImported, 
          action: 'IMPORTAR_QUESTOES',
          metadata: responseMetadata
        };
        break;
      case "ANALISAR_RISCO_ACADEMICO":
        const predResult = await predictionAgent(command || "", userId, enhancedContext);
        result = {
          success: true,
          ...predResult,
          metadata: responseMetadata
        };
        break;
      case "GERAR_ESTUDO_CASO":
      case "GERAR_AULA_INVERTIDA":
      case "GERAR_PLANO_AULA":
      case "GERAR_AULA":
      case "GERAR_ATIVIDADE_PRATICA":
      case "GERAR_RUBRICA":
      case "SUGERIR_INTERVENCAO":
        const profResult = await professorAgent.process({ ...request, action: intent as any }, { userId, role: userRole, metadata: enhancedContext });
        result = {
          success: true,
          ...profResult,
          metadata: responseMetadata
        };
        break;
      case "CORRIGIR_RESPOSTA":
      case "AVALIAR_CONTEUDO":
      case "IDENTIFICAR_ERROS":
        const evalResult = await evaluatorAgent({ ...request, action: intent as any });
        result = {
          success: true,
          ...evalResult,
          metadata: responseMetadata
        };
        break;
      case "OTIMIZAR_QUESTAO":
        const optResult = await questionOptimizerAgent(command || "", userId, enhancedContext);
        result = {
          success: true,
          ...optResult,
          metadata: responseMetadata
        };
        break;
      case "EXPLICAR_CONTEUDO":
      case "COMANDO_GERAL":
      default:
        const aiRes = await pedagogicalAgent(command || "", enhancedContext);
        result = { 
          success: true,
          response: aiRes.text, 
          action: 'COMANDO_GERAL',
          metadata: responseMetadata
        };
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
    await memoryAgent.recordInteraction(userId, intent, command, result.response || '');

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
      success: false,
      response: "Ocorreu um erro ao processar seu comando. Por favor, tente novamente em alguns instantes.",
      metadata: { createdAt: new Date().toISOString() }
    };
  }
}
