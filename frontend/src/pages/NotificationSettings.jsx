import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Bell, 
  Mail, 
  Clock, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

const NotificationSettings = () => {
  const [recipients, setRecipients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Custom Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [recRes, schRes] = await Promise.all([
        api.get('/notifications/recipients'),
        api.get('/notifications/schedules')
      ]);
      setRecipients(recRes.data);
      setSchedules(schRes.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    
    try {
      const res = await api.post('/notifications/recipients', { email: newEmail });
      setRecipients([...recipients, res.data]);
      setNewEmail('');
      showToast('Destinatário adicionado');
    } catch (error) {
      showToast(error.response?.data?.detail || 'Erro ao adicionar destinatário', 'error');
    }
  };

  const handleDeleteRecipient = async (id) => {
    try {
      await api.delete(`/notifications/recipients/${id}`);
      setRecipients(recipients.filter(r => r.id !== id));
      showToast('Destinatário removido');
    } catch (error) {
      console.error(error);
      showToast('Erro ao remover destinatário', 'error');
    }
  };

  const handleToggleRecipient = async (id) => {
    try {
      await api.patch(`/notifications/recipients/${id}/toggle`);
      setRecipients(recipients.map(r => 
        r.id === id ? { ...r, active: !r.active } : r
      ));
      showToast('Status atualizado');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleUpdateSchedules = async () => {
    try {
      const updatedTimes = [...schedules.map(s => s.time)];
      if (!updatedTimes.includes(newTime)) {
          updatedTimes.push(newTime);
      }
      
      await api.post('/notifications/schedules', { times: updatedTimes });
      fetchData();
      showToast('Agendamentos atualizados');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar agendamentos', 'error');
    }
  };

  const handleSendManual = async () => {
    setIsSending(true);
    try {
      await api.post('/notifications/send-manual', {});
      showToast('Processo de notificação disparado!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao disparar notificação', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500 relative">
      
      {/* Custom Toast Component */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 ${
          toastMessage.type === 'success' ? 'bg-slate-800 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertCircle size={24} className="text-red-200" />}
          <span className="font-semibold">{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Bell className="text-blue-600" size={32} />
            Configurações de Notificação
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie destinatários e horários dos informativos automáticos.</p>
        </div>
        
        <button
          onClick={handleSendManual}
          disabled={isSending || recipients.length === 0}
          className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:shadow-none"
        >
          {isSending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          )}
          Disparar Agora
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Destinatários */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail className="text-blue-500" size={20} />
              Destinatários
            </h2>
          </div>
          
          <div className="p-6 flex-grow">
            <form onSubmit={handleAddRecipient} className="flex gap-2 mb-8">
              <div className="relative flex-grow">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="E-mail do stakeholder"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-slate-700"
                />
              </div>
              <button
                type="submit"
                className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl transition-all shadow-lg active:scale-95"
              >
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3">
              {recipients.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Mail className="mx-auto mb-3 opacity-20" size={48} />
                  <p className="text-sm">Nenhum destinatário cadastrado.</p>
                </div>
              ) : (
                recipients.map((r) => (
                  <div key={r.id} className={`flex items-center justify-between p-4 bg-white border rounded-2xl group transition-all ${
                    r.active ? 'border-slate-100 hover:border-blue-200 hover:shadow-md' : 'opacity-60 border-slate-200 bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                        r.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {r.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold leading-tight ${r.active ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{r.email}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${r.active ? 'text-blue-500' : 'text-slate-400'}`}>
                          {r.active ? 'Informativo Ativo' : 'Inativo / Suspenso'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRecipient(r.id)}
                        className={`p-2 rounded-xl transition-all ${
                          r.active 
                            ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' 
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        title={r.active ? "Inativar" : "Ativar"}
                      >
                        {r.active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteRecipient(r.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: Agendamentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Horários de Envio
            </h2>
          </div>
          
          <div className="p-6 flex-grow">
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <p className="text-blue-700 text-sm font-medium leading-relaxed">
                As notificações são disparadas automaticamente. Recomendamos <strong>08:00, 12:00</strong> e <strong>16:00</strong> para um acompanhamento executivo do fechamento.
              </p>
            </div>

            <div className="flex gap-3 mb-8">
              <div className="relative flex-grow">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-700 appearance-none transition-all cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = i.toString().padStart(2, '0');
                    return <option key={h} value={`${h}:00`}>{h}:00</option>;
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <Plus size={16} />
                </div>
              </div>
              <button
                onClick={handleUpdateSchedules}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                Adicionar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schedules.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400">
                  <p className="text-sm">Nenhum horário agendado.</p>
                </div>
              ) : (
                schedules.sort((a, b) => a.time.localeCompare(b.time)).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Clock size={16} />
                      </div>
                      <span className="font-bold text-slate-800 text-lg tracking-tight">{s.time}</span>
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                              const updatedTimes = schedules.filter(sch => sch.id !== s.id).map(sch => sch.time);
                              await api.post('/notifications/schedules', { times: updatedTimes });
                              fetchData();
                              showToast('Agendamento removido');
                            } catch (error) {
                              console.error(error);
                              showToast('Erro ao remover agendamento', 'error');
                            }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-slate-800 rounded-2xl text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="font-bold text-lg">Layout Premium Ativo</p>
            <p className="text-slate-400 text-sm">Os e-mails seguem o padrão visual executivo da Suzano.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
