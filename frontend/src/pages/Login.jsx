import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white p-10 text-center border-b border-slate-100 flex flex-col items-center gap-8">
            <div className="flex items-center justify-center">
                <img src="/logo/Tradelinks_Colorida.png" alt="Tradelinks" className="h-16 object-contain" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard Suzano</h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">Dashboard de Fechamento</p>
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
    </div>
  );
}
