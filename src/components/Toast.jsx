import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10B981" />;
      case 'warning':
        return <AlertCircle size={18} color="#F59E0B" />;
      default:
        return <Info size={18} color="var(--gt-primary)" />;
    }
  };

  return (
    <aside className="gt-toast" role="status" aria-live="polite">
      {getIcon()}
      <span>{toast.message}</span>
    </aside>
  );
};
