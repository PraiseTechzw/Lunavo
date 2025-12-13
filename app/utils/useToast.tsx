/**
 * Toast Hook
 * Manages toast state and provides show/hide functions
 */

import { useState, useCallback } from 'react';
import Toast, { ToastType } from './toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      setToast({
        visible: true,
        message,
        type,
        duration,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const ToastComponent = () => (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onHide={hideToast}
    />
  );

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
};

