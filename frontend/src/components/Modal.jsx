import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg border border-slate-200 rounded-2xl overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          <div className="flex items-center gap-3">
            {actions}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-0 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
};
