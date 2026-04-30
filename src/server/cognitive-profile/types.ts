export interface StudentCognitiveProfile {
    studentId: string;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
    abstractionLevel: 'concrete' | 'abstract';
    speed: 'slow' | 'fast';
    errorPattern: string[];
}
