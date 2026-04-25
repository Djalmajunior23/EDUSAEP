
export class ContextEngine {
  async getStudentContext(userId: string) {
    // Busca perfil, disciplina, dificuldade
    return { level: 'intermediario', goals: ['saep'] };
  }
}
export const contextEngine = new ContextEngine();
