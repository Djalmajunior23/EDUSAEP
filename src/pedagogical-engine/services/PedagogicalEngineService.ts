import { PedagogicalEngine } from '../engines/PedagogicalEngine';
import { FirestoreRepository } from '../adapters/FirestoreRepository';
import { StudentMetrics } from '../types';

export class PedagogicalEngineService {
  /**
   * Processa a avaliação de um aluno individualmente e persiste.
   */
  public static async processStudentMetrics(studentId: string, metrics: StudentMetrics) {
    // Obter modelo avaliado
    const result = PedagogicalEngine.evaluateStudent(studentId, metrics);

    // Persistir
    await FirestoreRepository.saveStudentEvaluation(result);

    return result;
  }

  /**
   * Processa a avaliação de uma turma com base na agregação das métricas do aluno.
   */
  public static async processClassHealth(classId: string, studentsData: { id: string, metrics: StudentMetrics }[]) {
    const studentResults = [];
    
    for (const st of studentsData) {
      // Opcionalmente podemos avaliar e já persistir em batch aqui.
      const res = PedagogicalEngine.evaluateStudent(st.id, st.metrics);
      studentResults.push(res);
      // await FirestoreRepository.saveStudentEvaluation(res); // Em prod faria batch commit
    }

    const allMetrics = studentsData.map(s => s.metrics);

    const classResult = PedagogicalEngine.evaluateClass(classId, studentResults, allMetrics);

    // Persistir saúde da turma
    await FirestoreRepository.saveClassEvaluation(classResult);

    return classResult;
  }
}
