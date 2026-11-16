import { errorMessage } from "@patipaket/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

interface QueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
}

/**
 * Küçük bir veri çekme kancası: ilk yüklemede "loading", aşağı çekip yenilemede
 * "refreshing" durumunu verir ve ekran her odaklandığında veriyi sessizce tazeler.
 * `key` değiştiğinde (ör. filtre) sorgu yeniden çalışır.
 */
export function useQuery<T>(fetcher: () => Promise<T>, key: string, enabled = true) {
  const [state, setState] = useState<QueryState<T>>({ data: null, error: null, loading: enabled, refreshing: false });
  const fetcherRef = useRef(fetcher);
  const requestId = useRef(0);
  const loadedKey = useRef<string | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    const id = ++requestId.current;
    setState((current) => ({
      ...current,
      error: mode === "silent" ? current.error : null,
      loading: mode === "initial",
      refreshing: mode === "refresh",
    }));
    try {
      const data = await fetcherRef.current();
      if (id === requestId.current) setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      if (id !== requestId.current) return;
      setState((current) => ({
        // Sessiz tazeleme başarısız olursa eldeki veri ekranda kalır.
        data: mode === "initial" ? null : current.data,
        error: mode === "silent" && current.data ? null : errorMessage(error),
        loading: false,
        refreshing: false,
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const first = loadedKey.current !== key;
      loadedKey.current = key;
      void run(first ? "initial" : "silent");
    }, [enabled, key, run]),
  );

  return {
    ...state,
    refresh: useCallback(() => run("refresh"), [run]),
    reload: useCallback(() => run("initial"), [run]),
    setData: useCallback((data: T) => setState((current) => ({ ...current, data })), []),
  };
}
