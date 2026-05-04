import { useState } from 'react';
import { FileText, Download, Calendar, AlertCircle, Users, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportRelatorioZaju, exportRelatorioCgElegiveis, exportRelatorioSaldos } from '../services/api';

const MonthFilter = ({ value, onChange, iconColor = "text-blue-500", activeColor = "bg-blue-600", label = "Competência" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parseInt(value.split('-')[0]));
  
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const fullMonths = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const currentMonthIdx = parseInt(value.split('-')[1]) - 1;
  const currentYear = parseInt(value.split('-')[0]);

  const handleSelect = (monthIdx) => {
    const year = viewYear;
    const month = monthIdx + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    onChange(monthStr);
    setIsOpen(false);
  };

  const handleSetCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    setViewYear(year);
    onChange(monthStr);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full">
      <div className="flex items-center gap-2 pl-3 pr-2 border-r border-slate-100 shrink-0">
        <Calendar size={16} className={iconColor} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
      </div>
      
      <div className="relative flex-1">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 group min-w-[140px]"
        >
          <span className="text-sm font-bold text-slate-700 capitalize">
            {fullMonths[currentMonthIdx]} <span className="text-slate-400 font-bold ml-1">{currentYear}</span>
          </span>
          <ChevronRight size={14} className={`ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full mt-3 right-0 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl z-30 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="flex items-center justify-between mb-6 px-1">
                <button onClick={() => setViewYear(v => v - 1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-base font-black text-slate-800 tracking-tight">{viewYear}</span>
                <button onClick={() => setViewYear(v => v + 1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {months.map((m, idx) => {
                  const isSelected = currentMonthIdx === idx && currentYear === viewYear;
                  return (
                    <button
                      key={m}
                      onClick={() => handleSelect(idx)}
                      className={`py-3 rounded-2xl text-xs font-black transition-all ${
                        isSelected 
                          ? `${activeColor} text-white shadow-lg scale-105` 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
                  Fechar
                </button>
                <button 
                  onClick={handleSetCurrentMonth}
                  className={`px-4 py-2 ${activeColor.replace('bg-', 'text-').replace('600', '700')} bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all`}
                >
                  Mês Atual
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const YearFilter = ({ value, onChange, iconColor = "text-blue-500", activeColor = "bg-blue-600", label = "Anos" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableYears = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());
  
  const handleToggle = (year) => {
    // value is an array like ['2024', '2025']
    let newValue;
    if (value.includes(year)) {
      newValue = value.filter(v => v !== year);
    } else {
      if (value.length >= 2) {
        newValue = [value[1], year].sort();
      } else {
        newValue = [...value, year].sort();
      }
    }
    onChange(newValue);
  };

  return (
    <div className="relative flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full">
      <div className="flex items-center gap-2 pl-3 pr-2 border-r border-slate-100 shrink-0">
        <Calendar size={16} className={iconColor} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
      </div>
      
      <div className="relative flex-1">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 group min-w-[140px]"
        >
          <span className="text-sm font-bold text-slate-700">
            {value.length > 0 ? value.join(' - ') : 'Selecionar Período'}
          </span>
          <ChevronRight size={14} className={`ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full mt-3 right-0 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-30 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="space-y-2">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleToggle(year)}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-between ${
                      value.includes(year)
                        ? `${activeColor} text-white shadow-lg` 
                        : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {year}
                    {value.includes(year) && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">
                  Fechar
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase">Máx: 2 anos</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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

  // State for Saldos report
  const [saldosMode, setSaldosMode] = useState('mensal'); // 'mensal' ou 'anual'
  const [saldosStartMonth, setSaldosStartMonth] = useState(new Date().toISOString().slice(0, 7));
  const [saldosEndMonth, setSaldosEndMonth] = useState(new Date().toISOString().slice(0, 7));
  const [saldosYears, setSaldosYears] = useState([new Date().getFullYear().toString()]);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [errorSaldos, setErrorSaldos] = useState(null);
  const [successSaldos, setSuccessSaldos] = useState(null);

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

      const filterMonthStr = `${year}-${String(month+1).padStart(2,'0')}`;
      const data = await exportRelatorioCgElegiveis(startDate, endDate, filterMonthStr);
      
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

  const handleExportSaldos = async () => {
    setLoadingSaldos(true);
    setErrorSaldos(null);
    setSuccessSaldos(null);
    try {
      let startDate, endDate;
      let filename_suffix;
      
      if (saldosMode === 'mensal') {
        const [startYear, startMonth] = saldosStartMonth.split('-').map(Number);
        const [endYear, endMonth] = saldosEndMonth.split('-').map(Number);
        
        const d1 = new Date(startYear, startMonth - 1, 1);
        const d2 = new Date(endYear, endMonth - 1, 1);
        
        if (d2 < d1) {
          throw new Error('O mês final não pode ser anterior ao inicial.');
        }
        
        const monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (monthDiff >= 12) {
          throw new Error('O limite máximo de exportação mensal é de 1 ano.');
        }

        startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
        endDate = new Date(endYear, endMonth, 0).toISOString().split('T')[0];
        filename_suffix = `mensal_${saldosStartMonth}_a_${saldosEndMonth}`;
      } else {
        if (saldosYears.length === 0) {
          throw new Error('Selecione ao menos um ano para exportar.');
        }
        
        const startY = saldosYears[0];
        const endY = saldosYears[saldosYears.length - 1];

        startDate = `${startY}-01-01`;
        endDate = `${endY}-12-31`;
        filename_suffix = `anual_${saldosYears.join('_')}`;
      }

      const blob = await exportRelatorioSaldos(startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Saldos_Disponiveis_${filename_suffix}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessSaldos('Relatório gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar saldos:', err);
      setErrorSaldos(err.message || 'Falha ao gerar o relatório. Verifique sua conexão.');
    } finally {
      setLoadingSaldos(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Relatórios</h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">Geração de relatórios avançados de performance</p>
      </div>
      
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ZAJU Report Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="bg-slate-900 p-6 flex items-center gap-4 rounded-t-2xl">
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
                <MonthFilter 
                  value={selectedMonth} 
                  onChange={setSelectedMonth} 
                  label="Competência"
                  iconColor="text-blue-500"
                  activeColor="bg-blue-600"
                />
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
            <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center group rounded-b-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PostgreSQL Optimized</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Status: Ready</span>
              </div>
            </div>
          </div>

          {/* CGs Elegiveis Report Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 duration-300">
            <div className="bg-slate-900 p-6 flex items-center gap-4 rounded-t-2xl">
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
                <MonthFilter 
                  value={selectedCgMonth} 
                  onChange={setSelectedCgMonth} 
                  label="Avaliação"
                  iconColor="text-emerald-500"
                  activeColor="bg-emerald-600"
                />
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
            <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center group rounded-b-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PostgreSQL Optimized</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Status: Ready</span>
              </div>
            </div>
          </div>

          {/* New Saldos Disponíveis Report Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 duration-300 md:col-span-2">
            <div className="bg-slate-900 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-600/20">
                  <Calculator size={22} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Relatório de Saldos Disponíveis</h3>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setSaldosMode('mensal')}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${saldosMode === 'mensal' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setSaldosMode('anual')}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${saldosMode === 'anual' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Anual
                </button>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Visão consolidada de conta corrente por Customer Group, Linha de Investimento e Tipo de Verba. Exibe saldos planejados, reservados e consumidos.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="px-3 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Financeiro</div>
                  <div className="px-3 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Conta Corrente</div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  {saldosMode === 'mensal' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MonthFilter 
                        value={saldosStartMonth} 
                        onChange={setSaldosStartMonth} 
                        label="Início"
                        iconColor="text-orange-500"
                        activeColor="bg-orange-600"
                      />
                      <MonthFilter 
                        value={saldosEndMonth} 
                        onChange={setSaldosEndMonth} 
                        label="Fim"
                        iconColor="text-orange-500"
                        activeColor="bg-orange-600"
                      />
                    </div>
                  ) : (
                    <YearFilter 
                      value={saldosYears} 
                      onChange={setSaldosYears} 
                      label="Exercício"
                      iconColor="text-orange-500"
                      activeColor="bg-orange-600"
                    />
                  )}
                </div>

                {successSaldos && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3 text-orange-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                    <div className="p-1.5 bg-orange-600 rounded-lg text-white">
                      <Download size={14} strokeWidth={3} />
                    </div>
                    {successSaldos}
                  </div>
                )}

                {errorSaldos && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={18} className="shrink-0 text-red-500" />
                    {errorSaldos}
                  </div>
                )}
                
                <button 
                  onClick={handleExportSaldos}
                  disabled={loadingSaldos}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-600 text-white font-black uppercase tracking-[0.15em] text-sm rounded-xl shadow-lg shadow-orange-600/30 hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loadingSaldos ? (
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
            </div>
            <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center group rounded-b-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldos Disponíveis Analítico</span>
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
