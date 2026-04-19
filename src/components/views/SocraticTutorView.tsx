import React from 'react';
import { SocraticTutor } from '../student/SocraticTutor';
import { UserProfile } from '../../types';

interface SocraticTutorViewProps {
  userProfile: UserProfile | null;
  selectedModel: string;
}

export function SocraticTutorView({ userProfile, selectedModel }: SocraticTutorViewProps) {
  return (
    <div className="py-8">
      <SocraticTutor 
        selectedModel={selectedModel} 
        userRole={userProfile?.role as any || 'aluno'} 
      />
    </div>
  );
}
