// import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Serviço para disparar alertas e automações para o n8n através do backend Express.
 */
export async function triggerN8NAlert(type: string, data: any, attempt = 1): Promise<boolean> {
  // Determinar o endpoint correto com base no tipo de evento
  let endpoint = 'alerts';
  if (type.includes('Plano') || type.includes('Plan')) {
    endpoint = 'plans';
  } else if (type === 'FileImport') {
    endpoint = 'import';
  }

  try {
    await triggerN8NRequest({
      type,
      attempt,
      ...data
    }, endpoint);
    return true;
  } catch (error) {
    console.error(`[n8n] Falha na tentativa ${attempt}:`, error);

    if (attempt < MAX_RETRIES) {
      const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      await delay(waitTime);
      return triggerN8NAlert(type, data, attempt + 1);
    }

    return false;
  }
}

/**
 * Realiza uma requisição ao backend Express que encaminha para o n8n.
 */
export async function triggerN8NRequest(data: any, endpoint: string = 'alerts'): Promise<any> {
  const isFormData = data instanceof FormData;
  
  const response = await fetch(`/api/n8n/${endpoint}`, {
    method: 'POST',
    headers: isFormData ? {} : {
      'Content-Type': 'application/json',
    },
    body: isFormData ? data : JSON.stringify(data),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

/**
 * Testa um webhook específico através do backend.
 */
export async function testWebhook(url: string, data: any): Promise<boolean> {
  try {
    const response = await fetch('/api/n8n/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, data })
    });
    return response.ok;
  } catch (error) {
    console.error("[n8n] Test failed:", error);
    return false;
  }
}

/**
 * Atalhos para eventos comuns de automação
 */
export const n8nEvents = {
  // Quando um aluno completa um simulado
  examCompleted: (data: { studentId: string, examId: string, score: number, proficiency: number }) => 
    triggerN8NAlert('SimuladoConcluido', data),

  // Quando um professor gera um plano de aula
  lessonPlanGenerated: (data: { professorId: string, turmaId: string, plan: any }) => 
    triggerN8NAlert('PlanoAulaGerado', data),

  // Quando um plano de recuperação é gerado para um aluno
  recoveryPlanGenerated: (data: { studentId: string, studentEmail?: string, studentName?: string, submissionId: string, plan: any }) => 
    triggerN8NAlert('EnviarPlanoEmail', data),

  // Quando um diagnóstico é importado/criado
  diagnosticCreated: (data: { professorId: string, aluno: string, result: any }) => 
    triggerN8NAlert('DiagnosticoCriado', data),

  // Quando uma intervenção SIPA é disparada
  sipaIntervention: (data: { professorId: string, turmaId: string, intervention: any }) => 
    triggerN8NAlert('SIPAIntervencao', data),

  // Quando uma recomendação pedagógica é gerada pela IA
  pedagogicalRecommendation: (data: { userId: string, recommendation: any }) => 
    triggerN8NAlert('RecomendacaoPedagogica', data),

  // Quando uma notificação é criada no sistema
  notificationCreated: (data: { userId: string, title: string, message: string, type: string }) =>
    triggerN8NAlert('NotificacaoCriada', data),

  // Quando uma nova turma é cadastrada
  classCreated: (data: { name: string, period: string, status: string }) =>
    triggerN8NAlert('TurmaCriada', data),

  // Quando uma nova disciplina é cadastrada
  disciplineCreated: (data: { name: string, code: string, area: string, status: string }) =>
    triggerN8NAlert('DisciplinaCriada', data),

  // Quando um arquivo é enviado para processamento (SIAC)
  fileImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'FileImport');
    formData.append('timestamp', new Date().toISOString());
    return triggerN8NAlert('FileImport', formData);
  }
};
