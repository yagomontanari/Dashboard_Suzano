import { useState, useEffect } from 'react';
import { getAdminUsers, approveUser, rejectUser } from '../services/api';
import { UserCheck, UserX, Shield, User as UserIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../components/Modal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal de Aprovação (Exibe senha temporária)
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [approvedUserName, setApprovedUserName] = useState('');

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
      setApprovedUserName(userName);
      setShowApproveModal(true);
      fetchUsers(); // Recarrega
    } catch (err) {
      alert('Falha ao aprovar usuário.');
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Tem certeza que deseja recusar este acesso?')) {
      try {
        await rejectUser(userId);
        fetchUsers();
      } catch (err) {
        alert('Falha ao recusar usuário.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Pendente', icon: Clock },
      APPROVED: { color: 'bg-emerald-100 text-emerald-700', label: 'Aprovado', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-700', label: 'Recusado', icon: XCircle }
    };
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Aprove ou gerencie o acesso de colaboradores ao dashboard.</p>
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
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
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
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleApprove(user.id, user.nome)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors title='Aprovar'"
                      >
                        <UserCheck className="h-5 w-5" />
                      </button>
                      <button 
                         onClick={() => handleReject(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors title='Recusar'"
                      >
                        <UserX className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">Processado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && !loading && (
          <div className="p-20 text-center text-slate-400 font-medium">
            Nenhuma solicitação encontrada.
          </div>
        )}
      </div>

      {/* Modal de Sucesso na Aprovação */}
      <Modal 
        isOpen={showApproveModal} 
        onClose={() => setShowApproveModal(false)}
        title="Usuário Aprovado!"
      >
        <div className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-6">
                O acesso para <strong>{approvedUserName}</strong> foi liberado. 
                Envie a senha temporária abaixo para o colaborador:
            </p>
            <div className="bg-slate-100 p-4 rounded-xl font-mono text-2xl font-black text-slate-800 tracking-wider mb-6 break-all">
                {tempPassword}
            </div>
            <button 
                onClick={() => setShowApproveModal(false)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
                Confirmado
            </button>
        </div>
      </Modal>
    </div>
  );
}
