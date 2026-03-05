import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, error, loginWithRedirect, continueAsGuest, getLinkAccountUrl } = useAuth();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    if (isGuestLoading) {
      return;
    }

    setIsGuestLoading(true);
    try {
      await continueAsGuest();
    } catch {
      // Error state is surfaced by auth context.
    } finally {
      setIsGuestLoading(false);
    }
  };

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
          <h1 className="text-xl font-semibold mb-2">Welcome to Writers Studio</h1>
          <p className="text-sm text-gray-600 mb-6">
            Continue with a guest account or sign in with your WebHatchery account.
            {error ? ` (${error})` : ''}
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isGuestLoading ? 'Creating guest account...' : 'Continue as Guest'}
            </button>
            <button
              type="button"
              onClick={loginWithRedirect}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign in with WebHatchery
            </button>
          </div>
          <p className="mt-5 text-sm text-gray-600">
            Need an account?{' '}
            <a href={getLinkAccountUrl()} className="text-blue-600 hover:text-blue-700 underline">
              Sign up and link your guest work
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
