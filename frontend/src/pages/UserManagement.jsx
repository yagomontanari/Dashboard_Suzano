import { useState, useEffect } from 'react';
import { getAdminUsers, approveUser, rejectUser, updateUser, resetUserPassword, unlockUser } from '../services/api';
import { 
  UserCheck, 
  UserX, 
  Shield, 
  User as UserIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  RotateCcw, 
  Power,
  LockOpen
} from 'lucide-react';
import Modal from '../components/Modal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal de Aprovação / Reset (Exibe senha temporária)
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [pwdModalTitle, setPwdModalTitle] = useState('');
  const [pwdModalUser, setPwdModalUser] = useState('');

  // Modal de Edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', role: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      const res = await approveUser(userId);
      setTempPassword(res.temporary_password);
      setPwdModalUser(userName);
      setPwdModalTitle('Usuário Aprovado!');
      setShowPwdModal(true);
      fetchUsers();
    } catch (err) {
      alert('Falha ao aprovar usuário.');
    }
  };

  const handleReject = async (userId, userName) => {
    if (window.confirm(`Deseja reprovar a solicitação de ${userName}?`)) {
      try {
        await rejectUser(userId);
        fetchUsers();
      } catch (err) {
        alert('Falha ao reprovar usuário.');
      }
    }
  };

  const handleResetPassword = async (userId, userName) => {
    if (window.confirm(`Deseja resetar a senha de ${userName}? Uma nova senha temporária será gerada.`)) {
      try {
        const res = await resetUserPassword(userId);
        setTempPassword(res.temporary_password);
        setPwdModalUser(userName);
        setPwdModalTitle('Senha Resetada!');
        setShowPwdModal(true);
      } catch (err) {
        alert('Falha ao resetar senha.');
      }
    }
  };

  const handleUnlock = async (userId, userName) => {
    if (window.confirm(`Deseja desbloquear o acesso de ${userName}?`)) {
      try {
        await unlockUser(userId);
        fetchUsers();
      } catch (err) {
        alert('Falha ao desbloquear usuário.');
      }
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.active ? 'Inativar' : 'Ativar';
    if (window.confirm(`Deseja ${action} o usuário ${user.nome}?`)) {
      try {
        await updateUser(user.id, { active: !user.active });
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.detail || `Falha ao ${action} usuário.`);
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ nome: user.nome, email: user.email, role: user.role });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingUser.id, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao atualizar dados.');
    }
  };

  const getStatusBadge = (user) => {
    // 1. Verificar Bloqueio Temporal
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100">
            <XCircle className="h-3 w-3" />
            Bloqueado
          </span>
        );
    }

    // 2. Verificar Inatividade Manual
    if (!user.active) {
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-slate-100 text-slate-400">
            <Power className="h-3 w-3" />
            Inativo
          </span>
        );
    }

    // 3. Status Padrão
    const configs = {
      PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Pendente', icon: Clock },
      APPROVED: { color: 'bg-emerald-100 text-emerald-700', label: 'Aprovado', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-700', label: 'Recusado', icon: XCircle }
    };
    const config = configs[user.status] || configs.PENDING;
    const Icon = config.icon;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const isLocked = (user) => user.locked_until && new Date(user.locked_until) > new Date();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Aprove, edite ou gerencie permissões de acesso.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                        <div className="font-bold">{user.nome}</div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'}`}>
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(user)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {user.status === 'PENDING' ? (
                      <>
                        <button onClick={() => handleApprove(user.id, user.nome)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Aprovar">
                          <UserCheck className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleReject(user.id, user.nome)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Recusar">
                          <UserX className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {isLocked(user) && (
                          <button onClick={() => handleUnlock(user.id, user.nome)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Desbloquear Conta">
                            <LockOpen className="h-5 w-5" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleResetPassword(user.id, user.nome)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Resetar Senha">
                          <RotateCcw className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => handleToggleStatus(user)} 
                            className={`p-2 rounded-lg transition-colors ${user.active ? 'text-red-400 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                            title={user.active ? 'Inativar' : 'Ativar'}
                        >
                          <Power className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Senha Temporária */}
      <Modal isOpen={showPwdModal} onClose={() => setShowPwdModal(false)} title={pwdModalTitle}>
        <div className="p-8 text-center">
            <div className="bg-emerald-50 text-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10" />
            </div>
            <p className="text-slate-600 mb-6">
                Acesso processado para <strong>{pwdModalUser}</strong>. <br/>
                Envie a nova senha temporária:
            </p>
            <div className="bg-slate-100 p-5 rounded-xl font-mono text-3xl font-black text-slate-900 tracking-widest mb-8 border border-slate-200">
                {tempPassword}
            </div>
            <button onClick={() => setShowPwdModal(false)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors">
                Copiei a senha
            </button>
        </div>
      </Modal>

      {/* Modal de Edição */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Usuário">
        <form onSubmit={handleUpdateUser} className="p-8 space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label>
                <input 
                    type="text" 
                    value={editForm.nome}
                    onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perfil de Acesso</label>
                <select 
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="CONSULTA">CONSULTA (Apenas Visualização)</option>
                    <option value="ADMIN">ADMIN (Gestão Total)</option>
                </select>
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                    Salvar Alterações
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}
