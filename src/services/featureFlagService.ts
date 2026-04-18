import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface FeatureFlags {
  pedagogicalTwin: boolean;
  activeRemediation: boolean;
  sipaSimulator: boolean;
  advancedBi: boolean;
  predictiveAlerts: boolean;
  smartQuestionBank: boolean;
  gamificationV2: boolean;
  n8nIntegration: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  pedagogicalTwin: true,
  activeRemediation: true,
  sipaSimulator: true,
  advancedBi: true,
  predictiveAlerts: true,
  smartQuestionBank: true,
  gamificationV2: true,
  n8nIntegration: true,
};

class FeatureFlagService {
  private flags: FeatureFlags = DEFAULT_FLAGS;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // In a real multi-tenant app, this would be specific to the organization/institution
    const configRef = doc(db, 'system_config', 'feature_flags');
    
    onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        this.flags = { ...DEFAULT_FLAGS, ...snapshot.data() } as FeatureFlags;
        this.notify();
      } else {
        // Initialize with defaults if empty
        setDoc(configRef, DEFAULT_FLAGS).catch(console.error);
      }
    });
  }

  public isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  public getFlags(): FeatureFlags {
    return this.flags;
  }

  public subscribe(callback: (flags: FeatureFlags) => void) {
    this.listeners.add(callback);
    callback(this.flags);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.flags));
  }
}

export const featureFlags = new FeatureFlagService();
