import admin from 'firebase-admin';

export async function automationAgent(intent: string, payload: any) {
  const db = admin.firestore();
  
  // Registrar webhook pendente para n8n ou outros
  const webhookRef = await db.collection('jarvis_webhooks').add({
    intent,
    payload,
    status: 'pending',
    target: 'n8n_integration',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Nota: Na vida real, aqui faríamos um fetch para a URL do n8n cadastrada nas configurações da escola.
  console.log(`[Automation Agent] Webhook trigger created for intent: ${intent}`);

  return {
    webhookId: webhookRef.id,
    message: "Automação via n8n agendada com sucesso."
  };
}
