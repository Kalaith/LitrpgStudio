import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function useApiStatus() {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkApiStatus = async () => {
    setIsChecking(true);
    try {
      const isHealthy = await apiClient.healthCheck();
      setIsOnline(isHealthy);
      setLastCheck(new Date());
    } catch {
      setIsOnline(false);
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkApiStatus();

    // Periodic checks every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    isChecking,
    lastCheck,
    checkApiStatus,
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  };
}
