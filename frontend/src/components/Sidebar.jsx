import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
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
      <div className="p-6 flex items-center gap-4 border-b border-slate-800 h-20">
        <div className="bg-blue-600 min-w-8 w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-white shadow-[2px_2px_0px_#1e1e1e] border border-blue-400">
          S
        </div>
        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <span className="font-bold tracking-wide whitespace-nowrap text-slate-100">Agente Suzano</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        <NavLink 
          to="/dashboard"
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
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
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
