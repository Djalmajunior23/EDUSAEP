export interface TutorMessage {
    studentId: string;
    message: string;
    role: 'student' | 'assistant';
    createdAt: Date;
}
