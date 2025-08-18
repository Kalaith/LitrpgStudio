import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseClasses = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-all';
  const typeClasses = {
    success: 'bg-success-600 dark:bg-success-500',
    error: 'bg-red-600 dark:bg-red-500',
    warning: 'bg-warning-600 dark:bg-warning-500',
    info: 'bg-info-600 dark:bg-info-500'
  };

  return createPortal(
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {message}
    </div>,
    document.body
  );
};

interface ToastState {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration: number;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export { ToastContainer, Toast };
export default ToastContainer;
