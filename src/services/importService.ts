// src/services/importService.ts
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

export const importService = {
  async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("File is not provided."));
      if (!file.name || typeof file.name !== 'string') return reject(new Error("Invalid file."));

      const parts = file.name.split('.');
      const fileExt = parts.pop()?.toLowerCase();

      if (fileExt === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      } else if (['xlsx', 'xls'].includes(fileExt || '')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
      } else {
        reject(new Error('Formato de arquivo não suportado. Use CSV ou Excel.'));
      }
    });
  },

  async processStudentImport(data: any[], createdBy: string, onProgress?: (current: number, total: number) => void) {
    const batchRef = await addDoc(collection(db, 'import_batches'), {
      type: 'students',
      status: 'processing',
      totalRows: data.length,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      createdBy,
      createdAt: serverTimestamp()
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.email || !row.nome) {
          throw new Error('Email e nome são obrigatórios');
        }
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ row: i + 1, message: error.message });
      }
      
      if (onProgress) {
        onProgress(i + 1, data.length);
      }
      // Small artificial delay to show progress visually if it's very fast
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
    }

    return { batchId: batchRef.id, successCount, errorCount, errors };
  },

  async processExerciseImport(data: any[], createdBy: string, onProgress?: (current: number, total: number) => void) {
    const batchRef = await addDoc(collection(db, 'import_batches'), {
      type: 'exercises',
      status: 'processing',
      totalRows: data.length,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      createdBy,
      createdAt: serverTimestamp()
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.enunciado || !row.respostaCorreta) {
          throw new Error('Enunciado e resposta correta são obrigatórios');
        }
        
        // Save to questions collection
        await addDoc(collection(db, 'questions'), {
          enunciado: row.enunciado,
          alternativas: row.alternativas || [],
          respostaCorreta: row.respostaCorreta,
          dificuldade: row.dificuldade || 'médio',
          competencia: row.competencia || '',
          disciplinaId: row.disciplinaId || null,
          tipo: row.tipo || 'multipla_escolha',
          createdBy,
          createdAt: serverTimestamp(),
          importBatchId: batchRef.id
        });
        
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({ row: i + 1, message: error.message });
      }

      if (onProgress) {
        onProgress(i + 1, data.length);
      }
    }

    return { batchId: batchRef.id, successCount, errorCount, errors };
  }
};
