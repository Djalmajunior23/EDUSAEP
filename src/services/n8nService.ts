import { toast } from 'sonner';

/**
 * Serviço para disparar alertas e automações para o n8n em produção.
 */
export async function triggerN8NAlert(type: string, data: any) {
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
        timestamp: new Date().toISOString(),
        ...data
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro n8n: ${response.statusText}`);
    }

    console.log(`[n8n] Alerta ${type} enviado com sucesso.`);
    return true;
  } catch (error) {
    console.error('[n8n] Erro ao disparar alerta:', error);
    // Não exibimos toast de erro para o usuário final para não atrapalhar o fluxo, 
    // mas logamos no console para debug.
    return false;
  }
}
