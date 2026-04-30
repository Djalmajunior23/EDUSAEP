/**
 * Tipos base para o Motor Pedagógico
 */

export type BloomLevel = 'Lembrar' | 'Entender' | 'Aplicar' | 'Analisar' | 'Avaliar' | 'Criar';

export interface Competencia {
    id: string;
    nome: string;
    descricao: string;
}

export interface PedagogicalFeedback {
    pontosFortes: string[];
    pontosAtencao: string[];
    recomendacao: string;
}
