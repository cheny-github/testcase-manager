import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-900/20 text-red-400' : 'bg-blue-900/20 text-blue-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};