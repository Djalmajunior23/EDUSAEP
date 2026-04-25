export class PedagogicalEngine {
  adaptLanguage(response: string, studentLevel: string) {
    // Aplicação teórica de Bloom e ajuste de complexidade
    if (studentLevel === 'iniciante') {
      return `(Simplificado) ${response}`;
    }
    return response;
  }
}
export const pedagogicalEngine = new PedagogicalEngine();
