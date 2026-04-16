import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  setDoc,
  Timestamp
} from 'firebase/firestore';

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  allowedRoles: string[];
  allowedUsers: string[]; // UID list for beta testing
  isBeta: boolean;
}

export class ConfigService {
  /**
   * Checks if a specific feature is enabled for a user. (Module 13 & 14)
   */
  static async isFeatureEnabled(featureKey: string, userId: string, userRole: string): Promise<boolean> {
    const flagDoc = await getDoc(doc(db, 'feature_flags', featureKey));
    if (!flagDoc.exists()) return false;

    const flag = flagDoc.data() as FeatureFlag;

    if (!flag.enabled) return false;

    // 1. Role Check
    if (flag.allowedRoles.length > 0 && !flag.allowedRoles.includes(userRole)) {
      return false;
    }

    // 2. Beta User Check
    if (flag.allowedUsers.length > 0 && flag.allowedUsers.includes(userId)) {
      return true;
    }

    // 3. Rollout Percentage (Deterministic hash based on userId)
    if (flag.rolloutPercentage > 0) {
      const hash = this.stringToHash(userId + featureKey);
      const userValue = Math.abs(hash % 100);
      return userValue < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  private static stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; 
    }
    return hash;
  }

  /**
   * Initializes default system flags.
   */
  static async seedFeatureFlags() {
    const flags: FeatureFlag[] = [
      {
        key: 'advanced_analytics',
        description: 'Módulo de Saúde da Turma e Comparativo',
        enabled: true,
        rolloutPercentage: 100,
        allowedRoles: ['professor', 'admin'],
        allowedUsers: [],
        isBeta: false
      },
      {
        key: 'ai_intervention',
        description: 'Motor de Recomendação Híbrido (IA + Regras)',
        enabled: true,
        rolloutPercentage: 50,
        allowedRoles: ['professor', 'aluno'],
        allowedUsers: [],
        isBeta: true
      }
    ];

    for (const f of flags) {
      await setDoc(doc(db, 'feature_flags', f.key), f);
    }
  }
}
