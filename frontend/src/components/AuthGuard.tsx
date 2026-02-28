import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="text-sm">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="max-w-lg w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
          <p className="text-sm text-gray-600 mb-6">
            LitRPG Studio uses your Frontpage JWT session.
            {error ? ` (${error})` : ''}
          </p>
          <button
            type="button"
            onClick={loginWithRedirect}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
