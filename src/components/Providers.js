'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/Toast';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
