import React, { useState } from 'react';
import { Search, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// --- CUSTOM CONFIRM TOAST ---
export const confirmarAccion = (titulo: string, mensaje: string, onConfirm: () => void) => {
  toast((t) => (
    <div className="flex flex-col gap-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-black text-zinc-900">{titulo}</h4>
          <p className="text-sm text-zinc-600 mt-1 font-medium leading-tight">{mensaje}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-100">
        <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold rounded-lg text-xs transition-colors">Cancelar</button>
        <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className="px-4 py-2 bg-black text-white hover:bg-zinc-800 font-bold rounded-lg text-xs transition-colors shadow-md">Sí, Ejecutar</button>
      </div>
    </div>
  ), { duration: 8000, position: 'top-center', style: { maxWidth: '400px', padding: '16px', borderRadius: '16px' }});
};

export interface SearchableSelectProps<T> {
  value: string | number;
  options: T[];
  onChange: (val: number | string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  renderLabel?: (opt: T) => string;
  labelKey?: keyof T;
}

export const SearchableSelect = <T extends { id: number | string; nombre?: string; [key: string]: any }>({
  value,
  options,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  loading = false,
  renderLabel,
  labelKey = 'nombre'
}: SearchableSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const safeOptions = options || [];
  const selectedOption = safeOptions.find((opt) => String(opt.id) === String(value));
  
  const filteredOptions = safeOptions.filter((opt) => {
    const term = searchTerm.toLowerCase();
    const texto = renderLabel ? renderLabel(opt) : String(opt[labelKey] || opt.nombre || '');
    const idStr = opt.id ? opt.id.toString() : '';
    return texto.toLowerCase().includes(term) || idStr.includes(term);
  });

  const displayedOptions = filteredOptions.slice(0, 50);

  return (
    <div className="relative w-full">
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white focus:border-black focus:ring-1 focus:ring-black'}`}>
        <span className={selectedOption ? 'text-zinc-900 font-bold truncate pr-4' : 'text-zinc-400 truncate pr-4'}>
          {selectedOption ? (renderLabel ? renderLabel(selectedOption) : selectedOption.nombre) : placeholder}
        </span>
        {loading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus type="text" placeholder="Buscar por nombre o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {displayedOptions.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3 text-center">No hay resultados.</p>
              ) : (
                <>
                  {displayedOptions.map((opt: any) => (
                    <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${String(value) === String(opt.id) ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                      <span className="truncate pr-2">{renderLabel ? renderLabel(opt) : opt.nombre}</span>
                      <span className={`text-[10px] font-mono shrink-0 ${String(value) === String(opt.id) ? 'text-zinc-400' : 'text-zinc-400'}`}>ID: {opt.id}</span>
                    </button>
                  ))}
                  {filteredOptions.length > 50 && (
                    <p className="text-[10px] text-center text-zinc-400 font-bold p-2 bg-zinc-50 rounded-lg mt-1">
                      + {filteredOptions.length - 50} resultados más. Sé más específico.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};