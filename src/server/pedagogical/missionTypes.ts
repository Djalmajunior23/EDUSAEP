export interface Mission {
    id: string;
    studentId: string;
    description: string;
    objective: string;
    reward: number;
    type: 'diaria' | 'competencia' | 'recuperacao';
    status: 'ativa' | 'concluida';
}
