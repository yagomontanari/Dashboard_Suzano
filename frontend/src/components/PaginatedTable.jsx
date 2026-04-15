import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const formatDate = (value, includeTime = true) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    
    if (!includeTime) return `${dd}/${mm}/${yyyy}`;
    
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return value;
  }
};

const DATE_ONLY_KEYS = new Set(['data_emissao', 'valid_from']);
const DATE_TIME_KEYS = new Set(['dta_criacao', 'dta_envio_integracao', 'dta_alteracao']);

const formatCellValue = (key, value) => {
  if (DATE_ONLY_KEYS.has(key)) return formatDate(value, false);
  if (DATE_TIME_KEYS.has(key)) return formatDate(value, true);
  return value || '-';
};

export default function PaginatedTable({
  data,
  columns, // Array of { key: 'str', label: 'str' }
  loading,
  error,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  sortConfig, // { key: 'str', direction: 'asc'|'desc' }
  onSort // Function (key) => void
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const renderSortIcon = (key) => {
    if (!onSort) return null;
    if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-20 group-hover:opacity-60 transition-opacity" />;
    return sortConfig.direction === 'asc' ? 
        <ArrowUp size={14} className="ml-1 text-blue-600" /> : 
        <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-medium text-sm">Carregando dados da tabela...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-red-500">
        <AlertCircle className="mb-4" size={32} />
        <p className="font-medium text-sm font-bold">Erro ao carregar os dados.</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <p className="font-medium text-sm">Nenhum registro encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <div className="flex-1 overflow-auto border-b border-slate-200 custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-slate-100/95 backdrop-blur-sm border-b-2 border-slate-300">
              {columns.map((col) => (
                <th 
                    key={col.key} 
                    className={`py-3 px-4 font-bold text-slate-700 whitespace-nowrap group ${onSort ? 'cursor-pointer select-none' : ''} ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                    onClick={() => onSort && onSort(col.key)}
                >
                  <div className={`flex items-center ${col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    {renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row, i) => (
              <tr key={i} className={`hover:bg-slate-50 transition-colors ${loading ? 'opacity-50' : ''}`}>
                {columns.map((col) => {
                  const display = formatCellValue(col.key, row[col.key]);
                  const isExpanded = expandedRows.has(i);
                  const isErrorCol = col.key === 'erros';
                  
                  return (
                    <td 
                      key={col.key} 
                      className={`py-4 px-4 text-slate-600 align-middle ${col.align === 'center' ? 'text-center' : 'text-left'} ${isErrorCol ? 'min-w-[300px]' : 'truncate max-w-xs'}`} 
                    >
                      {isErrorCol ? (
                        <div className="flex flex-col items-center">
                          <div className={`text-sm ${isExpanded ? 'whitespace-pre-wrap text-left' : 'line-clamp-2 text-left'} leading-relaxed transition-all duration-300 w-full`}>
                            {display}
                          </div>
                          {display && display.toString().length > 60 && (
                            <button 
                              onClick={() => toggleRow(i)}
                              className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-blue-500 transition-colors bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap self-center"
                            >
                              {isExpanded ? (
                                <><ChevronUp size={10} strokeWidth={3} /> Ver menos</>
                              ) : (
                                <><ChevronDown size={10} strokeWidth={3} /> Ver mais</>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span title={display?.toString()}>{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Sticky with Destaque */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between px-8 py-5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="text-sm font-medium text-slate-500">
          <span>Total de <strong className="text-slate-800">{totalCount}</strong> registros</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">
            Página <strong className="text-slate-800">{currentPage}</strong> de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

PaginatedTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    align: PropTypes.oneOf(['left', 'center', 'right'])
  })).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  }),
  onSort: PropTypes.func
};
