export interface PerformancePrediction {
    studentId: string;
    riskOfFailure: number; // 0-1
    riskOfDropout: number; // 0-1
    projectedEvolutionTrend: 'declining' | 'stable' | 'improving';
}
