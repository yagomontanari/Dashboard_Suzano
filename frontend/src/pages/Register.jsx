import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerRequest } from '../services/api';
import { User, Mail, ArrowLeft } from 'lucide-react';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerRequest(nome, email);
      setSuccess('Sua solicitação foi enviada! O administrador entrará em contato assim que seu acesso for aprovado.');
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white p-8 text-center border-b border-slate-100">
            <img src="/logo/Tradelinks_Colorida.png" alt="Tradelinks" className="h-12 mx-auto mb-6 object-contain" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Solicitar Acesso</h2>
            <p className="text-slate-500 text-sm mt-1">Preencha os dados e aguarde a aprovação.</p>
        </div>
        
        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium">
                {success}
              </div>
              <Link to="/" className="inline-block text-blue-600 font-semibold hover:underline">
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="E-mail corporativo"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Solicitar Acesso'}
              </button>

              <div className="text-center">
                <Link to="/" className="text-slate-500 text-sm hover:text-slate-800 flex items-center justify-center gap-1 group">
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
