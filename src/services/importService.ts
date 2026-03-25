// src/services/importService.ts
import { AssessmentItem } from '../types';

export interface StagedData {
  id: string;
  rawName: string; // Raw discipline/competency name from external file
  mappedDisciplineId?: string; // ID of the mapped Discipline (Main Competency)
  status: 'pending' | 'mapped' | 'error';
  data: any; // The full row data
}

export async function stageImportedData(rawData: any[]): Promise<StagedData[]> {
  // Logic to parse raw data (Excel/CSV) and create staged entries
  return rawData.map((row, index) => ({
    id: `staged_${index}`,
    rawName: row.disciplina || row.competencia || 'Unknown',
    status: 'pending',
    data: row
  }));
}
