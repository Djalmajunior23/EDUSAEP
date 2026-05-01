import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(this.props.moduleName || 'UI_COMPONENT', 'Uncaught component error', { error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-8 border-2 border-dashed border-red-200 rounded-2xl bg-red-50 text-center flex flex-col items-center gap-4 my-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Algo deu errado neste componente</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Ocorreu um erro inesperado. Isso foi reportado à nossa equipe técnica.
            </p>
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={16} />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
