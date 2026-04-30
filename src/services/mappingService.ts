// src/services/mappingService.ts
import { Discipline } from '../types';
import { EduJarvis } from './eduJarvisService';

export async function mapExternalDiscipline(
  externalName: string,
  availableDisciplines: Discipline[]
): Promise<{ disciplineId: string | null; confidence: number; reason: string }> {
  
  const res = await EduJarvis.execute(`Mapeie a disciplina externa "${externalName}" para as disponíveis.`, {
    context: { externalName, availableDisciplines }
  });

  if (res.data) return res.data;
  
  try {
    return JSON.parse(res.response);
  } catch (e) {
    return { disciplineId: null, confidence: 0, reason: "Erro ao parsear resposta do EduJarvis" };
  }
}

export async function mapExistingCompetencies(
  questions: any[],
  availableDisciplines: Discipline[]
): Promise<any[]> {
  if (!questions || questions.length === 0) return [];

  const res = await EduJarvis.execute(`Mapeie competências para estas ${questions.length} questões.`, {
    context: { questions, availableDisciplines }
  });

  if (Array.isArray(res.data)) return res.data;
  
  try {
    return JSON.parse(res.response);
  } catch (e) {
    return questions;
  }
}
