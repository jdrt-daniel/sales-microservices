'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: (opts?: { showLoading?: boolean }) => Promise<void>;
}

export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(async (opts?: { showLoading?: boolean }) => {
    if (opts?.showLoading) {
      setLoading(true);
    }
    await fetcherRef.current().then(
      (result) => {
        setData(result);
        setError(null);
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      },
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetcherRef
      .current()
      .then(
        (result) => {
          setData(result);
          setError(null);
        },
        (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        },
      )
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, reload };
}