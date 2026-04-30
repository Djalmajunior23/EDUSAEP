import admin from 'firebase-admin';

export interface Mission {
  id: string;
  title: string;
  objective: string;
  rewardXP: number;
  type: 'daily' | 'competency' | 'recovery';
  status: 'active' | 'completed';
}

export async function generateMissions(studentId: string, profile: any): Promise<Mission[]> {
  const db = admin.firestore();
  
  const missions: Mission[] = [
    {
      id: `daily_${Date.now()}`,
      title: "Consistência é Tudo",
      objective: "Realize 5 atividades hoje",
      rewardXP: 50,
      type: 'daily',
      status: 'active'
    }
  ];

  // Se o aluno tem dificuldade em alguma competência, gera missão de recuperação
  if (profile?.criticalCompetencies?.length > 0) {
    missions.push({
      id: `rec_${Date.now()}`,
      title: "Desafio de Superação",
      objective: `Melhore seu desempenho em ${profile.criticalCompetencies[0]}`,
      rewardXP: 100,
      type: 'recovery',
      status: 'active'
    });
  }

  // Salvar no banco
  for (const mission of missions) {
    await db.collection('student_missions').add({
      ...mission,
      studentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return missions;
}
