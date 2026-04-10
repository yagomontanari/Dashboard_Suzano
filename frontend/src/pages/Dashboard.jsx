import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData, getInconsistenciasData } from '../services/api';
import { 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Filter,
  Trophy,
  Users,
  Activity,
  Target
} from 'lucide-react';
import Modal from '../components/Modal';
import PaginatedTable from '../components/PaginatedTable';
import DashboardSkeleton from '../components/DashboardSkeleton';
import * as XLSX from 'xlsx';
import { useMemo } from 'react';

const IntegrationHealthCard = ({ title, success, pending, error }) => {
  const total = success + pending + error;
  
  const StatBar = ({ label, value, colorClass }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-slate-700">{value}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000`} 
          style={{ width: value > 0 ? Math.max((value / total) * 100, 2) + '%' : '0%' }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Total: {total}</span>
      </div>
      <div className="space-y-1">
        <StatBar label="Sucesso" value={success} colorClass="bg-blue-500" />
        <StatBar label="Pendente" value={pending} colorClass="bg-amber-500" />
        <StatBar label="Com Erro" value={error} colorClass="bg-rose-500" />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // In inconsistency Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInconsistency, setSelectedInconsistency] = useState(null);
  const [inconsistencyData, setInconsistencyData] = useState([]);
  const [inconsistencyLoading, setInconsistencyLoading] = useState(false);
  const [inconsistencyError, setInconsistencyError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState(null);

  const [activeTab, setActiveTab] = useState('geral');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // In production, token validation happens here
      if (!localStorage.getItem('token')) {
        navigate('/');
        return;
      }
      const result = await getDashboardData();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const fetchInconsistencyDetails = async (category, page = 1, sort = sortConfig) => {
    setInconsistencyLoading(true);
    setInconsistencyError(null);
    try {
      const result = await getInconsistenciasData(category, page, 20, sort?.key, sort?.direction);
      setInconsistencyData(result.data || []);
      setCurrentPage(result.page);
      setTotalPages(result.total_pages);
      setTotalCount(result.total_count);
    } catch (err) {
      console.error("Erro ao buscar dados", err);
      setInconsistencyError(err.message || 'Erro de rede');
    } finally {
      setInconsistencyLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSort = { key, direction };
    setSortConfig(newSort);
    setCurrentPage(1);
    fetchInconsistencyDetails(selectedInconsistency, 1, newSort);
  };

  const handleOpenModal = (category) => {
    if (data.errors[category] === 0) return; // Don't open if zero records
    setSelectedInconsistency(category);
    setSortConfig(null); // Reset sort when opening new category
    setModalOpen(true);
    fetchInconsistencyDetails(category, 1, null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedInconsistency(null);
    setInconsistencyData([]);
  };

  const getColumnsForCategory = (category) => {
    switch (category) {
      case 'sellin': return [
        {key: 'data_emissao', label:'Data Emissão'},
        {key: 'dta_criacao', label: 'Data Registro'},
        {key: 'nro_nota_fiscal', label:'Nota Fiscal'},
        {key: 'nro_documento', label: 'Nº Documento'},
        {key: 'cliente', label:'Cliente'},
        {key: 'produto', label: 'Produto'},
        {key: 'nom_produto', label: 'Nome Prod'},
        {key: 'tipo_doc_fat', label: 'Tipo Fat'},
        {key: 'referencia_fat', label: 'Ref Fat'},
        {key: 'erros', label:'Erros (JSON)'}
      ];
      case 'clientes': return [
        {key: 'dta_criacao', label: 'Data Registro'}, 
        {key: 'cod_cliente', label: 'Cod Cliente'}, 
        {key: 'nom_cliente', label: 'Nome'}, 
        {key: 'cnpj', label: 'CNPJ'}, 
        {key: 'ativo_inativo', label: 'Ativo/Inativo'}, 
        {key: 'regional', label: 'Regional'}, 
        {key: 'erros', label: 'Erros'}
      ];
      case 'produtos': return [
        {key: 'lote', label: 'Lote'}, 
        {key: 'id_produto', label:'ID Prod'}, 
        {key: 'nom_produto', label:'Nome Produto'}, 
        {key: 'ativo_inativo', label:'Ativo'}, 
        {key: 'setor_atividade', label:'Setor'}, 
        {key: 'erros', label:'Erros (JSON)'}
      ];
      case 'cutoff': return [{key: 'nro_documento', label:'Num Fatura'}, {key: 'cutoff', label:'Cutoff'}, {key: 'tipo', label:'Tipo'}, {key: 'erros', label:'Erros (JSON)'}];
      case 'usuarios': return [
        {key: 'dta_criacao', label:'Data Registro'}, 
        {key: 'matricula', label:'Matrícula'}, 
        {key: 'email', label:'E-mail'}, 
        {key: 'nome_perfil', label:'Perfil'}, 
        {key: 'nome_estrutura', label:'Estrutura'}, 
        {key: 'erros', label:'Erros (JSON)'}
      ];
      case 'pagamentos': return [{key: 'cod_pagamento', label: 'Cod. Pagamento'}, {key: 'cliente', label: 'Cliente'}, {key: 'sequencial', label: 'Sequencial'}, {key: 'purch_no_c', label: 'Identificador'}, {key: 'dta_criacao', label: 'Data Registro'}, {key: 'dta_envio_integracao', label: 'Data Integração'}, {key: 'status', label: 'Status'}, {key: 'msg', label: 'Erros'}];
      case 'vk11': return [{key: 'id_orcamento', label: 'ID Orçamento'}, {key: 'descricao', label: 'Descrição'}, {key: 'tipo_integracao', label: 'Tipo'}, {key: 'valid_from', label: 'Válido De'}, {key: 'status', label: 'Status'}, {key: 'msg', label: 'Erros'}];
      default: return [{key: 'id', label: 'ID'}];
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    
    // Create multiple sheets
    const wb = XLSX.utils.book_new();
    
    const integracoes = [
      { Tipo: 'VK11 (Orçamento)', Sucesso: data.vk11.success, Pendente: data.vk11.pending, Erro: data.vk11.error, PendenteRetorno: 0, Total: data.vk11.success + data.vk11.pending + data.vk11.error },
      { Tipo: 'ZAJUS (Ajustes)', Sucesso: data.zaju.success, Pendente: data.zaju.pending, Erro: data.zaju.error, PendenteRetorno: data.zaju.pending_return, Total: data.zaju.total },
      { Tipo: 'ZVER (Pagamentos)', Sucesso: data.zver.success, Pendente: data.zver.pending, Erro: data.zver.error, PendenteRetorno: data.zver.pending_return, Total: data.zver.success + data.zver.pending + data.zver.error + data.zver.pending_return }
    ];
    
    const inconsistencias = Object.entries(data.errors).map(([key, value]) => ({
      Cadastro: key.toUpperCase(),
      RegistrosComErro: value
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(integracoes), "Integrações");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inconsistencias), "Inconsistências");
    
    XLSX.writeFile(wb, `Fechamento_Suzano_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCategory = async (category, total) => {
    if (!category || total === 0) return;
    try {
      setInconsistencyLoading(true);
      // Fetch ALL possible records for this category
      const result = await getInconsistenciasData(category, 1, total > 0 ? total : 5000);
      const dataToExport = result.data || [];
      
      let columnsDef = getColumnsForCategory(category === 'pagamentos_sucesso' ? 'pagamentos' : category);
      
      // Especificação do usuário: para exportação de sucessos, mudar "Erros" para "Mensagem"
      if (category === 'pagamentos_sucesso') {
        columnsDef = columnsDef.map(col => col.key === 'msg' ? { ...col, label: 'Mensagem' } : col);
      }
      
      const formattedData = dataToExport.map(row => {
        const formattedRow = {};
        columnsDef.forEach(col => {
          let value = row[col.key];
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          formattedRow[col.label] = value === null || value === undefined ? "" : value;
        });
        return formattedRow;
      });
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedData), category.toUpperCase());
      XLSX.writeFile(wb, `Registros_${category}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Erro ao exportar categoria", err);
      alert("Não foi possível exportar os dados completos.");
    } finally {
      setInconsistencyLoading(false);
    }
  };

  const exportInconsistencyCategory = () => exportCategory(selectedInconsistency, totalCount);

  const totalErrors = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.errors).reduce((a, b) => a + b, 0);
  }, [data]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'pagamentos', label: 'Pagamentos' },
    { id: 'vk11', label: 'VK11' },
    { id: 'zaku', label: 'Ajuste de Provisão (ZAJU)' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel de Fechamento</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Visão geral da integração de dados</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-slate-400 group">
                <RefreshCw 
                  size={14} 
                  className={`transition-all ${loading ? 'animate-spin text-blue-500' : 'group-hover:text-blue-500 cursor-pointer'}`}
                  onClick={() => !loading && loadData()}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">Atualização Automática (5 min)</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Atualizado em <span className="text-slate-700 font-bold">{formatDateTime(lastUpdated)}</span>
              </p>
            </div>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 rounded shadow-[4px_4px_0px_#94a3b8] font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
              <Download size={16} strokeWidth={2.5} /> Exportar Excel
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 text-sm font-bold transition-all rounded-t-lg border-b-2 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] w-full mx-auto">
        {activeTab === 'geral' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Registros Integrados</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                        {data.vk11.success + data.zaju.success + data.zver.success}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 size={24} /></div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Pendentes Gerais</p>
                    <h3 className="text-3xl font-bold text-amber-600">
                        {data.vk11.pending + data.zaju.pending + data.zver.pending}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24} /></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Erros de Integração</p>
                    <h3 className="text-3xl font-bold text-red-600">
                        {data.vk11.error + data.zaju.error + data.zver.error}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Inconsistências (Cadastro)</p>
                    <h3 className="text-3xl font-bold text-rose-600">{totalErrors}</h3>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={24} /></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Integrações Health Board */}
              <div className="flex flex-col space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                  <Activity size={20} className="text-blue-600" /> Saúde das Integrações
                </h2>
                <div className="flex flex-col gap-4">
                  <IntegrationHealthCard title="ZAJUS (Ajustes de Provisão)" success={data.zaju.success} pending={data.zaju.pending} error={data.zaju.error} />
                  <IntegrationHealthCard title="PROVISÃO (VK11)" success={data.vk11.success} pending={data.vk11.pending} error={data.vk11.error} />
                  <IntegrationHealthCard title="ZVER (Pagamentos)" success={data.zver.success} pending={data.zver.pending} error={data.zver.error} />
                </div>
              </div>

              {/* Errors List */}
              <div className="flex flex-col space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                   <Target size={20} className="text-rose-600" /> Inconsistências de Cadastro
                </h2>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-grow">
                  <div className="space-y-4">
                    {Object.entries(data.errors).map(([key, value]) => {
                      const isZero = value === 0;
                      return (
                        <button 
                          key={key} 
                          onClick={() => handleOpenModal(key)}
                          disabled={isZero}
                          className="w-full text-left flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all group"
                        >
                          <span className="font-bold text-slate-700 capitalize group-hover:text-blue-600 transition-colors">{key}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_#cbd5e1] border transition-transform ${
                            isZero ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200 group-hover:-translate-y-0.5'
                          }`}>
                            {value} {value === 1 ? 'registro' : 'registros'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'pagamentos' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Counts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Integrados</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-bold text-blue-600">{data.zver.success}</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(data.zver.value_success)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Integração Pendente</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-bold text-amber-600">{data.zver.pending}</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(data.zver.value_pending)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Aguardando Retorno</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-bold text-indigo-600">{data.zver.pending_return}</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(data.zver.value_pending_return)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Com Erro</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-bold text-rose-600">{data.zver.error}</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(data.zver.value_error)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-xl overflow-hidden shadow-[8px_8px_0px_#94a3b8] border border-slate-800">
              {/* Left Column: Total Integrado (High Prominence) */}
              <div className="lg:col-span-2 bg-white p-8 flex flex-col justify-center border-r border-slate-100">
                <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">Total Integrado com Sucesso</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(data.zver.value_success)}
                  </h2>
                </div>
                <button 
                  onClick={() => exportCategory('pagamentos_sucesso', data.zver.success)}
                  title="Exportar registro"
                  className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full w-fit hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 size={16} />
                  <span>{data.zver.success} registros validados</span>
                </button>
              </div>

              {/* Right Column: Pendentes & Erros (Dark Background) */}
              <div className="lg:col-span-3 bg-slate-900 p-8 flex flex-col md:flex-row justify-around items-center gap-8">
                <div className="space-y-1 text-center md:text-left">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Resumo Financeiro Pendente</p>
                  <h3 className="text-3xl font-black text-white">{formatCurrency(data.zver.value_pending + data.zver.value_pending_return)}</h3>
                  <p className="text-slate-500 text-xs font-medium">({data.zver.pending + data.zver.pending_return} registros aguardando)</p>
                </div>
                
                <div className="h-12 w-px bg-slate-800 hidden md:block"></div>
                
                <div className="space-y-1 text-center md:text-left">
                  <p className="text-rose-500/80 font-bold text-[10px] uppercase tracking-widest">Total com Erro</p>
                  <h3 className="text-3xl font-black text-rose-500">{formatCurrency(data.zver.value_error)}</h3>
                  <p className="text-slate-500 text-xs font-medium">({data.zver.error} registros com falha)</p>
                </div>
              </div>
            </div>

            {/* Top 5 Clients Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Trophy size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800">Top 5 Clientes (Maior Valor)</h3>
                </div>
                <Users size={18} className="text-slate-400" />
              </div>
              
              <div className="divide-y divide-slate-100">
                {data.zver.top_clients && data.zver.top_clients.length > 0 ? (
                  data.zver.top_clients.map((client, index) => (
                    <div key={client.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-600' : 
                          index === 1 ? 'bg-slate-200 text-slate-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {index + 1}º
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{client.nome}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{client.id} • {client.qtd} pagamentos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatCurrency(client.valor)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(client.valor / data.zver.top_clients[0].valor) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 italic text-sm">
                    Nenhum registro encontrado no período.
                  </div>
                )}
              </div>
            </div>

            {/* Action Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={24} /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">Inconsistências de Pagamentos</h4>
                    <p className="text-sm text-slate-500">Existem {data.errors.pagamentos} registros com erro de cadastro/validação</p>
                  </div>
               </div>
               <button 
                  onClick={() => handleOpenModal('pagamentos')}
                  disabled={data.errors.pagamentos === 0}
                  className="px-6 py-2 bg-rose-600 text-white font-bold rounded shadow-[4px_4px_0px_#fb7185] hover:bg-rose-700 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                  Ver Detalhes de Erros
               </button>
            </div>
          </div>
        )}

        {activeTab === 'vk11' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
              <Clock size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Funcionalidade em breve</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-center">
              A aba VK11 está sendo preparada para as próximas atualizações do painel de controle.
            </p>
          </div>
        )}

        {activeTab === 'zaku' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider text-center">Integrados</p>
                <h3 className="text-3xl font-bold text-blue-600 text-center">{data.zaju.success}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider text-center">Integração Pendente</p>
                <h3 className="text-3xl font-bold text-amber-600 text-center">{data.zaju.pending}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider text-center">Pendente Retorno</p>
                <h3 className="text-3xl font-bold text-indigo-600 text-center">{data.zaju.pending_return}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider text-center">Erros</p>
                <h3 className="text-3xl font-bold text-rose-600 text-center">{data.zaju.error}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider text-center">Total de Zajus</p>
                <h3 className="text-3xl font-bold text-slate-800 text-center">{data.zaju.total}</h3>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="bg-slate-900 p-10 rounded-xl shadow-[8px_8px_0px_#94a3b8] border border-slate-800 flex flex-col md:flex-row items-center justify-around gap-8">
              <div className="text-center">
                <p className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-2">Processamento de Zajus</p>
                <h2 className="text-6xl font-black text-white tracking-tighter">
                  {data.zaju.success}
                </h2>
                <p className="text-slate-400 font-bold text-sm mt-2">Integrados com Sucesso</p>
              </div>

              <div className="h-20 w-px bg-slate-800 hidden md:block"></div>

              <div className="text-center">
                <p className="text-rose-500 font-black text-xs uppercase tracking-[0.2em] mb-2">Volume Total de Registros</p>
                <h2 className="text-6xl font-black text-white tracking-tighter">
                  {data.zaju.total}
                </h2>
                <p className="text-slate-400 font-bold text-sm mt-2">Total na Base de Dados</p>
              </div>
            </div>

            {/* Inconsistencies Link Placeholder (if ZAJU has specific errors) */}
            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
               <Search size={32} className="mb-2" />
               <p className="font-medium">O detalhamento individual de cada ZAJU pode ser consultado via exportação ou na aba Geral.</p>
            </div>
          </div>
        )}
      </main>

      {/* Inconsistency Details Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={handleCloseModal} 
        title={`Detalhamento de Inconsistência: ${selectedInconsistency}`}
        actions={
          <button 
            onClick={exportInconsistencyCategory}
            disabled={inconsistencyLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-900 text-white rounded-lg shadow-sm text-sm font-semibold hover:bg-slate-800 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Download size={14} strokeWidth={2.5} /> Exportar Excel
          </button>
        }
      >
        <div className="h-[65vh] flex flex-col">
          {selectedInconsistency && (
              <PaginatedTable 
                  data={inconsistencyData}
                  columns={getColumnsForCategory(selectedInconsistency)}
                  loading={inconsistencyLoading}
                  error={inconsistencyError}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onPageChange={(page) => fetchInconsistencyDetails(selectedInconsistency, page)}
                  sortConfig={sortConfig}
                  onSort={handleSort}
              />
          )}
        </div>
      </Modal>
    </div>
  );
}
