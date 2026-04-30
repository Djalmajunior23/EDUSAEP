import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showTechnical: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showTechnical: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showTechnical: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.componentName || 'Unknown Component'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopyError = () => {
    const technicalData = `
Component: ${this.props.componentName || 'Unknown'}
Error: ${this.state.error?.toString()}
Stack: ${this.state.errorInfo?.componentStack}
    `;
    navigator.clipboard.writeText(technicalData);
    toast.success("Erro técnico copiado para a área de transferência!");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50/50 p-6 rounded-3xl border border-gray-100 m-4">
          <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto transform -rotate-6">
              <AlertCircle size={40} />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                Oops! O componente {this.props.componentName ? `"${this.props.componentName}"` : ''} travou.
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Não foi possível carregar esta tela. Alguns dados podem estar incompletos ou em formato inesperado.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> Recarregar Página
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} /> Voltar ao Painel
              </button>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <button 
                onClick={() => this.setState({ showTechnical: !this.state.showTechnical })}
                className="text-xs font-black uppercase text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto transition-colors"
              >
                Detalhes Técnicos {this.state.showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {this.state.showTechnical && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-gray-900 rounded-2xl text-left overflow-auto max-h-48 scrollbar-hide">
                    <code className="text-[10px] text-emerald-400 font-mono leading-relaxed">
                      {this.state.error?.toString()}
                      {this.state.errorInfo?.componentStack}
                    </code>
                  </div>
                  <button 
                    onClick={this.handleCopyError}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 mx-auto bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Copy size={12} /> Copiar Erro Técnico
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
