import PropTypes from 'prop-types';
import { Check, X } from 'lucide-react';

export default function PasswordRequirement({ password }) {
  const requirements = [
    { label: 'Pelo menos 12 caracteres', test: (pwd) => pwd.length >= 12 },
    { label: 'Uma letra maiúscula', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Uma letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Um número', test: (pwd) => /\d/.test(pwd) },
    { label: 'Um caractere especial (@, #, $...)', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2 space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requisitos de Segurança</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2">
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isMet ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {isMet ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
              </div>
              <span className={`text-xs font-medium ${isMet ? 'text-emerald-700' : 'text-slate-500'}`}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

PasswordRequirement.propTypes = {
  password: PropTypes.string.isRequired,
};
