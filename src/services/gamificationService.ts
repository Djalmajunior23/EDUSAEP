import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface GamificationProfile {
  studentId: string;
  points: number;
  level: number;
  experience: number;
  achievements: string[];
  streak: number;
  lastActivityAt: any;
  badges?: string[];
}

export interface RankingEntry {
  userId: string;
  name: string;
  photoURL: string | null;
  xp: number;
  level: number;
  badgesCount: number;
  streak: number;
}

export const XP_PER_LEVEL = 1000;

export const ACHIEVEMENTS = [
  { id: 'first_login', title: 'Pioneiro', description: 'Realizou o primeiro acesso à plataforma.', icon: '🚀' },
  { id: 'first_activity', title: 'Mão na Massa', description: 'Concluiu a primeira atividade.', icon: '✍️' },
  { id: 'streak_3', title: 'Foco Total', description: 'Manteve 3 dias seguidos de estudo.', icon: '🔥' },
  { id: 'level_10', title: 'Veterano', description: 'Alcançou o nível 10.', icon: '🎖️' }
];

export const gamificationService = {
  async getProfile(userId: string): Promise<GamificationProfile> {
    const stats = await this.getStudentStats(userId);
    if (!stats) {
      return { 
        studentId: userId,
        level: 1, 
        experience: 0, 
        points: 0, 
        streak: 0, 
        achievements: [],
        badges: [],
        lastActivityAt: new Date().toISOString()
      };
    }
    
    return {
      studentId: userId,
      points: stats.xp || 0,
      level: stats.level || 1,
      experience: stats.xp || 0,
      achievements: stats.badges || [],
      streak: stats.streak || 0,
      lastActivityAt: stats.lastUpdate || new Date().toISOString(),
      badges: stats.badges || []
    };
  },

  async createProfile(userId: string): Promise<GamificationProfile> {
    const newProfile: GamificationProfile = {
      studentId: userId,
      level: 1,
      experience: 0,
      points: 0,
      streak: 0,
      achievements: [],
      badges: [],
      lastActivityAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'gamificacao', userId), {
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
        lastUpdate: serverTimestamp()
      });
    } catch (e) {
      console.error("Error creating gamification profile:", e);
    }
    return newProfile;
  },

  async awardPoints(userId: string, points: number, reason?: string) {
    try {
      const docRef = doc(db, 'gamificacao', userId);
      await updateDoc(docRef, {
        xp: increment(points),
        lastUpdate: serverTimestamp()
      });
      console.log(`[Gamification] Awarded ${points} points to ${userId}${reason ? ` for ${reason}` : ''}`);
    } catch (e) {
      console.error("Error awarding points:", e);
    }
  },

  async awardXP(userId: string, xp: number, reason?: string) {
    return this.awardPoints(userId, xp, reason);
  },

  async getRanking(listLimit: number = 10): Promise<RankingEntry[]> {
    try {
      const gamifRef = collection(db, 'gamificacao');
      const q = query(gamifRef, orderBy('xp', 'desc'), limit(listLimit));
      const querySnapshot = await getDocs(q);
      
      const ranking: RankingEntry[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const userId = docSnapshot.id;
        
        const profileRef = doc(db, 'profiles', userId);
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : { name: "Usuário Desconhecido" };
        
        ranking.push({
          userId,
          name: profileData.name || "Usuário",
          photoURL: profileData.photoURL || null,
          xp: data.xp || 0,
          level: data.level || 1,
          badgesCount: (data.badges || []).length,
          streak: data.streak || 0
        });
      }
      
      return ranking;
    } catch (error) {
      console.error("[GamificationService] Error fetching ranking:", error);
      return [];
    }
  },

  async getStudentStats(userId: string) {
    try {
      const docRef = doc(db, 'gamificacao', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("[GamificationService] Error fetching student stats:", error);
      return null;
    }
  }
};

// Aliasing for backward compatibility with components that import gamificationEngine
export const gamificationEngine = gamificationService;
