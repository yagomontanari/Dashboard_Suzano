import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData, getInconsistenciasData } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Download, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import PaginatedTable from '../components/PaginatedTable';
import * as XLSX from 'xlsx';

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      default: return [{key: 'id', label: 'ID'}];
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    
    // Create multiple sheets
    const wb = XLSX.utils.book_new();
    
    const integracoes = [
      { Tipo: 'VK11 (Orçamento)', Sucesso: data.vk11.success, Pendente: data.vk11.pending, Erro: data.vk11.error, PendenteRetorno: 0 },
      { Tipo: 'ZAJUS (Ajustes)', Sucesso: data.zaju.success, Pendente: data.zaju.pending, Erro: data.zaju.error, PendenteRetorno: data.zaju.pending_return },
      { Tipo: 'ZVER (Pagamentos)', Sucesso: data.zver.success, Pendente: data.zver.pending, Erro: data.zver.error, PendenteRetorno: data.zver.pending_return }
    ];
    
    const inconsistencias = Object.entries(data.errors).map(([key, value]) => ({
      Cadastro: key.toUpperCase(),
      RegistrosComErro: value
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(integracoes), "Integrações");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inconsistencias), "Inconsistências");
    
    XLSX.writeFile(wb, `Fechamento_Suzano_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportInconsistencyCategory = async () => {
    if (!selectedInconsistency || totalCount === 0) return;
    try {
      setInconsistencyLoading(true);
      // Fetch ALL possible records for this category
      const result = await getInconsistenciasData(selectedInconsistency, 1, totalCount > 0 ? totalCount : 5000);
      const dataToExport = result.data || [];
      
      const columnsDef = getColumnsForCategory(selectedInconsistency);
      
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
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedData), selectedInconsistency.toUpperCase());
      XLSX.writeFile(wb, `Inconsistencias_${selectedInconsistency}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Erro ao exportar inconsistências", err);
      alert("Não foi possível exportar os dados completos.");
    } finally {
      setInconsistencyLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-blue-600"><RefreshCw size={32} /></div>
      </div>
    );
  }

  const chartData = [
    { name: 'VK11', Sucesso: data.vk11.success, Pendente: data.vk11.pending, Erro: data.vk11.error },
    { name: 'ZAJUS', Sucesso: data.zaju.success, Pendente: data.zaju.pending, Erro: data.zaju.error },
    { name: 'ZVER', Sucesso: data.zver.success, Pendente: data.zver.pending, Erro: data.zver.error }
  ];

  const totalErrors = Object.values(data.errors).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel de Fechamento</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Visão geral da integração de dados</p>
        </div>
        <div className="flex gap-4">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-[2px_2px_0px_#cbd5e1] transition-all font-bold text-sm">
            <RefreshCw size={16} strokeWidth={2.5} /> Atualizar
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 rounded shadow-[4px_4px_0px_#94a3b8] font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            <Download size={16} strokeWidth={2.5} /> Exportar Excel
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] w-full mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Visão Geral de Integrações</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Sucesso" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Erro" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Errors List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Inconsistências de Cadastro</h2>
            <div className="space-y-4">
              {Object.entries(data.errors).map(([key, value]) => {
                const isZero = value === 0;
                return (
                  <button 
                    key={key} 
                    onClick={() => handleOpenModal(key)}
                    disabled={isZero}
                    className="w-full text-left flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors group"
                  >
                    <span className="font-semibold text-slate-700 capitalize group-hover:text-blue-600 transition-colors">{key}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-[2px_2px_0px_#cbd5e1] border transition-transform ${
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
