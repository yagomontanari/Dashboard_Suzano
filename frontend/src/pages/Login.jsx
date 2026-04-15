import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, forgotPassword } from '../services/api';
import { Lock, User, Mail, ArrowLeft, Send } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(username, password);
      
      // Se precisar trocar senha, salvamos um token temporário e redirecionamos
      if (res.must_change_password) {
        localStorage.setItem('token_temp', res.access_token);
        navigate('/change-password');
        return;
      }

      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', res.role); // Para controle de sidebar
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else {
        setError('Ocorreu um erro ao realizar o login. Tente novamente mais tarde.');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgot(false);
        setForgotSuccess(false);
        setForgotEmail('');
      }, 5000);
    } catch (err) {
      setError('Erro ao solicitar recuperação. Verifique o e-mail informado.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white p-10 text-center border-b border-slate-100 flex flex-col items-center gap-8">
            <div className="flex items-center justify-center">
                <img src="/logo/Tradelinks_Colorida.png" alt="Tradelinks" className="h-16 object-contain" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Suzano TL Hub</h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">Dashboard de Performance e Dados</p>
            </div>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="E-mail"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Senha"
                required
              />
            </div>

            <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setShowForgot(true);
                  }}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  Esqueci minha senha
                </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors"
            >
              Login
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-slate-500 text-sm">
                    Ainda não tem acesso? {' '}
                    <button 
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        Solicitar Acesso
                    </button>
                </p>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Esqueci minha Senha */}
      {showForgot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Mail size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Recuperar Senha</h3>
                    <p className="text-slate-500 text-sm">Enviaremos uma senha temporária em seu e-mail.</p>
                </div>
            </div>

            {forgotSuccess ? (
                <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send size={32} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">E-mail Enviado!</h4>
                    <p className="text-sm">Se o e-mail informado estiver cadastrado, você receberá as instruções em instantes.</p>
                </div>
            ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail cadastrado</label>
                        <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="exemplo@suzano.com.br"
                            required
                        />
                    </div>
                    {error && <p className="text-red-600 text-xs font-medium">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForgot(false)}
                            className="flex-1 px-4 py-3 text-slate-600 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} /> Voltar
                        </button>
                        <button
                            type="submit"
                            disabled={forgotLoading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {forgotLoading ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
