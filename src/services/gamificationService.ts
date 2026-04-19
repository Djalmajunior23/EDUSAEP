import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

// Shadow Gamification Engine
// Foca no engajamento subjacente e no XP sem parecer um "joguinho" infantil.

export interface GamificationAction {
  type: 'SIMULATION_COMPLETED' | 'LEARNING_PATH_PHASE' | 'FORUM_CONTRIBUTION' | 'DIAGNOSTIC_COMPLETED';
  baseXp: number;
  metadata?: any;
}

const ACTION_XP_MAP: Record<string, number> = {
  'SIMULATION_COMPLETED': 150,
  'LEARNING_PATH_PHASE': 300,
  'FORUM_CONTRIBUTION': 50,
  'DIAGNOSTIC_COMPLETED': 500,
};

export const calculateLevel = (xp: number = 0) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXPForNextLevel = (level: number) => {
  return Math.pow(level, 2) * 100;
};

class ShadowGamificationEngine {
  
  public async awardXP(actionType: keyof typeof ACTION_XP_MAP, multiplier: number = 1.0, showToast: boolean = true) {
    if (!auth.currentUser) return;

    const baseAmount = ACTION_XP_MAP[actionType] || 10;
    const finalXP = Math.round(baseAmount * multiplier);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const currentXP = userSnap.data().xp || 0;
        const currentLevel = calculateLevel(currentXP);
        const newXP = currentXP + finalXP;
        const newLevel = calculateLevel(newXP);

        await updateDoc(userRef, {
          xp: increment(finalXP),
          level: newLevel,
          lastActive: serverTimestamp()
        });

        if (showToast) {
          toast.success(`+${finalXP} XP adquiridos!`, {
            description: 'Seu engajamento impulsiona a IA.',
            icon: '⚡'
          });
        }

        // Shadow Level Up Detection
        if (newLevel > currentLevel && showToast) {
          toast.success(`Nível de Engajamento Subiu!`, {
            description: `Você atingiu o Patamar Evolutivo ${newLevel}. A IA adaptativa agora tem rotas mais complexas disponíveis para você.`,
            icon: '🧠',
            duration: 5000
          });
        }

        return { newXP, newLevel, leveledUp: newLevel > currentLevel };
      }
    } catch (error) {
      console.error("Error awarding Shadow XP:", error);
    }
  }

}

export const gamificationEngine = new ShadowGamificationEngine();
