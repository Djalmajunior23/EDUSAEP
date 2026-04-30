/**
 * Normaliza erros de importação e IA para mensagens amigáveis ao usuário.
 */
export function normalizeImportError(error: unknown): string {
  const message = String(
    error instanceof Error ? error.message : error
  );
  
  if (message.includes("5 NOT_FOUND") || message.includes("NOT_FOUND")) {
    return "Modelo ou recurso de IA não encontrado. O sistema tentará usar um modelo de backup ou processamento manual.";
  }
  
  if (message.toLowerCase().includes("api key") || message.includes("API_KEY")) {
    return "Chave da API de IA ausente ou inválida. Verifique as configurações do servidor.";
  }
  
  if (message.toLowerCase().includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    return "Limite de uso da IA atingido (Quota). Tente novamente mais tarde ou use outro provedor.";
  }
  
  if (message.toLowerCase().includes("permission") || message.includes("PERMISSION_DENIED")) {
    return "Permissão insuficiente para acessar o serviço de IA ou o banco de dados.";
  }
  
  if (message.toLowerCase().includes("firestore") || message.includes("PERMISSION_DENIED")) {
    return "Erro ao salvar dados no Firestore. Verifique suas permissões de acesso.";
  }
  
  if (message.toLowerCase().includes("network") || message.includes("fetch")) {
    return "Erro de conexão com o serviço externo. Verifique sua internet ou o status da API.";
  }
  
  if (message.includes("SAFETY")) {
    return "Conteúdo bloqueado pelos filtros de segurança da IA.";
  }

  return `Erro inesperado: ${message}`;
}
