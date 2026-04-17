export type QuestionType = 'multiple_choice' | 'discursive' | 'code' | 'analytical';

export interface Asset {
  id: string;
  questionId: string;
  type: 'code' | 'image' | 'diagram' | 'table' | 'text';
  content: string;
  metadata?: any;
  order: number;
}

export interface Question {
  id?: string;
  text: string;
  type: QuestionType;
  difficulty: 'fácil' | 'médio' | 'difícil';
  bloomLevel?: string;
  competencyId: string;
  assets?: Asset[];
  options?: any[];
  correctAnswer?: string;
  explanation?: string;
  rubric?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: any;
}
