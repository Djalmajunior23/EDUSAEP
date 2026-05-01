import { logger } from './logger';

/**
 * Parser simples baseado em regex para extrair questões de texto quando a IA falha.
 * Tenta identificar blocos que parecem questões (Enunciado + Alternativas).
 */
export function simpleRegexParser(text: string): any[] {
  logger.debug('PARSER', "Iniciando extração manual (fallback)");
  const questions: any[] = [];
  
  // Divide por itens ou quebras duplas
  const sections = text.split(/---|\n\s*\d+[:.]/);
  
  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (trimmed.length < 10) return;
    
    // Tenta achar alternativas (A, B, C, D)
    const lines = trimmed.split('\n');
    const enunciadoLines: string[] = [];
    const alternativas: any[] = [];
    let gabarito = '';
    
    lines.forEach(line => {
      const altMatch = line.match(/^\s*([A-E])[\s.:\)-]+(.*)/i);
      if (altMatch) {
        alternativas.push({
          id: altMatch[1].toUpperCase(),
          texto: altMatch[2].trim()
        });
      } else if (line.toLowerCase().includes('gabarito:') || line.toLowerCase().includes('resposta:')) {
        const gMatch = line.match(/(?:gabarito|resposta):\s*([A-E])/i);
        if (gMatch) gabarito = gMatch[1].toUpperCase();
      } else {
        enunciadoLines.push(line);
      }
    });

    if (enunciadoLines.length > 0) {
      questions.push({
        questionUid: `MANUAL-${Date.now()}-${index}`,
        enunciado: enunciadoLines.join('\n').trim(),
        alternativas: alternativas.length > 0 ? alternativas : [
          { id: 'A', texto: 'Alternativa A' },
          { id: 'B', texto: 'Alternativa B' },
          { id: 'C', texto: 'Alternativa C' },
          { id: 'D', texto: 'Alternativa D' },
          { id: 'E', texto: 'Alternativa E' },
        ],
        respostaCorreta: gabarito || (alternativas.length > 0 ? alternativas[0].id : 'A'),
        dificuldade: 'médio',
        bloom: 'compreender',
        competenciaNome: 'Pendente revisão',
        temaNome: 'Importação Manual',
        origem: 'importacao_manual',
        status: 'rascunho',
        tags: ['importado', 'sem_ia'],
        revisadaPorProfessor: false,
        criadoEm: new Date().toISOString()
      });
    }
  });

  return questions;
}
