import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-200/20 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-100/50">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ops! Algo deu errado na visualização</h2>
          <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto">
            Houve uma falha inesperada ao processar os dados deste componente. Nossa equipe técnica já foi notificada.
          </p>
          <button 
            onClick={this.handleReset}
            className="mt-8 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
          >
            <RefreshCw size={14} /> Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
