import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Calendar
} from 'lucide-react';
const toast = {
  success: (msg) => alert(`✅ ${msg}`),
  error: (msg) => alert(`❌ ${msg}`)
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NotificationSettings = () => {
  const [recipients, setRecipients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [recRes, schRes] = await Promise.all([
        axios.get(`${API_URL}/notifications/recipients`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/notifications/schedules`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRecipients(recRes.data);
      setSchedules(schRes.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/notifications/recipients`, 
        { email: newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecipients([...recipients, res.data]);
      setNewEmail('');
      toast.success('Destinatário adicionado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao adicionar destinatário');
    }
  };

  const handleDeleteRecipient = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notifications/recipients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipients(recipients.filter(r => r.id !== id));
      toast.success('Destinatário removido');
    } catch (error) {
      toast.error('Erro ao remover destinatário');
    }
  };

  const handleUpdateSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      // Por enquanto, simplificando: adiciona o novo horário se não existir
      const updatedTimes = [...schedules.map(s => s.time)];
      if (!updatedTimes.includes(newTime)) {
          updatedTimes.push(newTime);
      }
      
      await axios.post(`${API_URL}/notifications/schedules`, 
        { times: updatedTimes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
      toast.success('Agendamentos atualizados');
    } catch (error) {
      toast.error('Erro ao atualizar agendamentos');
    }
  };

  const handleSendManual = async () => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/notifications/send-manual`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Processo de notificação disparado!');
    } catch (error) {
      toast.error('Erro ao disparar notificação');
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
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
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
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          Disparar Agora
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Destinatários */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-bottom border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail className="text-blue-500" size={20} />
              Destinatários
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleAddRecipient} className="flex gap-2 mb-6">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="E-mail do stakeholder"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                className="p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                <Plus size={22} />
              </button>
            </form>

            <div className="space-y-3">
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="mx-auto mb-2 opacity-20" size={40} />
                  <p>Nenhum destinatário cadastrado.</p>
                </div>
              ) : (
                recipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {r.email[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-700">{r.email}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRecipient(r.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: Agendamentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-bottom border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Horários de Envio
            </h2>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
              <p className="text-blue-700 text-sm font-medium leading-relaxed">
                As notificações serão enviadas automaticamente nos horários configurados abaixo. Recomendamos <strong>08:00</strong> e <strong>16:00</strong> para acompanhamento do fechamento.
              </p>
            </div>

            <div className="flex gap-2 mb-8">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
              <button
                onClick={handleUpdateSchedules}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all"
              >
                Adicionar Horário
              </button>
            </div>

            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-500" size={20} />
                    <span className="font-black text-slate-800 text-xl tracking-tighter">{s.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-1 rounded uppercase tracking-wider">Ativo</span>
                    <button 
                        onClick={async () => {
                            const token = localStorage.getItem('token');
                            const updatedTimes = schedules.filter(sch => sch.id !== s.id).map(sch => sch.time);
                            await axios.post(`${API_URL}/notifications/schedules`, 
                                { times: updatedTimes },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            fetchData();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
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
