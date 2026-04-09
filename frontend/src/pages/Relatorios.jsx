import { useState } from 'react';
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react';
import { exportRelatorioZaju } from '../services/api';

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExportZaju = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate first and last day of the month
      const year = Number.parseInt(selectedMonth.split('-')[0]);
      const month = Number.parseInt(selectedMonth.split('-')[1]) - 1; // 0-based
      
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]; // last day of month

      const response = await exportRelatorioZaju(startDate, endDate);
      
      // Create a URL for the blob
      const url = globalThis.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from header if available, else use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `relatorio_zaju_${selectedMonth}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Falha ao gerar o relatório. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Relatórios</h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">Geração de relatórios avançados para fechamento</p>
      </div>
      
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ZAJU Report Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="bg-slate-900 p-6 flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-white uppercase tracking-widest text-sm">Relatório Mensal ZAJU</h3>
            </div>
            
            <div className="p-8 space-y-8">
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Extração de amostra (100 linhas) de Ajustes de Provisão, Memória de Cálculo e Sell-in para conferência mensal com o cliente.
              </p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" /> Período de Atividade
                  </label>
                  <div className="relative group">
                    <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                  {error}
                </div>
              )}
              
              <button 
                onClick={handleExportZaju}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-black uppercase tracking-[0.15em] text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download size={20} strokeWidth={3} />
                    Exportar XLSX
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PostgreSQL Optimized</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Status: Ready</span>
              </div>
            </div>
          </div>

          {/* Other Reports Placeholder */}
          <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center group hover:border-blue-200 transition-colors">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100 group-hover:text-blue-200 transition-colors">
               <FileText size={32} strokeWidth={1.5} />
             </div>
             <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest">Novos Relatórios</h3>
             <p className="text-[11px] font-medium text-slate-400 text-center mt-3 px-12 leading-loose uppercase tracking-tighter">
               Visões de Auditoria VK11 e Pagamentos em mapeamento.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
