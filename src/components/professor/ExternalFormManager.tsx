import React from 'react';

export const ExternalFormManager = ({ simuladoId, user, webhookUrl }: any) => {
  return (
    <div className="p-4 border rounded-xl bg-gray-50">
      <h3 className="font-bold">Gerenciador de Formulário (Simulado: {simuladoId})</h3>
      <p className="text-sm text-gray-500">Módulo em reconstrução para integrar Google Forms e N8N.</p>
    </div>
  );
};
