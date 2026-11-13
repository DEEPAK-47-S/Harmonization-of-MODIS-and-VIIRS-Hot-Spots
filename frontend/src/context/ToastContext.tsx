import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-[#54785E] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-[#BD493C] shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-[#318C9B] shrink-0 mt-0.5" />,
  };

  const colorMap = {
    success: 'border-[#54785E]/30 bg-white text-[#252923]',
    error: 'border-[#BD493C]/30 bg-white text-[#252923]',
    info: 'border-[#318C9B]/30 bg-white text-[#252923]',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2 w-80 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start space-x-3 p-3.5 rounded-lg border shadow-float pointer-events-auto transition-all animate-in slide-in-from-right duration-150 ${colorMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#252923]">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-[#777970] mt-0.5 leading-relaxed line-clamp-3">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-[#777970] hover:text-[#252923] transition shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

