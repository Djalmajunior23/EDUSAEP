export type UserProfileType = 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'MONITOR' | 'STUDENT';

export type CompetencyStatus = 'MASTERED' | 'DEVELOPING' | 'CRITICAL';
export type HealthStatus = 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ErrorType =
  | 'CONCEPTUAL'
  | 'INTERPRETATION'
  | 'DISTRACTION'
  | 'EXECUTION'
  | 'TIME_MANAGEMENT'
  | 'UNKNOWN';

export interface CompetencyPerformance {
  competencyId: string;
  competencyName: string;
  averageScore: number; // 0..100
  attempts: number;
  lastScore?: number;
  status?: CompetencyStatus;
}

export interface ActivitySummary {
  activityId: string;
  title: string;
  delivered: boolean;
  deliveredAt?: string;
  submittedLate?: boolean;
  grade?: number; // 0..100
  corrected?: boolean;
  requiresResubmission?: boolean;
}

export interface ErrorPattern {
  competencyId: string;
  occurrences: number;
  lastSeenAt?: string;
  wrongTopics: string[];
  errorType: ErrorType;
}

export interface StudentSignals {
  studentId: string;
  studentName: string;
  classId: string;
  attendanceRate: number; // 0..100
  accessFrequencyLast14Days: number; // logins or study sessions
  averageStudyMinutesLast14Days: number;
  deliveryRate: number; // 0..100
  averageGrade: number; // 0..100
  recentTrend: number; // -100..100, negative means falling
  pendingActivities: number;
  lateSubmissions: number;
  missedDeadlines: number;
  competencies: CompetencyPerformance[];
  activities: ActivitySummary[];
  errors: ErrorPattern[];
  lastInteractionAt?: string;
}

export interface TeacherContext {
  teacherId: string;
  classId: string;
  className: string;
  subjectName: string;
}

export interface EngineRuleConfig {
  highRiskAverageGradeBelow: number;
  mediumRiskAverageGradeBelow: number;
  lowDeliveryRateThreshold: number;
  mediumDeliveryRateThreshold: number;
  lowAccessThreshold: number;
  mediumAccessThreshold: number;
  criticalCompetencyThreshold: number;
  developingCompetencyThreshold: number;
  trendCriticalThreshold: number;
  trendAttentionThreshold: number;
  maxRecommendations: number;
  maxRecoveryActions: number;
  highRiskScoreThreshold: number;
  mediumRiskScoreThreshold: number;
}

export interface Recommendation {
  id: string;
  type:
    | 'STUDY_PLAN'
    | 'RECOVERY_TRACK'
    | 'TEACHER_ALERT'
    | 'PRACTICE_SET'
    | 'CONTENT_REVIEW'
    | 'INTERVENTION'
    | 'CHALLENGE_UP'
    | 'CHECKIN';
  title: string;
  description: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  targetProfile: UserProfileType;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export interface CompetencyInsight {
  competencyId: string;
  competencyName: string;
  status: CompetencyStatus;
  reason: string;
  recommendedAction?: string;
}

export interface StudentRiskAssessment {
  studentId: string;
  studentName: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  healthStatus: HealthStatus;
}

export interface PedagogicalDecision {
  studentId: string;
  studentName: string;
  risk: StudentRiskAssessment;
  competencyInsights: CompetencyInsight[];
  recommendations: Recommendation[];
  groupedErrorSummary: {
    byType: Record<ErrorType, number>;
    total: number;
    dominantType: ErrorType;
  };
  nextBestActionForTeacher?: string;
  nextBestActionForStudent?: string;
}

export interface ClassOverview {
  classId: string;
  healthStatus: HealthStatus;
  averageGrade: number;
  averageDeliveryRate: number;
  studentsAtHighRisk: number;
  studentsAtMediumRisk: number;
  criticalCompetencies: string[];
  recommendations: Recommendation[];
}

const DEFAULT_CONFIG: EngineRuleConfig = {
  highRiskAverageGradeBelow: 50,
  mediumRiskAverageGradeBelow: 65,
  lowDeliveryRateThreshold: 50,
  mediumDeliveryRateThreshold: 75,
  lowAccessThreshold: 2,
  mediumAccessThreshold: 5,
  criticalCompetencyThreshold: 50,
  developingCompetencyThreshold: 70,
  trendCriticalThreshold: -20,
  trendAttentionThreshold: -10,
  maxRecommendations: 5,
  maxRecoveryActions: 3,
  highRiskScoreThreshold: 75,
  mediumRiskScoreThreshold: 45,
};

export class PedagogicalEngine {
  private readonly config: EngineRuleConfig;

  constructor(config?: Partial<EngineRuleConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public evaluateStudent(student: StudentSignals, teacher: TeacherContext): PedagogicalDecision {
    const risk = this.calculateRisk(student);
    const competencyInsights = this.evaluateCompetencies(student.competencies);
    const groupedErrorSummary = this.summarizeErrors(student.errors);
    const recommendations = this.buildRecommendations(student, teacher, risk, competencyInsights, groupedErrorSummary)
      .slice(0, this.config.maxRecommendations);

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      risk,
      competencyInsights,
      recommendations,
      groupedErrorSummary,
      nextBestActionForTeacher: recommendations.find((r) => r.targetProfile === 'TEACHER')?.title,
      nextBestActionForStudent: recommendations.find((r) => r.targetProfile === 'STUDENT')?.title,
    };
  }

  public evaluateClass(students: StudentSignals[], teacher: TeacherContext): ClassOverview {
    if (students.length === 0) {
      return {
        classId: teacher.classId,
        healthStatus: 'HEALTHY',
        averageGrade: 0,
        averageDeliveryRate: 0,
        studentsAtHighRisk: 0,
        studentsAtMediumRisk: 0,
        criticalCompetencies: [],
        recommendations: [],
      };
    }

    const decisions = students.map((student) => this.evaluateStudent(student, teacher));
    const averageGrade = round(avg(students.map((s) => s.averageGrade)));
    const averageDeliveryRate = round(avg(students.map((s) => s.deliveryRate)));
    const studentsAtHighRisk = decisions.filter((d) => d.risk.level === 'HIGH').length;
    const studentsAtMediumRisk = decisions.filter((d) => d.risk.level === 'MEDIUM').length;

    const criticalCompetencies = this.aggregateCriticalCompetencies(decisions);
    const healthStatus = this.calculateClassHealth(
      averageGrade,
      averageDeliveryRate,
      studentsAtHighRisk,
      students.length,
    );

    const recommendations: Recommendation[] = [];

    if (studentsAtHighRisk > 0) {
      recommendations.push({
        id: uid('rec'),
        type: 'INTERVENTION',
        title: 'Planejar intervenção com alunos em risco',
        description: `Há ${studentsAtHighRisk} aluno(s) em alto risco na turma ${teacher.className}.`,
        reason: 'Alto volume de alunos com sinais críticos de desempenho e/ou engajamento.',
        priority: 'HIGH',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { classId: teacher.classId, studentsAtHighRisk },
      });
    }

    if (criticalCompetencies.length > 0) {
      recommendations.push({
        id: uid('rec'),
        type: 'CONTENT_REVIEW',
        title: 'Realizar revisão coletiva das competências críticas',
        description: `As competências mais críticas da turma são: ${(criticalCompetencies || []).join(', ')}.`,
        reason: 'A turma apresenta concentração de baixo desempenho em competências específicas.',
        priority: 'HIGH',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { classId: teacher.classId, criticalCompetencies },
      });
    }

    if (averageDeliveryRate < this.config.mediumDeliveryRateThreshold) {
      recommendations.push({
        id: uid('rec'),
        type: 'CHECKIN',
        title: 'Reforçar comunicação sobre prazos e entregas',
        description: 'A taxa média de entrega da turma está abaixo do esperado.',
        reason: 'Taxa de entrega baixa compromete o acompanhamento pedagógico.',
        priority: 'MEDIUM',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { classId: teacher.classId, averageDeliveryRate },
      });
    }

    return {
      classId: teacher.classId,
      healthStatus,
      averageGrade,
      averageDeliveryRate,
      studentsAtHighRisk,
      studentsAtMediumRisk,
      criticalCompetencies,
      recommendations,
    };
  }

  private calculateRisk(student: StudentSignals): StudentRiskAssessment {
    let score = 0;
    const reasons: string[] = [];

    if (student.averageGrade < this.config.highRiskAverageGradeBelow) {
      score += 30;
      reasons.push('Média geral muito abaixo do esperado.');
    } else if (student.averageGrade < this.config.mediumRiskAverageGradeBelow) {
      score += 18;
      reasons.push('Média geral abaixo do esperado.');
    }

    if (student.deliveryRate < this.config.lowDeliveryRateThreshold) {
      score += 22;
      reasons.push('Taxa de entrega baixa.');
    } else if (student.deliveryRate < this.config.mediumDeliveryRateThreshold) {
      score += 12;
      reasons.push('Taxa de entrega abaixo do ideal.');
    }

    if (student.accessFrequencyLast14Days <= this.config.lowAccessThreshold) {
      score += 16;
      reasons.push('Pouca interação recente com a plataforma.');
    } else if (student.accessFrequencyLast14Days <= this.config.mediumAccessThreshold) {
      score += 8;
      reasons.push('Interação recente abaixo do esperado.');
    }

    if (student.recentTrend <= this.config.trendCriticalThreshold) {
      score += 18;
      reasons.push('Queda crítica de desempenho recente.');
    } else if (student.recentTrend <= this.config.trendAttentionThreshold) {
      score += 9;
      reasons.push('Queda de desempenho recente.');
    }

    if (student.missedDeadlines > 0) {
      score += Math.min(10, student.missedDeadlines * 3);
      reasons.push('Perdeu prazos de atividades recentemente.');
    }

    const criticalCompetencies = student.competencies.filter(
      (c) => c.averageScore < this.config.criticalCompetencyThreshold,
    ).length;
    if (criticalCompetencies > 0) {
      score += Math.min(18, criticalCompetencies * 6);
      reasons.push('Há competências críticas com baixo domínio.');
    }

    const level: RiskLevel = score >= this.config.highRiskScoreThreshold
      ? 'HIGH'
      : score >= this.config.mediumRiskScoreThreshold
        ? 'MEDIUM'
        : 'LOW';

    const healthStatus: HealthStatus = level === 'HIGH' ? 'CRITICAL' : level === 'MEDIUM' ? 'ATTENTION' : 'HEALTHY';

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      score: round(score),
      level,
      reasons,
      healthStatus,
    };
  }

  private evaluateCompetencies(competencies: CompetencyPerformance[]): CompetencyInsight[] {
    return competencies.map((competency) => {
      let status: CompetencyStatus;
      let reason: string;
      let recommendedAction: string | undefined;

      if (competency.averageScore < this.config.criticalCompetencyThreshold) {
        status = 'CRITICAL';
        reason = `A competência ${competency.competencyName} está com média crítica (${competency.averageScore}).`;
        recommendedAction = 'Gerar trilha de recuperação e prática guiada.';
      } else if (competency.averageScore < this.config.developingCompetencyThreshold) {
        status = 'DEVELOPING';
        reason = `A competência ${competency.competencyName} ainda está em desenvolvimento (${competency.averageScore}).`;
        recommendedAction = 'Aplicar revisão direcionada e exercícios intermediários.';
      } else {
        status = 'MASTERED';
        reason = `A competência ${competency.competencyName} apresenta bom domínio (${competency.averageScore}).`;
        recommendedAction = 'Liberar desafios avançados e consolidação.';
      }

      return {
        competencyId: competency.competencyId,
        competencyName: competency.competencyName,
        status,
        reason,
        recommendedAction,
      };
    });
  }

  private summarizeErrors(errors: ErrorPattern[]): {
    byType: Record<ErrorType, number>;
    total: number;
    dominantType: ErrorType;
  } {
    const byType: Record<ErrorType, number> = {
      CONCEPTUAL: 0,
      INTERPRETATION: 0,
      DISTRACTION: 0,
      EXECUTION: 0,
      TIME_MANAGEMENT: 0,
      UNKNOWN: 0,
    };

    for (const error of errors) {
      byType[error.errorType] += error.occurrences;
    }

    const total = Object.values(byType).reduce((sum, value) => sum + value, 0);
    const dominantType = (Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'UNKNOWN') as ErrorType;

    return { byType, total, dominantType };
  }

  private buildRecommendations(
    student: StudentSignals,
    teacher: TeacherContext,
    risk: StudentRiskAssessment,
    competencies: CompetencyInsight[],
    errors: { byType: Record<ErrorType, number>; total: number; dominantType: ErrorType },
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (risk.level === 'HIGH') {
      recommendations.push({
        id: uid('rec'),
        type: 'TEACHER_ALERT',
        title: 'Intervenção pedagógica imediata',
        description: `O aluno ${student.studentName} apresenta risco alto e precisa de acompanhamento prioritário.`,
        reason: (risk.reasons || []).join(' '),
        priority: 'HIGH',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { studentId: student.studentId, classId: teacher.classId },
      });

      recommendations.push({
        id: uid('rec'),
        type: 'RECOVERY_TRACK',
        title: 'Gerar trilha de recuperação individual',
        description: 'Criar trilha com revisão dos pré-requisitos e prática guiada.',
        reason: 'Risco alto combinado com desempenho ou engajamento insuficiente.',
        priority: 'HIGH',
        targetProfile: 'STUDENT',
        targetId: student.studentId,
        metadata: { studentId: student.studentId },
      });
    }

    if (student.deliveryRate < this.config.mediumDeliveryRateThreshold || student.pendingActivities > 0) {
      recommendations.push({
        id: uid('rec'),
        type: 'CHECKIN',
        title: 'Reforçar regularização de entregas',
        description: 'Orientar o aluno a priorizar atividades pendentes e próximos prazos.',
        reason: 'Pendências e/ou taxa de entrega abaixo do esperado.',
        priority: student.deliveryRate < this.config.lowDeliveryRateThreshold ? 'HIGH' : 'MEDIUM',
        targetProfile: 'STUDENT',
        targetId: student.studentId,
        metadata: { pendingActivities: student.pendingActivities },
      });
    }

    const criticalCompetency = competencies.find((c) => c.status === 'CRITICAL');
    if (criticalCompetency) {
      recommendations.push({
        id: uid('rec'),
        type: 'CONTENT_REVIEW',
        title: `Revisar competência crítica: ${criticalCompetency.competencyName}`,
        description: criticalCompetency.recommendedAction ?? 'Revisar conteúdo crítico.',
        reason: criticalCompetency.reason,
        priority: 'HIGH',
        targetProfile: 'STUDENT',
        targetId: student.studentId,
        metadata: { competencyId: criticalCompetency.competencyId },
      });
    }

    if (errors.total > 0) {
      recommendations.push({
        id: uid('rec'),
        type: 'PRACTICE_SET',
        title: 'Gerar prática baseada em padrão de erro',
        description: `Criar exercícios focados em erros do tipo ${translateErrorType(errors.dominantType)}.`,
        reason: 'O padrão de erro predominante pode orientar um reforço mais assertivo.',
        priority: errors.dominantType === 'CONCEPTUAL' ? 'HIGH' : 'MEDIUM',
        targetProfile: 'STUDENT',
        targetId: student.studentId,
        metadata: { dominantErrorType: errors.dominantType },
      });
    }

    if (student.averageGrade >= 80 && student.recentTrend > 0) {
      recommendations.push({
        id: uid('rec'),
        type: 'CHALLENGE_UP',
        title: 'Liberar desafios avançados',
        description: 'O aluno demonstra domínio suficiente para atividades mais desafiadoras.',
        reason: 'Desempenho elevado e tendência de melhoria.',
        priority: 'LOW',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { studentId: student.studentId },
      });
    }

    if (student.accessFrequencyLast14Days <= this.config.lowAccessThreshold) {
      recommendations.push({
        id: uid('rec'),
        type: 'INTERVENTION',
        title: 'Realizar contato de engajamento',
        description: 'Acompanhar o aluno por baixa frequência recente de acesso.',
        reason: 'Baixa frequência reduz a continuidade da aprendizagem.',
        priority: 'MEDIUM',
        targetProfile: 'TEACHER',
        targetId: teacher.teacherId,
        metadata: { studentId: student.studentId },
      });
    }

    return recommendations;
  }

  private aggregateCriticalCompetencies(decisions: PedagogicalDecision[]): string[] {
    const counter = new Map<string, number>();

    for (const decision of decisions) {
      for (const insight of decision.competencyInsights) {
        if (insight.status === 'CRITICAL') {
          counter.set(insight.competencyName, (counter.get(insight.competencyName) ?? 0) + 1);
        }
      }
    }

    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  private calculateClassHealth(
    averageGrade: number,
    averageDeliveryRate: number,
    highRiskCount: number,
    totalStudents: number,
  ): HealthStatus {
    const highRiskRate = totalStudents === 0 ? 0 : (highRiskCount / totalStudents) * 100;

    if (averageGrade < 55 || averageDeliveryRate < 60 || highRiskRate >= 30) {
      return 'CRITICAL';
    }

    if (averageGrade < 70 || averageDeliveryRate < 80 || highRiskRate >= 15) {
      return 'ATTENTION';
    }

    return 'HEALTHY';
  }
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function translateErrorType(type: ErrorType): string {
  const map: Record<ErrorType, string> = {
    CONCEPTUAL: 'conceitual',
    INTERPRETATION: 'de interpretação',
    DISTRACTION: 'de distração',
    EXECUTION: 'de execução',
    TIME_MANAGEMENT: 'de gestão do tempo',
    UNKNOWN: 'não classificado',
  };
  return map[type];
}
