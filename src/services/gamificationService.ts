import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { GamificationProfile, Achievement } from '../types';
import { toast } from 'sonner';

export const XP_PER_LEVEL = 1000;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_activity',
    title: 'Primeiros Passos',
    description: 'Concluiu sua primeira atividade na plataforma.',
    icon: '🎯',
    xpReward: 50,
    type: 'engagement'
  },
  {
    id: 'five_activities',
    title: 'Explorador Dedicado',
    description: 'Concluiu 5 atividades com sucesso.',
    icon: '🧭',
    xpReward: 200,
    type: 'academic'
  },
  {
    id: 'quiz_master',
    title: 'Mestre dos Quizzes',
    description: 'Respondeu a 3 quizzes interativos.',
    icon: '🧠',
    xpReward: 150,
    type: 'academic'
  },
  {
    id: 'high_performer',
    title: 'Alta Performance',
    description: 'Manteve uma média acima de 90% em 3 avaliações seguidas.',
    icon: '⚡',
    xpReward: 500,
    type: 'academic'
  }
];

export const getNextLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const LevelConfig = {
  XP_PER_LEVEL,
  MAX_LEVEL: 100
};

export type { GamificationProfile } from '../types';

export const gamificationService = {
  async getProfile(studentId: string): Promise<GamificationProfile | null> {
    const docRef = doc(db, 'gamification_profiles', studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as GamificationProfile;
    }
    
    const newProfile: GamificationProfile = {
      studentId,
      points: 0,
      level: 1,
      experience: 0,
      achievements: [],
      streak: 0,
      lastActivityAt: serverTimestamp()
    };
    
    await setDoc(docRef, newProfile);
    return newProfile;
  },

  // Alias for getProfile that matches some components
  async createProfile(studentId: string): Promise<GamificationProfile> {
    const profile = await this.getProfile(studentId);
    return profile || {
      studentId,
      points: 0,
      level: 1,
      experience: 0,
      achievements: [],
      streak: 0,
      lastActivityAt: serverTimestamp()
    } as GamificationProfile;
  },

  async awardPoints(studentId: string, points: number, experience: number): Promise<void> {
    const profile = await this.getProfile(studentId);
    if (!profile) return;

    const newExp = profile.experience + experience;
    const newPoints = profile.points + points;
    const newLevel = getNextLevel(newExp);

    const docRef = doc(db, 'gamification_profiles', studentId);
    await updateDoc(docRef, {
      points: newPoints,
      experience: newExp,
      level: newLevel,
      lastActivityAt: serverTimestamp()
    });

    if (newLevel > profile.level) {
      toast.success(`Parabéns! Você alcançou o nível ${newLevel}!`);
    }
  },

  // Compatibility aliases
  async awardXP(studentId: string, amount: number): Promise<void> {
    await this.awardPoints(studentId, 0, amount);
  },

  async addXP(studentId: string, amount: number): Promise<void> {
    await this.awardPoints(studentId, 0, amount);
  },

  async checkAndAwardAchievement(studentId: string, achievementId: string): Promise<void> {
    const profile = await this.getProfile(studentId);
    if (!profile) return;

    if (profile.achievements.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    const newAchievements = [...profile.achievements, achievementId];
    const docRef = doc(db, 'gamification_profiles', studentId);
    
    await updateDoc(docRef, {
      achievements: newAchievements,
      experience: profile.experience + achievement.xpReward
    });

    toast.success(`Conquista Desbloqueada: ${achievement.title}!`, {
      description: achievement.description
    });
  },

  // Alias for checkAndAwardAchievement
  async awardBadge(studentId: string, badgeId: string): Promise<void> {
    await this.checkAndAwardAchievement(studentId, badgeId);
  }
};

// Compatibility aliases
export const gamificationEngine = gamificationService;
