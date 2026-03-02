import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Key } from 'lucide-react';

/**
 * PinComponent - Exemplo de implementação robusta com tratamento de erros.
 * Resolve os problemas de "Failed to fetch" e "Empty token" demonstrados no console.
 */
export default function PinComponent() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulação de uma chamada de API
      // Em um cenário real, use try/catch para capturar erros de rede (Failed to fetch)
      const response = await fetch('/api/token-mock'); 
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validação de Lógica de Negócio: Evita o erro "Empty token!"
      if (!data.token) {
        throw new Error("Token vazio recebido do servidor (Empty token!)");
      }

      setToken(data.token);
    } catch (err: any) {
      // Tratamento centralizado de erros de rede e lógica
      console.error("[PinComponent] Erro capturado:", err.message);
      setError(err.message || "Erro desconhecido ao buscar token.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchToken(); // Desativado por padrão para não gerar erros reais no log sem backend
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-emerald-600">
        <Key size={20} />
        <h3 className="font-bold">Gerenciador de PIN (Exemplo)</h3>
      </div>

      <p className="text-xs text-gray-500">
        Este componente demonstra como tratar erros de <b>fetch</b> e validar <b>tokens vazios</b> para evitar os erros vistos no console.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
          <RefreshCw size={16} className="animate-spin" />
          Buscando credenciais...
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p><b>Erro:</b> {error}</p>
        </div>
      ) : token ? (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2 text-emerald-700 text-xs">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <p>Token ativo: <span className="font-mono">{token.substring(0, 8)}...</span></p>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 italic">
          Nenhum token carregado.
        </div>
      )}

      <button
        onClick={fetchToken}
        disabled={loading}
        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        Tentar Buscar Token
      </button>
    </div>
  );
}
