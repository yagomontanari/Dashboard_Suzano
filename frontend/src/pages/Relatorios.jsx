import { useState } from 'react';
import { FileText, Download, Calendar, AlertCircle, Users } from 'lucide-react';
import { exportRelatorioZaju, exportRelatorioCgElegiveis } from '../services/api';

export default function Relatorios() {
  // State for ZAJU report
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for CGs Elegiveis report
  const [selectedCgMonth, setSelectedCgMonth] = useState(new Date().toISOString().slice(0, 7));
  const [successCg, setSuccessCg] = useState(null);
  const [loadingCg, setLoadingCg] = useState(false);
  const [errorCg, setErrorCg] = useState(null);

  const handleExportZaju = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const year = Number.parseInt(selectedMonth.split('-')[0]);
      const month = Number.parseInt(selectedMonth.split('-')[1]) - 1;
      
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const data = await exportRelatorioZaju(startDate, endDate);
      
      // Como agora o export é assíncrono, mostramos a mensagem de sucesso
      if (data.status === 'success') {
        setSuccess(data.message);
      }
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Falha ao solicitar o relatório. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCgElegiveis = async () => {
    setLoadingCg(true);
    setErrorCg(null);
    setSuccessCg(null);
    try {
      const year = Number.parseInt(selectedCgMonth.split('-')[0]);
      const month = Number.parseInt(selectedCgMonth.split('-')[1]) - 1;
      
      const startObj = new Date(year, month - 3, 1);
      const endObj = new Date(year, month, 0);
      
      const startDate = `${startObj.getFullYear()}-${String(startObj.getMonth()+1).padStart(2,'0')}-01`;
      const endDate = `${endObj.getFullYear()}-${String(endObj.getMonth()+1).padStart(2,'0')}-${String(endObj.getDate()).padStart(2,'0')}`;

      const data = await exportRelatorioCgElegiveis(startDate, endDate);
      
      if (data.status === 'success') {
        setSuccessCg(data.message);
      }
    } catch (err) {
      console.error('Erro ao exportar relatório CG Elegíveis:', err);
      setErrorCg('Falha ao solicitar o relatório. Verifique sua conexão e tente novamente.');
    } finally {
      setLoadingCg(false);
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
                Extração detalhada de Ajustes de Provisão, Memória de Cálculo e Sell-in para conferência mensal, processada em segundo plano e enviada por e-mail.
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

              {success && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-blue-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                    <Download size={14} strokeWidth={3} />
                  </div>
                  {success}
                </div>
              )}

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

          {/* CGs Elegiveis Report Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="bg-slate-900 p-6 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                <Users size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-white uppercase tracking-widest text-sm">CGs Elegíveis Verba Fixa</h3>
            </div>
            
            <div className="p-8 space-y-8">
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Extração de Customer Groups com histórico de faturamento na janela retroativa de 3 meses. Útil para identificar quais CGs estão aptos para alocação de verbas.
              </p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-500" /> Mês de Avaliação (Busca D-3)
                  </label>
                  <div className="relative group">
                    <input 
                      type="month" 
                      value={selectedCgMonth}
                      onChange={(e) => setSelectedCgMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {successCg && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-emerald-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                    <Download size={14} strokeWidth={3} />
                  </div>
                  {successCg}
                </div>
              )}

              {errorCg && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                  {errorCg}
                </div>
              )}
              
              <button 
                onClick={handleExportCgElegiveis}
                disabled={loadingCg}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white font-black uppercase tracking-[0.15em] text-sm rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loadingCg ? (
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
        </div>
      </div>
    </div>
  );
}
