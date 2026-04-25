import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export interface PedagogicalRule {
  id?: string;
  name: string;
  description: string;
  condition: {
    metric: 'performance' | 'engagement' | 'delivery_rate' | 'evolution';
    operator: '<' | '>' | '==' | '<=' | '>=';
    value: number;
    periodDays: number;
  };
  actions: {
    type: 'alert_teacher' | 'generate_path' | 'suggest_reinforcement' | 'flag_risk';
    target: 'student' | 'class';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  active: boolean;
  priority: number;
}

export interface RuleExecutionLog {
  ruleId: string;
  ruleName: string;
  targetId: string; // studentId or classId
  targetType: 'student' | 'class';
  matched: boolean;
  metricValue: number;
  actionsTriggered: string[];
  timestamp: any;
}

export class RuleEngineService {
  /**
   * Fetches all active rules from the database.
   */
  static async getActiveRules(): Promise<PedagogicalRule[]> {
    const q = query(
      collection(db, 'pedagogical_rules'), 
      where('active', '==', true),
      orderBy('priority', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PedagogicalRule));
  }

  /**
   * Evaluates a specific metric against a rule's condition.
   */
  private static evaluateCondition(value: number, condition: PedagogicalRule['condition']): boolean {
    switch (condition.operator) {
      case '<': return value < condition.value;
      case '>': return value > condition.value;
      case '==': return value === condition.value;
      case '<=': return value <= condition.value;
      case '>=': return value >= condition.value;
      default: return false;
    }
  }

  /**
   * Runs the engine for a specific student.
   */
  static async processStudentRules(studentId: string, stats: { performance: number; engagement: number; deliveryRate: number; evolution: number }) {
    const rules = await this.getActiveRules();
    const executions: RuleExecutionLog[] = [];

    for (const rule of rules) {
      let metricValue = 0;
      switch (rule.condition.metric) {
        case 'performance': metricValue = stats.performance; break;
        case 'engagement': metricValue = stats.engagement; break;
        case 'delivery_rate': metricValue = stats.deliveryRate; break;
        case 'evolution': metricValue = stats.evolution; break;
      }

      const matched = this.evaluateCondition(metricValue, rule.condition);
      
      if (matched) {
        // Trigger actions
        const actionsTriggered = rule.actions.map(a => a.type);
        
        // Log execution
        await addDoc(collection(db, 'rule_execution_logs'), {
          ruleId: rule.id,
          ruleName: rule.name,
          targetId: studentId,
          targetType: 'student',
          matched: true,
          metricValue,
          actionsTriggered,
          timestamp: serverTimestamp()
        });

        // Actually trigger system alerts
        for (const action of rule.actions) {
          if (action.type === 'alert_teacher') {
            await addDoc(collection(db, 'smart_alerts'), {
              targetUserId: studentId,
              type: metricValue < 30 ? 'Risco de Evasão' : 'Queda de Desempenho',
              message: `Regra "${rule.name}" disparada. Valor atual: ${metricValue}%`,
              severity: action.priority === 'critical' ? 'Crítica' : action.priority === 'high' ? 'Alta' : 'Média',
              status: 'Novo',
              createdAt: serverTimestamp()
            });
          }
          // Other actions like generate_path would be calling pedagogicalService
        }
      }
    }
  }

  /**
   * Seed default rules if none exist (for initial setup).
   */
  static async seedDefaultRules() {
    const rules = [
      {
        name: 'Risco Crítico de Desempenho',
        description: 'Alerta quando a média de acerto cai abaixo de 40%.',
        condition: { metric: 'performance', operator: '<', value: 40, periodDays: 30 },
        actions: [{ type: 'alert_teacher', target: 'student', priority: 'critical' }],
        active: true,
        priority: 100
      },
      {
        name: 'Engajamento Baixo',
        description: 'Alerta quando a taxa de interação com a plataforma é menor que 30%.',
        condition: { metric: 'engagement', operator: '<', value: 30, periodDays: 15 },
        actions: [{ type: 'alert_teacher', target: 'student', priority: 'high' }],
        active: true,
        priority: 80
      }
    ];

    for (const r of rules) {
      await addDoc(collection(db, 'pedagogical_rules'), r);
    }
  }
}
