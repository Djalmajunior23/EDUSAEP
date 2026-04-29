import admin from 'firebase-admin';

export async function securityAgent(userId: string, role: string, command: string, intent: string) {
  const db = admin.firestore();
  
  // Detecção de Padrões Suspeitos (ML para Segurança)
  const isSuspicious = command.length > 2000 || command.includes('<script>') || command.includes('DROP TABLE');
  
  if (isSuspicious) {
    await db.collection('jarvis_auditoria').add({
      usuarioId: userId,
      perfil: role,
      acao: intent,
      comando: command,
      nivelRisco: 'alto',
      status: 'bloqueado',
      motivo: 'Detecção de Injeção ou Flood',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return false;
  }

  return true;
}
