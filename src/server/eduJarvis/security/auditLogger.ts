import admin from 'firebase-admin';

export async function logAudit(userId: string, role: string, action: string, status: 'permitido' | 'bloqueado', risk: 'baixo' | 'medio' | 'alto' = 'baixo') {
  const db = admin.firestore();
  await db.collection('jarvis_auditoria').add({
    usuarioId: userId,
    perfil: role,
    acao: action,
    nivelRisco: risk,
    status,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
