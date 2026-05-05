import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight, 
  MapPin, Package, ClipboardCheck, Info, Filter, Zap
} from 'lucide-react';

const KPICard = ({ title, value, subValue, icon: Icon, trend, trendValue, color = "blue" }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-${color}-500/10 transition-colors`}></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-2xl border border-${color}-100/50`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {trendValue}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subValue}</span>
        </div>
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <p className="text-sm font-bold text-white">
              {entry.name}: <span className="text-blue-400">
                {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {suffix}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueIntelligence = ({ dateRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        });
        const response = await fetch(`/api/revenue-intelligence?${queryParams}`);
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching revenue intelligence:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const formattedTotals = useMemo(() => {
    if (!data?.totals) return {};
    return {
      revenue: data.totals.total_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      margin: `${data.totals.avg_margin.toFixed(1)}%`,
      agreements: data.totals.total_agreements,
      efficiency: `${data.totals.payment_efficiency.toFixed(1)}%`
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Processando Inteligência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          title="Faturamento Bruto" 
          value={formattedTotals.revenue} 
          subValue="Receita total no período" 
          icon={DollarSign} 
          color="blue"
        />
        <KPICard 
          title="Margem Média" 
          value={formattedTotals.margin} 
          subValue="Rentabilidade consolidada" 
          icon={TrendingUp} 
          color="emerald"
        />
        <KPICard 
          title="Eficiência de Pagamento" 
          value={formattedTotals.efficiency} 
          subValue="Acordado vs Liquidado" 
          icon={Zap} 
          color="amber"
        />
        <KPICard 
          title="Acordos Ativos" 
          value={formattedTotals.agreements} 
          subValue="Contratos em vigência" 
          icon={ClipboardCheck} 
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Regionais por Faturamento */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <MapPin size={16} className="text-blue-500" /> Performance por Regional
            </h3>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.regional_performance} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="region" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" radius={[0, 12, 12, 0]} barSize={24}>
                  {data?.regional_performance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Eficiência de Pagamento por Regional */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Target size={16} className="text-amber-500" /> Eficiência de Pagamento (Regional)
            </h3>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.regional_performance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="region" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                  unit="%"
                />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="efficiency" radius={[12, 12, 0, 0]} barSize={40}>
                  {data?.regional_performance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.efficiency > 90 ? '#10b981' : entry.efficiency > 70 ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Top Produtos - Receita vs Margem */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Package size={16} className="text-emerald-500" /> Matriz de Performance de Produtos
            </h3>
          </div>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="revenue" 
                  name="Receita" 
                  unit=" R$" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  label={{ value: 'Faturamento Bruto', position: 'bottom', fontSize: 10, fontWeight: 900, fill: '#94a3b8', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="margin" 
                  name="Margem" 
                  unit="%" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  label={{ value: 'Margem Bruta (%)', angle: -90, position: 'left', fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                />
                <ZAxis type="number" dataKey="revenue" range={[100, 1000]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Produtos" data={data?.top_products} fill="#3b82f6">
                  {data?.top_products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin > 30 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumo de Acordos por Verba */}
        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Zap size={16} className="text-blue-400" /> Utilização de Verba por Categoria
            </h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
              {data?.agreements_summary.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</p>
                    <p className="text-xs font-black text-white">{item.utilization.toFixed(1)}%</p>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        item.utilization > 90 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 
                        item.utilization > 70 ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 
                        'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      }`}
                      style={{ width: `${Math.min(item.utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                    <span>Acordado: {item.agreed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span>{item.count} Acordos</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Info size={16} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                  A eficiência global de pagamentos está em <span className="text-white font-bold">{formattedTotals.efficiency}</span>, 
                  indicando uma boa aderência aos acordos comerciais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueIntelligence;
