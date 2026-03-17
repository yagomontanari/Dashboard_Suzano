import { FileText } from 'lucide-react';

export default function Relatorios() {
  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 w-full">
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">Geração de relatórios avançados</p>
      </div>
      
      <div className="flex-1 p-8">
        <div className="bg-white border border-slate-200 rounded-none p-12 flex flex-col items-center justify-center h-[50vh] shadow-[4px_4px_0px_#cbd5e1] max-w-4xl mx-auto">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
             <FileText size={48} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Módulo em Desenvolvimento</h2>
          <span className="text-slate-500 font-medium text-center max-w-md">
             Em breve você poderá extrair visões analíticas detalhadas e agrupar dados do fechamento em planilhas diretamente por aqui.
          </span>
        </div>
      </div>
    </div>
  );
}
