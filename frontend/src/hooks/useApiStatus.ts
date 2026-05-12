import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { requiredEnv } from "../config/env";

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

    // Periodic checks every 60 seconds
    const interval = setInterval(checkApiStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    isChecking,
    lastCheck,
    checkApiStatus,
    baseUrl: requiredEnv("VITE_API_BASE_URL"),
  };
}
