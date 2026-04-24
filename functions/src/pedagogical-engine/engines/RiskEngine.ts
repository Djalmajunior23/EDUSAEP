import { StudentPerformance, RiskLevel } from '../types';

export class RiskEngine {
  calculateRisk(data: StudentPerformance): { riskScore: number, riskLevel: RiskLevel, justifications: string[] } {
    let riskScore = 0;
    const justifications: string[] = [];

    const avgScore = data.recentScores.length > 0 
      ? data.recentScores.reduce((a, b) => a + b, 0) / data.recentScores.length 
      : 100;
    
    if (avgScore < 60) {
      riskScore += 40;
      justifications.push(`Média de aprendizado em declínio persistente (${avgScore.toFixed(1)}%).`);
    }

    if (data.attendanceRate <= 75) {
      riskScore += 30;
      justifications.push(`Sinal amarelo: Risco real de evasão devido a baixa frequência interativa (${data.attendanceRate}%).`);
    }

    if (data.deliveryRate < 80) {
      riskScore += 30;
      justifications.push(`Taxa de conclusão de atividades preocupante (${data.deliveryRate}%).`);
    }

    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 70) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    return { riskScore, riskLevel, justifications };
  }
}
