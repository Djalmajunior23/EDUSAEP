import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface InstitutionalRules {
  // Limites de Risco e Desempenho
  riskThresholdCritical: number; // ex: 40 (abaixo de 40% é risco crítico)
  riskThresholdWarning: number;  // ex: 60 (abaixo de 60% é aviso)
  excellenceThreshold: number;   // ex: 90 (acima de 90% é excelência)

  // Políticas de Carga Cognitiva (Consistência da Experiência)
  maxWeeklyAssignments: number;  // ex: 5 (evita sobrecarga)
  dailyStudyTimeLimitHours: number; // ex: 4

  // IA e Automação
  aiInterventionConfidenceMin: number; // ex: 0.85 (não dispara intervenção/SIPA abaixo de 85% de confiança)
  autoApproveRemediation: boolean;     // IA pode disparar emails/alertas sem clicar?
  
  // Avaliação e Pesos (Pesos Globais Padrão)
  weightCodeQuestions: number;
  weightImageQuestions: number;
  weightTextQuestions: number;
}

const DEFAULT_RULES: InstitutionalRules = {
  riskThresholdCritical: 35,
  riskThresholdWarning: 60,
  excellenceThreshold: 85,
  
  maxWeeklyAssignments: 6,
  dailyStudyTimeLimitHours: 3,

  aiInterventionConfidenceMin: 0.80,
  autoApproveRemediation: false, // Por segurança no Protagonismo do Professor, o padrão é falso

  weightCodeQuestions: 1.5,
  weightImageQuestions: 1.0,
  weightTextQuestions: 1.0,
};

export interface PedagogicalRule {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  priority: number;
  condition: {
    metric: string;
    operator: string;
    value: number;
  };
  actions: {
    type: string;
    priority: string;
  }[];
}

class RulesEngineService {
  private rules: InstitutionalRules = DEFAULT_RULES;
  private listeners: Set<(rules: InstitutionalRules) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    const rulesRef = doc(db, 'system_config', 'institutional_rules');
    
    onSnapshot(rulesRef, (snapshot) => {
      if (snapshot.exists()) {
        this.rules = { ...DEFAULT_RULES, ...snapshot.data() } as InstitutionalRules;
        this.isInitialized = true;
        this.notify();
      } else {
        setDoc(rulesRef, DEFAULT_RULES).catch(console.error);
      }
    });
  }

  // Permite acesso síncrono limpo para lógicas matemáticas e visuais
  public getRules(): InstitutionalRules {
    return this.rules;
  }

  // Permite regras serem executadas dinamicamente via "Conditioners"
  public evaluateRisk(score: number): 'critical' | 'warning' | 'safe' | 'excellent' {
    if (score < this.rules.riskThresholdCritical) return 'critical';
    if (score < this.rules.riskThresholdWarning) return 'warning';
    if (score >= this.rules.excellenceThreshold) return 'excellent';
    return 'safe';
  }

  public canAssignMoreWork(currentWeeklyCount: number): boolean {
     return currentWeeklyCount < this.rules.maxWeeklyAssignments;
  }

  public shouldAutoTriggerSIPA(aiConfidence: number): boolean {
      return this.rules.autoApproveRemediation && aiConfidence >= this.rules.aiInterventionConfidenceMin;
  }

  public subscribe(callback: (rules: InstitutionalRules) => void) {
    this.listeners.add(callback);
    if(this.isInitialized) { callback(this.rules); }
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.rules));
  }
}

export const rulesEngine = new RulesEngineService();
