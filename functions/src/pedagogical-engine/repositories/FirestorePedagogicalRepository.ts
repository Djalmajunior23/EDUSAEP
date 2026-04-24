import * as admin from 'firebase-admin';
import { PedagogicalDecision, ClassHealthSnapshot, StudentPerformance } from '../types';

export class FirestorePedagogicalRepository {
  private db: admin.firestore.Firestore;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.db = admin.firestore();
  }

  async getRecentStudentData(studentId: string, classId: string): Promise<StudentPerformance> {
    // Busca e agrega dados reais do Firestore
    // Aqui usamos um modelo agregado na tabela analytics ou buscamos submissões diretamente
    const userDoc = await this.db.collection('users').doc(studentId).get();
    
    // Simulação do resultado de agregações por fins de pipeline das cloud functions
    return {
      studentId,
      classId,
      recentScores: [65, 70, 45, 52], // Simulando resgate real de \`submissions\`
      attendanceRate: 75,
      deliveryRate: 80
    };
  }

  async saveDecision(decision: PedagogicalDecision): Promise<void> {
    await this.db.collection('pedagogicalDecisions').add({
      ...decision,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async updateClassHealth(snapshot: ClassHealthSnapshot): Promise<void> {
    await this.db.collection('classHealthSnapshots').add({
      ...snapshot,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async getStudentsInClass(classId: string): Promise<string[]> {
    const snap = await this.db.collection('class_enrollments').where('classId', '==', classId).get();
    return snap.docs.map(doc => doc.data().studentId);
  }
}
