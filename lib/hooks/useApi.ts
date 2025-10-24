/**
 * Custom hooks for API operations
 * 
 * @fileoverview Reusable hooks for common API patterns
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API hook for data fetching
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Object with data, loading, error, and refetch function
 */
export const useApi = <T>(
  url: string | null,
  options: RequestInit = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for API mutations (POST, PUT, DELETE)
 * @returns Object with mutate function, loading, and error states
 */
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
};

/**
 * Hook for polling data at intervals
 * @param url - API endpoint URL
 * @param interval - Polling interval in milliseconds
 * @param options - Fetch options
 * @returns Object with data, loading, error, and stop/start functions
 */
export const usePolling = <T>(
  url: string | null,
  interval: number = 3000,
  options: RequestInit = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling || !url) return;

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, isPolling, url]);

  return { data, loading, error, startPolling, stopPolling, isPolling };
};
