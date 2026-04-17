import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDashboardData, 
  getInconsistenciasData, 
  getVk11Details,
  exportRelatorioZaju,
  exportRelatorioCgElegiveis,
  exportRelatorioSellinDetalhado,
  exportRelatorioClientesDetalhado,
  exportStyledData
} from '../services/api';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
  Target,
  List,
  History,
  Database,
  UserCheck,
  FileText,
  CreditCard,
  Settings,
  Truck,
  Contact,
  Package,
  Calculator,
  BarChart3,
  ShieldCheck,
  ReceiptText,
  CalendarClock,
  HandCoins,
  ArrowDownUp,
  Zap
} from 'lucide-react';
import Modal from '../components/Modal';
import PaginatedTable from '../components/PaginatedTable';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { useMemo } from 'react';

const IntegrationHealthCard = ({ title, success, pending, error, pendingReturn = null }) => {
  const total = success + pending + error + (pendingReturn || 0);
  
  const data = [
    { name: 'Sucesso', value: success, color: '#10b981' },
    { name: 'Pendente', value: pending, color: '#f59e0b' },
    { name: 'Erro', value: error, color: '#ef4444' },
    ...(pendingReturn !== null ? [{ name: 'Pendente Retorno', value: pendingReturn, color: '#4f46e5' }] : [])
  ].filter(item => item.value > 0);

  const displayData = data.length > 0 ? data : [{ name: 'Vazio', value: 1, color: '#f1f5f9' }];
  
  const getPercentage = (val) => total > 0 ? ((val / total) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all group flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-slate-800 tracking-tighter text-xs uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">{title}</h3>
      </div>
      
      <div className="flex flex-col items-center gap-8 flex-grow justify-center">
        {/* Modern Donut Chart */}
        <div className="w-44 h-44 relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={1500}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
             <span className="text-2xl font-black text-slate-800 leading-none mt-1 tracking-tighter">
                {getPercentage(success)}<span className="text-xs text-emerald-500 font-bold">%</span>
             </span>
          </div>
        </div>

        {/* High-Fidelity Legend */}
        <div className="w-full space-y-4 pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sucesso</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-800">{success}</span>
              <span className="text-[10px] font-bold text-slate-400">REG.</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendentes</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-800">{pending}</span>
              <span className="text-[10px] font-bold text-slate-400">REG.</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Erro</span>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-sm font-black text-rose-500">{error}</span>
               <span className="text-[10px] font-bold text-slate-400">REG.</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationLog = ({ updates }) => {
  const getIcon = (category) => {
    switch(category) {
      case 'Sell-In': return <HandCoins size={16} />;
      case 'Clientes': return <Contact size={16} />;
      case 'Produtos': return <Package size={16} />;
      case 'Usuários': return <UserCheck size={16} />;
      case 'ZAJU': return <ArrowDownUp size={16} />;
      case 'ZVER': return <CreditCard size={16} />;
      case 'VK11': return <BarChart3 size={16} />;
      case 'Dados Provisões': return <ShieldCheck size={16} />;
      case 'Retorno Pagamento': return <ReceiptText size={16} />;
      case 'Cutoff': return <CalendarClock size={16} />;
      default: return <History size={16} />;
    }
  };

  const getIconBg = (category) => {
    const colors = {
      'Sell-In': 'bg-blue-50 text-blue-600 ring-blue-100',
      'Clientes': 'bg-amber-50 text-amber-600 ring-amber-100',
      'Produtos': 'bg-indigo-50 text-indigo-600 ring-indigo-100',
      'Usuários': 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      'ZAJU': 'bg-rose-50 text-rose-600 ring-rose-100',
      'ZVER': 'bg-sky-50 text-sky-600 ring-sky-100',
      'VK11': 'bg-violet-50 text-violet-600 ring-violet-100',
      'Dados Provisões': 'bg-teal-50 text-teal-600 ring-teal-100',
      'Retorno Pagamento': 'bg-orange-50 text-orange-600 ring-orange-100',
      'Cutoff': 'bg-slate-50 text-slate-600 ring-slate-100'
    };
    return colors[category] || 'bg-slate-50 text-slate-400 ring-slate-100';
  };

  const formatTime = (isoDate) => {
    if (!isoDate) return "--/--";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day}/${month} às ${time}`;
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
            <Activity size={18} />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Painel de Eventos</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Últimas 24h</span>
      </div>
      
      <div className="space-y-0.5 overflow-y-auto pr-4 custom-scrollbar relative">
        {/* Timeline Axis */}
        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-slate-100/80"></div>

        {updates && updates.map((update, index) => (
          <div key={index} className="relative flex gap-6 group py-4 transition-all hover:bg-slate-50/50 rounded-2xl px-2 -mx-2">
            <div className={`relative z-10 p-3 rounded-2xl flex-shrink-0 flex items-center justify-center h-12 w-12 ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 ${getIconBg(update.categoria)}`}>
              {getIcon(update.categoria)}
            </div>
            <div className="flex flex-col flex-grow justify-center">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-black text-slate-800 tracking-tight text-sm truncate uppercase">
                  {update.categoria}
                </h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                   <div className={`h-1.5 w-1.5 rounded-full ${update.direcao === 'Inbound' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {update.direcao === 'Inbound' ? 'Sync SAP' : 'Outbound'}
                   </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 lines-clamp-1 font-medium italic">
                {update.mensagem}
              </p>
              <p className="text-[9px] font-black text-blue-600/60 uppercase mt-2 tracking-widest">
                {formatTime(update.data)}
              </p>
            </div>
          </div>
        ))}
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

  // VK11 Specific States
  const [vk11Details, setVk11Details] = useState([]);
  const [vk11Loading, setVk11Loading] = useState(false);
  const [vk11Error, setVk11Error] = useState(null);

  const [activeTab, setActiveTab] = useState('geral');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Date Range State (Início do mês atual até hoje como padrão)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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
      const result = await getDashboardData(dateRange.startDate, dateRange.endDate);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadData]);

  const fetchVk11Details = useCallback(async () => {
    setVk11Loading(true);
    setVk11Error(null);
    try {
      const res = await getVk11Details(dateRange.startDate, dateRange.endDate);
      setVk11Details(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar detalhes VK11:", err);
      setVk11Error(err.message || 'Erro ao carregar dados');
    } finally {
      setVk11Loading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (activeTab === 'vk11') {
      fetchVk11Details();
    }
  }, [activeTab, fetchVk11Details]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const fetchInconsistencyDetails = async (category, page = 1, sort = sortConfig) => {
    setInconsistencyLoading(true);
    setInconsistencyError(null);
    try {
      const result = await getInconsistenciasData(
        category, 
        page, 
        20, 
        sort?.key, 
      );
      
      const transformItem = (cat, item) => {
        const transformed = { ...item };
        
        // Sanitizador para padrões técnicos Java em campos JSON (ex: ["java.util.ArrayList", ["valor"]])
        const cleanJavaData = (val) => {
          if (!val) return val;
          try {
            // Se for string que parece JSON, tenta fazer o parse primeiro
            const parsed = typeof val === 'string' && (val.startsWith('[') || val.startsWith('{')) ? JSON.parse(val) : val;
            if (Array.isArray(parsed) && parsed[0] === 'java.util.ArrayList' && Array.isArray(parsed[1])) {
              return parsed[1][0] || "";
            }
            return parsed;
          } catch (e) {
            return val;
          }
        };

        // Aplicar sanitização básica em todos os campos para remover ruído técnico
        Object.keys(transformed).forEach(key => {
          transformed[key] = cleanJavaData(transformed[key]);
        });
        
        if (cat === 'clientes') {
          transformed.cliente_display = `${transformed.cod_cliente} - ${transformed.nom_cliente}`;
          transformed.customer_group_display = `${transformed.cod_customer_group} - ${transformed.customer_group}`;
          transformed.regional_display = `${transformed.cod_regional} - ${transformed.regional}`;
          transformed.status_label = transformed.ativo_inativo ? 'Ativo' : 'Inativo';
        }
        
        if (cat === 'produtos') {
          transformed.produto_display = `${transformed.id_produto} - ${transformed.nom_produto}`;
          transformed.status_label = transformed.ativo_inativo ? 'Ativo' : 'Inativo';
        }
        
        if (cat === 'usuarios') {
          const isTrue = (val) => val === 'true' || val === true || val === '1' || val === 1;
          transformed.status_label = isTrue(transformed.ativo_inativo) ? 'Ativo' : 'Inativo';
          transformed.recebe_email_label = isTrue(transformed.ind_recebe_email) ? 'Sim' : 'Não';
          transformed.aprova_workflow_label = isTrue(transformed.ind_aprova_workflow) ? 'Sim' : 'Não';
        }

        if (cat === 'pagamentos') {
          transformed.cliente_display = `${transformed.cod_cliente || ""} - ${transformed.nom_cliente || ""}`;
        }
        
        return transformed;
      };

      let processedData = (result.data || []).map(item => transformItem(category, item));
      setInconsistencyData(processedData);
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

  const getCategoryLabel = (category) => {
    const labels = {
      'sellin': 'Faturamento (Sell-In)',
      'clientes': 'Clientes',
      'produtos': 'Produtos',
      'cutoff': 'Controle de Cutoff',
      'usuarios': 'Usuários',
      'pagamentos': 'Integração de Pagamentos (ZVER)',
      'vk11': 'Integração de Preços (VK11)',
      'zaju': 'Ajustes de Provisão (ZAJU)'
    };
    return labels[category] || category;
  };

  const getColumnsForCategory = (category) => {
    switch(category) {
      case 'sellin': return [
        {key: 'erros', label:'Erros', align: 'center'},
        {key: 'data_emissao', label:'Data Emissão', align: 'center'},
        {key: 'cliente', label:'Cliente', align: 'center'},
        {key: 'nro_nota_fiscal', label:'Nota Fiscal', align: 'center'},
        {key: 'nro_documento', label: 'Nº Documento', align: 'center'},
        {key: 'tipo_doc_fat', label: 'Tipo Doc Faturamento', align: 'center'}
      ];
      case 'clientes': return [
        {key: 'erros', label:'Erros', align: 'center'},
        {key: 'cliente_display', label:'Cliente', align: 'center'},
        {key: 'cnpj', label:'CNPJ', align: 'center'},
        {key: 'customer_group_display', label:'Customer Group', align: 'center'},
        {key: 'status_label', label:'Status', align: 'center'},
        {key: 'regional_display', label:'Regional', align: 'center'}
      ];
      case 'produtos': return [
        {key: 'erros', label: 'Erros', align: 'center'}, 
        {key: 'lote', label: 'Lote', align: 'center'}, 
        {key: 'produto_display', label: 'Produto', align: 'center'}, 
        {key: 'cod_hierarquia1', label: 'Hierarquia 1', align: 'center'}, 
        {key: 'status_label', label: 'Status', align: 'center'}
      ];
      case 'cutoff': return [
        {key: 'erros', label: 'Erros', align: 'center'}, 
        {key: 'lote', label: 'Lote', align: 'center'}, 
        {key: 'cutoff', label: 'Cutoff', align: 'center'}, 
        {key: 'nro_documento', label: 'Nº Doc. Faturamento', align: 'center'}
      ];
      case 'usuarios': return [
        {key: 'erros', label: 'Erros', align: 'center'}, 
        {key: 'lote', label: 'Lote', align: 'center'}, 
        {key: 'email', label: 'Email', align: 'center'}, 
        {key: 'matricula', label: 'Matricula', align: 'center'}, 
        {key: 'nome_perfil', label: 'Perfil', align: 'center'}, 
        {key: 'nome_estrutura', label: 'Estrutura de Usuario', align: 'center'}, 
        {key: 'codigo_divisao', label: 'Divisão', align: 'center'}, 
        {key: 'status_label', label: 'Status', align: 'center'}
      ];
      case 'pagamentos': return [
        {key: 'msg', label: 'Erros', align: 'center'},
        {key: 'cod_pagamento', label: 'Cod. Pagamento', align: 'center'},
        {key: 'cliente_display', label: 'Cliente', align: 'center'},
        {key: 'nro_documento', label: 'Nº Documento', align: 'center'},
        {key: 'sequencial', label: 'Sequencial', align: 'center'},
        {key: 'dta_envio_integracao', label: 'Data Envio Integração', align: 'center'},
        {key: 'status', label: 'Status', align: 'center'}
      ];
      case 'vk11': return [
        {key: 'msg', label: 'Erros', align: 'center'},
        {key: 'id_orcamento', label: 'ID Orçamento', align: 'center'},
        {key: 'descricao', label: 'Descrição', align: 'center'},
        {key: 'tipo_integracao', label: 'Tipo', align: 'center'},
        {key: 'valid_from', label: 'Válido De', align: 'center'},
        {key: 'status', label: 'Status', align: 'center'}
      ];
      case 'zaju': return [
        {key: 'mensagem_retorno_integracao', label: 'Erros', align: 'center'},
        {key: 'purch_no_c', label: 'ID Ajuste', align: 'center'}, 
        {key: 'orcamento', label: 'Orçamento', align: 'center'}, 
        {key: 'linha_investimento', label: 'Linha Invest.', align: 'center'}, 
        {key: 'cod_cliente', label: 'Cód. Cliente', align: 'center'}, 
        {key: 'nome_cliente', label: 'Cliente', align: 'center'}, 
        {key: 'nro_nota_fiscal', label: 'Nota Fiscal', align: 'center'}, 
        {key: 'valor_provisao', label: 'Vlr. Provisão', align: 'center'}
      ];
      default: return [{key: 'id', label: 'ID'}];
    }
  };

  /**
   * Layout expandido para exportação Excel (conforme QUERY_ERRO_CLIENTES e outras)
   */
  const getExportColumnsForCategory = (category) => {
    switch(category) {
      case 'clientes': return [
        {key: 'dta_criacao', label: 'Data Registro'},
        {key: 'erros', label: 'Erros de Integração'},
        {key: 'cod_cliente', label: 'Cód. Cliente (Externo)'},
        {key: 'nom_cliente', label: 'Nome Cliente'},
        {key: 'cnpj', label: 'CNPJ'},
        {key: 'ativo_inativo', label: 'Ativo/Inativo'},
        {key: 'contato_cliente', label: 'Nome Contato'},
        {key: 'email_contato_cliente', label: 'E-mail Contato'},
        {key: 'telefone_contato_cliente', label: 'Telefone Contato'},
        {key: 'sap_pagador', label: 'É Pagador (SAP)'},
        {key: 'cod_customer_group', label: 'Cód. Customer Group'},
        {key: 'customer_group', label: 'Customer Group'},
        {key: 'cod_canal', label: 'Cód. Canal'},
        {key: 'canal', label: 'Canal'},
        {key: 'sub_canal', label: 'Sub Canal'},
        {key: 'cod_regional', label: 'Cód. Regional'},
        {key: 'regional', label: 'Regional'},
        {key: 'dta_alteracao', label: 'Data Última Alteração'}
      ];
      case 'produtos': return [
        {key: 'erros', label: 'Erros'},
        {key: 'id_produto', label: 'Cod. Produto'},
        {key: 'nom_produto', label: 'Produto'},
        {key: 'status_label', label: 'Status'},
        {key: 'volume', label: 'Volume'},
        {key: 'peso', label: 'Peso'},
        {key: 'unidade_medida', label: 'Unidade de Medida'},
        {key: 'cod_classe', label: 'Cod. Classe'},
        {key: 'classe', label: 'Classe'},
        {key: 'cod_linha_produto', label: 'Linha de Produto'},
        {key: 'grupo_mercadoria', label: 'Grupo Mercadoria'},
        {key: 'cod_familia', label: 'Cod. Familia'},
        {key: 'familia', label: 'Familia'},
        {key: 'cod_setor_atividade', label: 'Cod. Setor'},
        {key: 'setor_atividade', label: 'Setor'},
        {key: 'cod_hierarquia1', label: 'Hierarquia 1'},
        {key: 'cod_hierarquia2', label: 'Hierarquia 2'},
        {key: 'cod_hierarquia3', label: 'Hierarquia 3'},
        {key: 'cod_unidade_negocio', label: 'Cod. Unidade Negócio'},
        {key: 'unidade_negocio', label: 'Unidade de Negocio'}
      ];
      case 'sellin': return [
        {key: 'erros', label: 'Erros'},
        {key: 'dta_criacao', label: 'Data Registro'},
        {key: 'data_emissao', label: 'Data Emissão'},
        {key: 'nro_nota_fiscal', label: 'Nº Nota Fiscal'},
        {key: 'id_cliente', label: 'ID Cliente'},
        {key: 'nom_cliente', label: 'Nome Cliente'},
        {key: 'nro_documento', label: 'Nº Documento Fiscal'},
        {key: 'item_documento', label: 'Item'},
        {key: 'id_produto', label: 'ID Produto'},
        {key: 'nom_produto', label: 'Nome Produto'},
        {key: 'quantidade', label: 'Qtd'},
        {key: 'valor_total', label: 'Vlr Total'},
        {key: 'valor_liquido', label: 'Vlr Líquido'},
        {key: 'tipo_doc_fat', label: 'Tipo Doc'},
        {key: 'referencia_fat', label: 'Ref. Faturamento'}
      ];
      case 'pagamentos': 
      case 'pagamentos_sucesso': return [
        {key: 'cod_pagamento', label: 'Cod. Pagamento'},
        {key: 'cod_cliente', label: 'Cod. Cliente'},
        {key: 'nom_cliente', label: 'Cliente'},
        {key: 'nro_documento', label: 'Nº Documento'},
        {key: 'sequencial', label: 'Sequencial'},
        {key: 'doc_type', label: 'Tipo Documento'},
        {key: 'purch_no_c', label: 'Tipo Integração'},
        {key: 'cond_type', label: 'Tipo'},
        {key: 'tipo_acao', label: 'Tipo de Ação'},
        {key: 'dta_criacao', label: 'Criação Pagamento'},
        {key: 'dta_alteracao', label: 'Alteração Pagamento'},
        {key: 'status', label: 'Status'},
        {key: 'msg', label: 'Erros'},
        {key: 'dta_envio_integracao', label: 'Envio Integração'}
      ];
      case 'usuarios': return [
        {key: 'erros', label: 'Erros'},
        {key: 'email', label: 'E-mail'},
        {key: 'matricula', label: 'Matricula'},
        {key: 'nome_perfil', label: 'Perfil'},
        {key: 'nome_estrutura', label: 'Estrutura de Usuário'},
        {key: 'codigo_divisao', label: 'Divisão'},
        {key: 'recebe_email_label', label: 'Recebe e-mail?'},
        {key: 'aprova_workflow_label', label: 'Aprova Workflow?'},
        {key: 'status_label', label: 'Status'},
        {key: 'chave_integracao', label: 'Chave Integração'}
      ];
      case 'cutoff': return [
        {key: 'erros', label: 'Erros'},
        {key: 'lote', label: 'Lote'},
        {key: 'cutoff', label: 'Cutoff'},
        {key: 'nro_documento', label: 'Nº Doc. Faturamento'}
      ];
      case 'vk11': return [
        {key: 'msg', label: 'Erros'},
        {key: 'id_orcamento', label: 'ID Orçamento'},
        {key: 'descricao', label: 'Descrição'},
        {key: 'tipo_integracao', label: 'Tipo Integração'},
        {key: 'id_ajuste_verba', label: 'Ajuste Verba'},
        {key: 'status', label: 'Status'},
        {key: 'valid_from', label: 'Válido De'},
        {key: 'dta_alteracao', label: 'Alteração Orçamento'}
      ];
      case 'zaju': return [
        {key: 'mensagem_retorno_integracao', label: 'Erros de Integração'},
        {key: 'purch_no_c', label: 'ID Ajuste'},
        {key: 'orcamento', label: 'Orçamento'},
        {key: 'linha_investimento', label: 'Linha Investimento'},
        {key: 'tipo_linha_investimento', label: 'Tipo Linha Investimento'},
        {key: 'cod_cliente', label: 'Cód. Cliente'},
        {key: 'nome_cliente', label: 'Nome Cliente'},
        {key: 'nro_nota_fiscal', label: 'NRO Nota Fiscal'},
        {key: 'vkorg', label: 'VKORG'},
        {key: 'nro_documento', label: 'NRO Documento'},
        {key: 'valor_bruto', label: 'Valor Bruto'},
        {key: 'valor_liquido', label: 'Valor Líquido'},
        {key: 'valor_provisao', label: 'Valor Provisão'},
        {key: 'dta_criacao', label: 'Criação Integração'},
        {key: 'tipo_doc', label: 'Tipo Documento'},
        {key: 'sequencial', label: 'Sequencial'},
        {key: 'material', label: 'Código Material'},
        {key: 'nome_produto', label: 'Nome Material'},
        {key: 'unidade_medida', label: 'Unidade Medida'},
        {key: 'cond_type', label: 'Tipo Condição'},
        {key: 'status', label: 'Status'},
        {key: 'numov_integracao', label: 'Numero OV'},
        {key: 'numfat_integracao', label: 'Numero Faturamento'},
        {key: 'data_integracao', label: 'Data Integração SAP'},
        {key: 'dta_alteracao', label: 'Última Alteração'}
      ];
      default: return getColumnsForCategory(category);
    }
  };

  const handleDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    if (!data) return;
    setInconsistencyLoading(true);
    try {
      const integracoes = [
        { Tipo: 'VK11 (Orçamento)', Sucesso: data.vk11.success, Pendente: data.vk11.pending, Erro: data.vk11.error, PendenteRetorno: 0, Total: data.vk11.success + data.vk11.pending + data.vk11.error },
        { Tipo: 'ZAJUS (Ajustes)', Sucesso: data.zaju.success, Pendente: data.zaju.pending, Erro: data.zaju.error, PendenteRetorno: data.zaju.pending_return, Total: data.zaju.total },
        { Tipo: 'ZVER (Pagamentos)', Sucesso: data.zver.success, Pendente: data.zver.pending, Erro: data.zver.error, PendenteRetorno: data.zver.pending_return, Total: data.zver.success + data.zver.pending + data.zver.error + data.zver.pending_return }
      ];
      
      const inconsistencias = Object.entries(data.errors).map(([key, value]) => ({
        Cadastro: key.toUpperCase(),
        RegistrosComErro: value
      }));

      const blob = await exportStyledData({
        title: 'Tradelinks_Dashboard',
        sheets: [
          { name: 'Integrações', data: integracoes },
          { name: 'Inconsistências', data: inconsistencias }
        ]
      }, 'Tradelinks_Dashboard');

      handleDownload(blob, `Tradelinks_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Erro ao exportar fechamento", err);
      alert("Erro ao gerar exportação estilizada.");
    } finally {
    }
  };

  const exportCategory = async (category, total) => {
    if (!category || total === 0) return;
    try {
      setInconsistencyLoading(true);
      // Fetch ALL possible records for this category with current filters
      const result = await getInconsistenciasData(
        category, 
        1, 
        total > 0 ? total : 5000, 
        null, 
        'desc',
        dateRange.startDate,
        dateRange.endDate
      );
      const dataToExport = result.data || [];
      
      const transformItem = (cat, item) => {
        const transformed = { ...item };

        const cleanJavaData = (val) => {
          if (!val) return val;
          try {
            const parsed = typeof val === 'string' && (val.startsWith('[') || val.startsWith('{')) ? JSON.parse(val) : val;
            if (Array.isArray(parsed) && parsed[0] === 'java.util.ArrayList' && Array.isArray(parsed[1])) {
              return parsed[1][0] || "";
            }
            return parsed;
          } catch (e) {
            return val;
          }
        };

        Object.keys(transformed).forEach(key => {
          transformed[key] = cleanJavaData(transformed[key]);
        });

        if (cat === 'clientes') {
          transformed.cliente_display = `${transformed.cod_cliente} - ${transformed.nom_cliente}`;
          transformed.customer_group_display = `${transformed.cod_customer_group} - ${transformed.customer_group}`;
          transformed.regional_display = `${transformed.cod_regional} - ${transformed.regional}`;
          transformed.status_label = transformed.ativo_inativo ? 'Ativo' : 'Inativo';
        }
        if (cat === 'produtos') {
          transformed.produto_display = `${transformed.id_produto} - ${transformed.nom_produto}`;
          transformed.status_label = transformed.ativo_inativo ? 'Ativo' : 'Inativo';
        }
        if (cat === 'usuarios') {
          const isTrue = (val) => val === 'true' || val === true || val === '1' || val === 1;
          transformed.status_label = isTrue(transformed.ativo_inativo) ? 'Ativo' : 'Inativo';
          transformed.recebe_email_label = isTrue(transformed.ind_recebe_email) ? 'Sim' : 'Não';
          transformed.aprova_workflow_label = isTrue(transformed.ind_aprova_workflow) ? 'Sim' : 'Não';
        }
        if (cat === 'pagamentos') {
          transformed.cliente_display = `${transformed.cod_cliente || ""} - ${transformed.nom_cliente || ""}`;
        }
        return transformed;
      };

      const columnsDef = getExportColumnsForCategory(category);

      const formattedData = dataToExport.map(row => {
        const item = transformItem(category, row);
        const formattedRow = {};
        columnsDef.forEach(col => {
          let value = item[col.key];
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          formattedRow[col.label] = value === null || value === undefined ? "" : value;
        });
        return formattedRow;
      });
      
      const blob = await exportStyledData({
        title: `Registros_${category}`,
        sheets: [{ name: category.toUpperCase().slice(0, 30), data: formattedData }]
      }, `Registros_${category}`);

      handleDownload(blob, `Registros_${category}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Erro ao exportar categoria", err);
      alert("Não foi possível exportar os dados completos.");
    } finally {
      setInconsistencyLoading(false);
    }
  };

  const exportInconsistencyCategory = async () => {
    if (selectedInconsistency === 'sellin' || selectedInconsistency === 'clientes') {
      try {
        setInconsistencyLoading(true);
        const isSellin = selectedInconsistency === 'sellin';
        const exportFn = isSellin ? exportRelatorioSellinDetalhado : exportRelatorioClientesDetalhado;
        const filename = isSellin ? 'Sellin_Detalhado' : 'Clientes_Detalhado';
        
        const blob = await exportFn(null, null);
        const url = window.URL.createObjectURL(blob); 
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(`Erro ao exportar ${selectedInconsistency} detalhado`, err);
        const status = err.response ? err.response.status : 'Network Error';
        const message = err.response?.data?.detail || err.message;
        alert(`Não foi possível gerar a exportação detalhada. Status: ${status}. Detalhe: ${message}`);
      } finally {
        setInconsistencyLoading(true); // Manter coerente com o finally original que desativa loading
        setInconsistencyLoading(false);
      }
      return;
    }
    return exportCategory(selectedInconsistency, totalCount);
  };

  const totalErrors = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.errors).reduce((a, b) => a + b, 0);
  }, [data]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'pagamentos', label: 'Pagamento (ZVER)' },
    { id: 'vk11', label: 'Provisão (VK11)' },
    { id: 'zaku', label: 'Ajuste de Provisão (ZAJU)' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel de Performance e Dados</h1>
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
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Premium KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Card 1: Global Health Highlight */}
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl shadow-slate-900/40 group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Integridade Global</p>
                    <div className="p-3 bg-slate-800/80 backdrop-blur-sm text-emerald-500 rounded-2xl border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                      <Activity size={20} />
                    </div>
                  </div>
                    <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      {(((data?.vk11?.success || 0) + (data?.zaju?.success || 0) + (data?.zver?.success || 0)) / 
                        ((data?.vk11?.total || 1) + (data?.zaju?.total || 1) + (data?.zver?.total || 1)) * 100).toFixed(1)}<span className="text-xl text-emerald-500">%</span>
                    </h3>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                      style={{ width: `${((data.vk11.success + data.zaju.success + data.zver.success) / ((data.vk11.total || 1) + (data.zaju.total || 1) + (data.zver.total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-500 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sucesso</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                        {(data?.vk11?.success || 0) + (data?.zaju?.success || 0) + (data?.zver?.success || 0)}
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1 uppercase tracking-widest">
                       <CheckCircle2 size={10} /> Registros OK
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <History size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-500 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Em Processamento</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                        {(data?.vk11?.pending || 0) + (data?.zaju?.pending || 0) + (data?.zver?.pending || 0)}
                    </h3>
                    <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1 uppercase tracking-widest">
                       <Clock size={10} /> Aguardando SAP
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                    <Zap size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all duration-500 relative ring-2 ring-transparent hover:ring-rose-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ação Requerida</p>
                    <h3 className="text-4xl font-black text-rose-500 tracking-tighter">
                       {totalErrors}
                    </h3>
                    <p className="text-[10px] font-bold text-rose-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                       <AlertCircle size={10} /> Inconsistências
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-rose-100 group-hover:shadow-rose-300">
                    <Target size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
              {/* Saúde das Integrações (60%) */}
              <div className="lg:col-span-6 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-8 h-px bg-slate-200"></span> Operação Ativa
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <IntegrationHealthCard title="ZAJU" success={data?.zaju?.success || 0} pending={data?.zaju?.pending || 0} error={data?.zaju?.error || 0} pendingReturn={data?.zaju?.pending_return || 0} />
                  <IntegrationHealthCard title="VK11" success={data?.vk11?.success || 0} pending={data?.vk11?.pending || 0} error={data?.vk11?.error || 0} />
                  <IntegrationHealthCard title="ZVER" success={data?.zver?.success || 0} pending={data?.zver?.pending || 0} error={data?.zver?.error || 0} pendingReturn={data?.zver?.pending_return || 0} />
                </div>

                <IntegrationLog updates={data.last_updates} />
              </div>

              {/* Hub de Resolução (40%) */}
              <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-8 h-px bg-slate-200"></span> Central de Inconsistências
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Category Group 1: Integração Financeira */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div> SAP Gateway
                    </h4>
                    <div className="space-y-3">
                      {['pagamentos', 'vk11', 'zaju'].map((key) => {
                        const val = data.errors[key] || 0;
                        return (
                          <button 
                            key={key} 
                            onClick={() => handleOpenModal(key)}
                            disabled={val === 0}
                            className="w-full flex items-center justify-between p-5 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all group disabled:opacity-40"
                          >
                            <span className="font-black text-slate-700 text-[11px] uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                               {key === 'pagamentos' ? 'Pagamento (ZVER)' : key === 'vk11' ? 'Faturamento (Sell-In)' : 'Ajustes (ZAJU)'}
                            </span>
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${
                               val === 0 ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' : 'bg-rose-600 text-white shadow-xl shadow-rose-200 group-hover:scale-105'
                            }`}>
                               {val} {val === 1 ? 'ERR' : 'ERRS'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Group 2: Cadeia de Suprimentos */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div> Master Data & Logistics
                    </h4>
                    <div className="space-y-3">
                      {['sellin', 'clientes', 'produtos', 'cutoff', 'usuarios'].map((key) => {
                        const val = data.errors[key] || 0;
                        return (
                          <button 
                            key={key} 
                            onClick={() => handleOpenModal(key)}
                            disabled={val === 0}
                            className="w-full flex items-center justify-between p-5 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all group disabled:opacity-40"
                          >
                            <span className="font-black text-slate-700 text-[11px] uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                               {getCategoryLabel(key)}
                            </span>
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${
                               val === 0 ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' : 'bg-rose-600 text-white shadow-xl shadow-rose-200 group-hover:scale-105'
                            }`}>
                               {val} {val === 1 ? 'ERR' : 'ERRS'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pagamentos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Health & Efficiency Header */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Taxa de Eficiência</p>
                    <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">
                      {(data.zver.total > 0 ? (data.zver.success / data.zver.total * 100) : 0).toFixed(1)}%
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-[10px] uppercase">
                      <TrendingUp size={12} /> Desempenho Operacional
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
                    <Activity size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20} /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrados</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight">{formatCurrency(data.zver.value_success)}</p>
                  </div>
                </div>
                <h4 className="text-3xl font-black text-emerald-600 tracking-tighter">{data.zver.success}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Registros Financeiros</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group uppercase tracking-widest">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Processando</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight">{formatCurrency(data.zver.value_pending + data.zver.value_pending_return)}</p>
                  </div>
                </div>
                <h4 className="text-3xl font-black text-amber-600 tracking-tighter">{data.zver.pending + data.zver.pending_return}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Aguardando Integração</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={20} /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Bloqueados</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight">{formatCurrency(data.zver.value_error)}</p>
                  </div>
                </div>
                <h4 className="text-3xl font-black text-rose-600 tracking-tighter">{data.zver.error}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Falhas Detectadas</p>
              </div>
            </div>

            {/* Premium Hero Section: Integrated Value */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 shadow-2xl shadow-emerald-200/50">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <CreditCard size={200} className="text-white" />
              </div>
              <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-emerald-100 font-bold text-sm uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <span className="w-8 h-1 bg-emerald-300 rounded-full"></span> 
                       Fluxo Financeiro Integrado
                    </h2>
                    <div className="flex items-baseline gap-4">
                      <span className="text-emerald-200 text-3xl font-medium">R$</span>
                      <h3 className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
                        {formatCurrency(data.zver.value_success).replace('R$', '').trim()}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider">Volume Mensal</p>
                      <p className="text-white font-black text-xl">{data.zver.total} <span className="text-xs font-medium text-emerald-300 tracking-normal">operações</span></p>
                    </div>
                    <button 
                      onClick={() => exportCategory('pagamentos_sucesso', data.zver.success)}
                      className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-emerald-900 font-black text-sm uppercase rounded-2xl transition-all hover:-translate-y-1 shadow-lg shadow-emerald-500/20 active:translate-y-0"
                    >
                      Exportar Sucessos
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-auto grid grid-cols-2 gap-4">
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest">Impacto em Erro</p>
                    <p className="text-white text-2xl font-black">{formatCurrency(data.zver.value_error)}</p>
                    <div className="w-full h-1 bg-white/10 rounded-full">
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(data.zver.value_error / data.zver.value_success) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-amber-400 font-black text-[10px] uppercase tracking-widest">Previsão Pendente</p>
                    <p className="text-white text-2xl font-black">{formatCurrency(data.zver.value_pending + data.zver.value_pending_return)}</p>
                    <div className="w-full h-1 bg-white/10 rounded-full">
                       <div className="h-full bg-amber-400 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Modern Top 5 Ranking */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Performance por Cliente</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maiores volumes financeiros integrados</p>
                    </div>
                  </div>
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                
                <div className="p-4 space-y-2">
                  {data.zver.top_clients && data.zver.top_clients.length > 0 ? (
                    data.zver.top_clients.map((client, index) => (
                      <div key={client.id} className="group p-4 flex items-center justify-between rounded-2xl hover:bg-emerald-50/50 transition-all border border-transparent hover:border-emerald-100">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:rotate-6 ${
                              index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 
                              index === 1 ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                              index === 2 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              'bg-white text-slate-400 border border-slate-100'
                            }`}>
                              {index + 1}º
                            </div>
                            {index === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors uppercase text-xs">{client.nome}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">ID: {client.id} • {client.qtd} REGISTROS</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1.5">
                          <p className="font-black text-slate-900 group-hover:scale-105 transition-transform origin-right">{formatCurrency(client.valor)}</p>
                          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-emerald-600">
                            <span className="opacity-50 tracking-tighter uppercase whitespace-nowrap">Volume de Participação</span>
                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-400" 
                                style={{ width: `${(client.valor / data.zver.top_clients[0].valor) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <Search size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-slate-400 font-medium">Nenhum registro encontrado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Hub Banner */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative z-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-rose-100 transition-transform group-hover:-rotate-12">
                      <AlertCircle size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800">Resolução de <span className="text-rose-600">Conflitos</span></h4>
                      <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
                        Existem <strong className="text-slate-800">{data.errors.pagamentos} inconsistências</strong> detectadas na integração de pagamentos que aguardam sua auditoria.
                      </p>
                    </div>
                    <button 
                      onClick={() => handleOpenModal('pagamentos')}
                      disabled={data.errors.pagamentos === 0}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-200 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                    >
                      Acessar Log de Inconsistências
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação Corretiva Obrigatória</p>
                  </div>
                </div>

                <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                   <div className="absolute bottom-0 right-0 p-8 opacity-20 rotate-12">
                      <Target size={80} />
                   </div>
                   <h5 className="font-bold text-emerald-400 text-xs uppercase tracking-[0.2em] mb-4">Meta do Período</h5>
                   <p className="text-2xl font-black">99.5% Integração</p>
                   <p className="text-emerald-500 text-xs mt-2 font-bold uppercase">Objetivo corporativo de redução de erros</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vk11' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards Polidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm shadow-slate-900/20 hover:shadow-md hover:shadow-slate-900/40 transition-all text-white">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Volume Total</p>
                  <div className="p-2 bg-slate-800 text-slate-300 rounded-lg"><Calculator size={18} /></div>
                </div>
                <h3 className="text-3xl font-black text-white">{data.vk11.success + data.vk11.pending + data.vk11.error}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Sucesso</p>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18} /></div>
                </div>
                <h3 className="text-3xl font-black text-emerald-600">{data.vk11.success}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Aguardando Integração</p>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>
                </div>
                <h3 className="text-3xl font-black text-amber-500">{data.vk11.pending}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Falha de Integração</p>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={18} /></div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-3xl font-black text-rose-600">{data.vk11.error}</h3>
                  {data.vk11.error > 0 && (
                    <button 
                      onClick={() => exportCategory('vk11', data.vk11.error)} 
                      disabled={inconsistencyLoading}
                      className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Download size={14} /> Exportação Detalhada
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabela Detalhada (conforme print) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-white uppercase tracking-widest text-sm">Integração VK11</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhamento por Orçamento</div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Cód. Orçamento</th>
                        <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider">Orçamento</th>
                        <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider text-center">Sucesso</th>
                        <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider text-center">Pendentes</th>
                        <th className="px-5 py-3 font-black text-slate-400 uppercase tracking-wider text-center">Erros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vk11Loading ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-400">Carregando dados...</td></tr>
                      ) : vk11Details.length > 0 ? (
                        vk11Details.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-700 text-center">{row.id_orcamento}</td>
                            <td className="px-5 py-3 text-slate-600 font-medium text-center">{row.descricao}</td>
                            <td className="px-5 py-3 text-center font-black text-emerald-600">{row.integrado}</td>
                            <td className={`px-5 py-3 text-center font-black ${row.pendente_integracao > 0 ? 'text-amber-500' : 'text-slate-300'}`}>{row.pendente_integracao}</td>
                            <td className={`px-5 py-3 text-center font-black ${row.erro > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{row.erro}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Nenhum detalhamento encontrado para o período.</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
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
        title={`Log de Inconsistências: ${getCategoryLabel(selectedInconsistency)}`}
        actions={
          <button 
            onClick={exportInconsistencyCategory}
            disabled={inconsistencyLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-900 text-white rounded-lg shadow-sm text-sm font-semibold hover:bg-slate-800 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Download size={14} strokeWidth={2.5} /> 
            Exportação Detalhada
          </button>
        }
      >
        <div className="h-[75vh] flex flex-col">
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
