import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

export interface StudentGroup {
  id?: string;
  classId: string;
  name: string; // e.g., 'Dificuldade Conceitual', 'Avançados'
  category: 'conceptual' | 'engagement' | 'performance' | 'advanced';
  studentIds: string[];
  suggestedIntervention: string;
  createdAt: any;
}

export class GroupingService {
  /**
   * Automatically groups students based on performance data. (Module 3)
   */
  static async groupStudents(classId: string) {
    // 1. Fetch all students and their last submissions
    const studentSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno'), where('turmaId', '==', classId)));
    const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const submissionSnap = await getDocs(query(collection(db, 'exam_submissions'), where('turmaId', '==', classId)));
    const submissions = submissionSnap.docs.map(d => d.data());

    const groups: Record<string, string[]> = {
      'Excelência': [],
      'Atenção Médio': [],
      'Crítico - Reforço Imediato': [],
      'Baixo Engajamento': []
    };

    students.forEach((student: any) => {
      const studentSubs = submissions.filter(s => s.studentId === student.id);
      
      if (studentSubs.length === 0) {
        groups['Baixo Engajamento'].push(student.id);
        return;
      }

      const avg = studentSubs.reduce((acc, curr) => acc + (curr.score / curr.maxScore), 0) / studentSubs.length;

      if (avg >= 0.85) groups['Excelência'].push(student.id);
      else if (avg >= 0.6) groups['Atenção Médio'].push(student.id);
      else groups['Crítico - Reforço Imediato'].push(student.id);
    });

    // Save groups to DB
    const results = [];
    for (const [name, ids] of Object.entries(groups)) {
      if (ids.length > 0) {
        const groupRef = await addDoc(collection(db, 'student_groups'), {
          classId,
          name,
          category: name.includes('Crítico') ? 'performance' : name.includes('Excelência') ? 'advanced' : 'engagement',
          studentIds: ids,
          suggestedIntervention: this.getIntervention(name),
          createdAt: serverTimestamp()
        });
        results.push({ id: groupRef.id, name, count: ids.length });
      }
    }

    return results;
  }

  private static getIntervention(groupName: string): string {
    switch (groupName) {
      case 'Excelência': return 'Atribuir projetos de monitoria ou desafios de nível complexo (SAEP Difícil).';
      case 'Atenção Médio': return 'Reforço dirigido em competências de nível secundário.';
      case 'Crítico - Reforço Imediato': return 'Intervenção imediata: retomar conceitos básicos da Competência 1 e 2.';
      case 'Baixo Engajamento': return 'Ação tutorial: verificar motivos de falta de acesso e incentivar participação.';
      default: return 'Revisão periódica.';
    }
  }
}
