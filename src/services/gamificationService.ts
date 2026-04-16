import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const BADGES: Badge[] = [
  { id: 'first_exam', name: 'Primeiro Passo', description: 'Concluiu seu primeiro simulado.', icon: '🎯', xpReward: 100 },
  { id: 'perfect_score', name: 'Gênio', description: 'Acertou todas as questões de uma competência.', icon: '🧠', xpReward: 500 },
  { id: 'streak_3', name: 'Focado', description: 'Acessou a plataforma por 3 dias seguidos.', icon: '🔥', xpReward: 200 },
  { id: 'tri_champion', name: 'Mestre da Lógica', description: 'Acertou uma questão de nível difícil na TRI.', icon: '⚖️', xpReward: 300 },
];

export async function addXP(userId: string, amount: number) {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      xp: increment(amount)
    });
    
    // Check for level up logic
    const userDoc = await getDoc(userRef);
    const data = userDoc.data();
    if (data) {
      const currentXP = data.xp || 0;
      const currentLevel = data.level || 1;
      const nextLevelThreshold = currentLevel * 1000;
      
      if (currentXP >= nextLevelThreshold) {
        await updateDoc(userRef, {
          level: increment(1)
        });
        toast.success(`🎉 Nível UP! Você agora está no nível ${currentLevel + 1}!`);
      }
    }
  } catch (error) {
    console.error("Error updating XP:", error);
  }
}

export async function awardBadge(userId: string, badgeId: string) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;

  const userRef = doc(db, 'users', userId);
  try {
    const userDoc = await getDoc(userRef);
    const data = userDoc.data();
    
    if (data && !data.badges?.includes(badgeId)) {
      await updateDoc(userRef, {
        badges: arrayUnion(badgeId)
      });
      await addXP(userId, badge.xpReward);
      toast(`🏅 Medalha Conquistada: ${badge.name}!`, {
        description: badge.description,
        icon: badge.icon
      });
    }
  } catch (error) {
    console.error("Error awarding badge:", error);
  }
}
