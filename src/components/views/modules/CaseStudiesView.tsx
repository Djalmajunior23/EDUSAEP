import React from 'react';
import { FileText, Users, Lightbulb } from 'lucide-react';

export const CaseStudiesView = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Estudos de Caso (Integração IA)</h1>
      <p className="text-gray-600 mb-6">Resolução de problemas complexos, rubricas e feedback automatizado.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="text-amber-600" />
            <h3 className="font-bold">Cenários Gerados via IA</h3>
          </div>
          <p className="text-sm text-gray-500">Crie estudos de caso baseados em competências específicas usando o Gemini.</p>
        </div>
      </div>
    </div>
  );
};
