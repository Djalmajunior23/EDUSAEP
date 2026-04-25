import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { GamificationProfile } from '../types';

interface LevelInfo {
  name: string;
  color: string;
  description: string;
  minXp: number;
}

const LEVELS: LevelInfo[] = [
  { name: 'Iniciante', color: 'bg-slate-500', description: 'Bem-vindo à sua jornada de aprendizado!', minXp: 0 },
  { name: 'Aprendiz', color: 'bg-blue-500', description: 'Você está começando a dominar os conceitos básicos.', minXp: 1000 },
  { name: 'Explorador', color: 'bg-emerald-500', description: 'Sua curiosidade está levando você mais longe.', minXp: 5000 },
  { name: 'Mestre', color: 'bg-amber-500', description: 'Um verdadeiro especialista em sua área.', minXp: 15000 },
  { name: 'Lenda', color: 'bg-purple-600', description: 'Seu conhecimento inspirará gerações futuras.', minXp: 50000 },
];

export const useGamification = (userId: string | undefined) => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelInfo, setLevelInfo] = useState<{ next?: LevelInfo; current: LevelInfo; progress: number } | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'gamification_profiles', userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GamificationProfile;
        setProfile(data);
        
        const currentExp = data.experience || 0;
        
        // Find current level (manual reverse loop for compatibility)
        let currentLevelIdx = -1;
        for (let i = LEVELS.length - 1; i >= 0; i--) {
          if (currentExp >= LEVELS[i].minXp) {
            currentLevelIdx = i;
            break;
          }
        }
        
        const currentLevel = LEVELS[currentLevelIdx >= 0 ? currentLevelIdx : 0];
        const nextLevel = LEVELS[currentLevelIdx + 1];
        
        let progress = 0;
        if (nextLevel) {
          const levelRange = nextLevel.minXp - currentLevel.minXp;
          const expInLevel = currentExp - currentLevel.minXp;
          progress = (expInLevel / levelRange) * 100;
        } else {
          progress = 100;
        }

        setLevelInfo({
          current: currentLevel,
          next: nextLevel,
          progress
        });
      } else {
        setLevelInfo({
          current: LEVELS[0],
          next: LEVELS[1],
          progress: 0
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { profile, levelInfo, loading };
};
