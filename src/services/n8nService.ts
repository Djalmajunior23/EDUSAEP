import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Serviço para disparar alertas e automações para o n8n em produção.
 */
export async function triggerN8NAlert(type: string, data: any, attempt = 1): Promise<boolean> {
  // URL da sua VPS com n8n
  const WEBHOOK_URL = 'https://n8n.meudominio.com/webhook/edusaep-study-plan';

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        attempt,
        timestamp: new Date().toISOString(),
        ...data
      }),
      // Timeout de 10 segundos para não travar o app
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[n8n] Alerta ${type} enviado com sucesso na tentativa ${attempt}.`);
    return true;
  } catch (error) {
    console.error(`[n8n] Falha na tentativa ${attempt}:`, error);

    if (attempt < MAX_RETRIES) {
      const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`[n8n] Aguardando ${waitTime}ms para nova tentativa...`);
      await delay(waitTime);
      return triggerN8NAlert(type, data, attempt + 1);
    }

    // Se todas as tentativas falharem, registramos mas não bloqueamos o usuário
    return false;
  }
}
