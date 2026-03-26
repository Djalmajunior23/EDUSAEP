/**
 * Serviço para integração com n8n
 */

export async function triggerN8NAlert(
  type: 'RecomendacaoPedagogica' | 'AlertaPedagogico' | 'PlanoAulaGerado',
  data: any
) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL não configurada. Alerta não disparado.");
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        data,
      }),
    });
    console.log(`Alerta ${type} disparado para o n8n.`);
  } catch (error) {
    console.error(`Erro ao disparar alerta ${type} para o n8n:`, error);
  }
}
