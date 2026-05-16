import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onCancel} 
      className="max-w-[270px]"
      contentClassName="p-0"
    >
      <div className="flex flex-col text-center">
        <div className="p-5 pb-4">
            <h3 className="text-[17px] font-semibold text-text mb-1 leading-tight">{title}</h3>
            <p className="text-[13px] text-muted leading-snug">{message}</p>
        </div>

        <div className="flex border-t border-border">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 text-[17px] text-blue-500 font-normal hover:bg-hover transition-colors border-r border-border"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 text-[17px] text-red-500 font-semibold hover:bg-hover transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};
