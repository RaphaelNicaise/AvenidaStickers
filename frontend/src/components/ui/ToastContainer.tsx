import React from 'react';
import Toast from './Toast';
import { type ToastNotification } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => onRemoveToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;