// src/types.ts

export interface Class {
  id: string;
  name: string;
  period: string;
  status: 'active' | 'inactive';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
}

export interface Discipline {
  // Main Competency
  id: string;
  code: string; // Ex: UC-001
  name: string; // The name of the discipline/main competency
  description?: string;
  area: string;
  status: 'active' | 'inactive';
  teacherId?: string;
}

export interface Skill {
  // Habilidade / Sub-competência
  id: string;
  disciplineId: string; // Linked to Discipline/Main Competency
  name: string;
  description?: string;
}

export interface AssessmentItem {
  id: string;
  skillId: string; // Linked to Skill
  type: 'simulado' | 'exercicio' | 'diagnostico';
  source: 'platform' | 'siac' | 'external';
  content: string;
}
