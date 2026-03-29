import { useState, useEffect, useCallback } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';

/**
 * Manages watchlist state and exposes toggle / check helpers.
 * Returns { watchedSymbols, toggle, isWatched, loading }
 */
export function useWatchlist() {
  const [watchedSymbols, setWatchedSymbols] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getWatchlist();
      const stocks = res.data?.watchlist || res.data?.stocks || [];
      setWatchedSymbols(new Set(stocks.map(s => s.symbol)));
    } catch {
      // silently ignore if not logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (symbol) => {
    const isIn = watchedSymbols.has(symbol);
    // Optimistic update
    setWatchedSymbols(prev => {
      const next = new Set(prev);
      isIn ? next.delete(symbol) : next.add(symbol);
      return next;
    });
    try {
      if (isIn) {
        await removeFromWatchlist(symbol);
      } else {
        await addToWatchlist(symbol);
      }
    } catch {
      // Rollback on error
      setWatchedSymbols(prev => {
        const next = new Set(prev);
        isIn ? next.add(symbol) : next.delete(symbol);
        return next;
      });
    }
  }, [watchedSymbols]);

  const isWatched = useCallback((symbol) => watchedSymbols.has(symbol), [watchedSymbols]);

  return { watchedSymbols, toggle, isWatched, loading };
}
