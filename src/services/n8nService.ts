import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Serviço para disparar alertas e automações para o n8n em produção.
 */
export async function triggerN8NAlert(webhookUrl: string | null, type: string, data: any, attempt = 1): Promise<boolean> {
  let finalUrl = webhookUrl;

  if (!finalUrl) {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().webhookUrl) {
        finalUrl = docSnap.data().webhookUrl;
      }
    } catch (err) {
      console.error("[n8n] Erro ao buscar webhook global:", err);
    }
  }

  if (!finalUrl) {
    console.warn(`[n8n] Webhook URL não configurada para o alerta ${type}.`);
    return false;
  }

  try {
    const response = await fetch(finalUrl, {
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

    return true;
  } catch (error) {
    console.error(`[n8n] Falha na tentativa ${attempt}:`, error);

    if (attempt < MAX_RETRIES) {
      const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      await delay(waitTime);
      return triggerN8NAlert(type, data, attempt + 1);
    }

    // Se todas as tentativas falharem, registramos mas não bloqueamos o usuário
    return false;
  }
}
