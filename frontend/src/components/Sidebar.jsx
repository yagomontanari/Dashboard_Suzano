import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { getPendingUsersCount } from '../services/api';

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role === 'ADMIN') {
      const fetchCount = async () => {
        try {
          const res = await getPendingUsersCount();
          setPendingCount(res.count);
        } catch (err) {
          console.error("Erro ao buscar pendentes:", err);
        }
      };
      fetchCount();
      // Atualiza a cada 2 minutos
      const interval = setInterval(fetchCount, 120000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleLogout = () => {
    localStorage.clear(); // Limpa tudo (token, role, etc)
    navigate('/');
  };

  return (
    <aside 
      className={`bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] flex flex-col ${
        expanded ? 'w-64' : 'w-20'
      } relative sticky top-0 h-screen z-20 shrink-0`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-8 bg-blue-600 text-white p-1 rounded-full shadow-lg hover:bg-blue-500 transition-colors z-30"
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Brand */}
      <div className={`flex flex-col items-center justify-center border-b border-slate-800 transition-all duration-300 ${
        expanded ? 'p-10 h-48 gap-2' : 'p-6 h-28 gap-0'
      }`}>
        <div className={`bg-white rounded-xl shrink-0 flex items-center justify-center p-2 shadow-[4px_4px_0px_#1e1e1e] border border-slate-700 transition-all duration-300 ${
          expanded ? 'w-16 h-16' : 'w-10 h-10'
        }`}>
          <img 
            src={expanded ? "/logo/suzano-logo.png" : "/logo/suzano-logo-5.png"} 
            alt="Suzano" 
            className="w-full h-full object-contain" 
          />
        </div>
        <div className={`flex flex-col items-center transition-all duration-300 ${expanded ? 'opacity-100 mt-2' : 'opacity-0 h-0 overflow-hidden'}`}>
          <span className="font-black tracking-tighter whitespace-nowrap text-slate-100 text-lg">Dashboard Suzano</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-0.5">Controle e Monitoramento</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        <NavLink 
          to="/dashboard"
          title={!expanded ? "Dashboard" : ""}
          className={({ isActive }) => 
            `flex items-center gap-4 px-3 py-3 rounded-md transition-all group overflow-hidden whitespace-nowrap ${
              isActive 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
            }`
          }
        >
          <LayoutDashboard size={20} className="shrink-0" />
          <span className={`transition-all duration-300 font-medium ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            Dashboard
          </span>
        </NavLink>
        
        <NavLink 
          to="/relatorios"
          title={!expanded ? "Relatórios" : ""}
          className={({ isActive }) => 
            `flex items-center gap-4 px-3 py-3 rounded-md transition-all group overflow-hidden whitespace-nowrap ${
              isActive 
                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
            }`
          }
        >
          <FileText size={20} className="shrink-0" />
          <span className={`transition-all duration-300 font-medium ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            Relatórios
          </span>
        </NavLink>

        {role === 'ADMIN' && (
          <NavLink 
            to="/usuarios"
            title={!expanded ? "Gestão de Usuários" : ""}
            className={({ isActive }) => 
              `flex items-center gap-4 px-3 py-3 rounded-md transition-all group overflow-hidden whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
              }`
            }
          >
            <div className="relative">
              <Users size={20} className="shrink-0" />
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-lg border border-slate-900 animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className={`transition-all duration-300 font-medium ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              Gestão de Usuários
            </span>
          </NavLink>
        )}
      </nav>

      {/* Partner Logos */}
      <div className={`p-4 border-t border-slate-800 space-y-4 ${expanded ? 'block' : 'hidden'}`}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Powered by</p>
        <div className="flex flex-col items-center gap-3">
          <img src="/logo/Tradelinks_Colorida.png" alt="Tradelinks" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" />
          <img src="/logo/MGCS_Logo_Colorida.png" alt="MGCS" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* User Actions */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          title={!expanded ? "Sair" : ""}
          className="flex items-center gap-4 px-3 py-2 w-full rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors group overflow-hidden whitespace-nowrap"
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          <span className={`transition-all duration-300 font-medium ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
