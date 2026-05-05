import { notificationService } from './notificationService';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { logger } from '../utils/logger';

export const pedagogicalAlertsService = {
  /**
   * Dispara notificação de meta de aprendizado concluída para o aluno e notifica o professor.
   */
  async notifyMilestoneAchieved(studentId: string, studentName: string, professorId: string, milestoneName: string) {
    // Para o aluno
    await notificationService.createNotification({
      userId: studentId,
      title: '🌟 Marco de Aprendizado!',
      message: `Parabéns, ${studentName}! Você concluiu a competência: ${milestoneName}. Continue com esse excelente progresso!`,
      type: 'milestone_achieved',
      link: '/student-dashboard',
      metadata: { milestoneName, studentId }
    });

    // Para o professor
    if (professorId) {
      await notificationService.createNotification({
        userId: professorId,
        title: '🌟 Nova Competência Alcançada',
        message: `O aluno ${studentName} dominou a competência: ${milestoneName}.`,
        type: 'milestone_achieved',
        link: `/student360/${studentId}`,
        metadata: { studentId, studentName, milestoneName }
      });
    }
  },

  /**
   * Dispara alerta de queda de desempenho em uma competência ou tema.
   */
  async notifyPerformanceDrop(studentId: string, studentName: string, professorId: string, subjectName: string, dropPercentage: number) {
    // Alerta construtivo para o aluno
    await notificationService.createNotification({
      userId: studentId,
      title: '📉 Atenção ao seu Progresso',
      message: `Notamos que seu desempenho em ${subjectName} caiu recentemente. Que tal revisar alguns conceitos? O Assistente de IA pode te ajudar.`,
      type: 'performance_alert',
      link: '/socratic-tutor',
      metadata: { subjectName, dropPercentage, studentId }
    });

    // Alerta de intervenção para o professor
    if (professorId) {
      await notificationService.createNotification({
        userId: professorId,
        title: '⚠️ Queda de Desempenho Detectada',
        message: `O aluno ${studentName} apresentou uma queda de ${dropPercentage}% no rendimento de ${subjectName}. Pode ser o momento para uma intervenção cirúrgica.`,
        type: 'performance_alert',
        link: `/student360/${studentId}`,
        metadata: { studentId, studentName, subjectName, dropPercentage }
      });
    }
  },

  /**
   * Dispara alerta de engajamento quando há sequência de atividades sem entrega.
   */
  async notifyMissingActivities(studentId: string, studentName: string, professorId: string, missingCount: number) {
    // Para o aluno
    await notificationService.createNotification({
      userId: studentId,
      title: '🗓️ Atividades Pendentes Acumuladas',
      message: `Você possui ${missingCount} atividades seguidas não entregues. Se estiver encontrando dificuldades, procure seu professor ou o Copiloto de IA para ajustar seu plano de estudos.`,
      type: 'engagement_alert',
      link: '/student-tasks',
      metadata: { missingCount, studentId }
    });

    // Para o professor
    if (professorId) {
      await notificationService.createNotification({
        userId: professorId,
        title: '🚨 Alerta Crítico de Engajamento',
        message: `O aluno ${studentName} acumula ${missingCount} atividades consecutivas atrasadas. Risco elevado de evasão ou falso aprendizado.`,
        type: 'engagement_alert',
        link: `/student360/${studentId}`,
        metadata: { studentId, studentName, missingCount }
      });
    }
  },

  /**
   * Verifica o histórico recente do aluno para possivelmente disparar alertas.
   * Isso pode ser chamado após a emissão de um diagnóstico BI ou periodicamente.
   */
  async checkStudentMetricsAndAlert(studentId: string, studentName: string, professorId: string) {
    try {
      // Exemplo fictício de checagem do banco de dados (poderia consultar entregas pendentes ou histórico de avaliações)
      // Aqui integrariamos a lógica com os submits reais (submissions ou diagnostics).
      
      logger.info('Alerts', `Checking metrics for student ${studentName} (${studentId}) to trigger pedagogical alerts...`);
      // Simulação: se este aluno tiver 3 tarefas atrasadas, dispare.
      // E assim por diante.
    } catch (error) {
      logger.error('Alerts', 'Error checking student metrics for pedagogical alerts:', error);
    }
  }
};
