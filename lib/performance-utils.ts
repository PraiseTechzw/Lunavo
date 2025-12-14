/**
 * Performance Optimization Utilities - Lazy loading, pagination, caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginationOptions {
  pageSize: number;
  initialPage?: number;
}

export interface PaginationResult<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  error: Error | null;
}

/**
 * Hook for paginated data loading
 */
export function usePagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<T[]>,
  options: PaginationOptions
): PaginationResult<T> {
  const { pageSize, initialPage = 1 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(async (page: number, append: boolean = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const results = await fetchFunction(page, pageSize);
      
      if (!mountedRef.current) return;

      if (results.length < pageSize) {
        setHasMore(false);
      }

      if (append) {
        setData(prev => [...prev, ...results]);
      } else {
        setData(results);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, pageSize, loading]);

  useEffect(() => {
    loadPage(initialPage, false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPage(nextPage, true);
    }
  }, [currentPage, hasMore, loading, loadPage]);

  const refresh = useCallback(() => {
    setCurrentPage(initialPage);
    setHasMore(true);
    setData([]);
    loadPage(initialPage, false);
  }, [initialPage, loadPage]);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    refresh,
    error,
  };
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize expensive computations
 */
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  getKey?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Image optimization helper
 */
export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  // In production, this would use an image CDN or optimization service
  // For now, return the original URL
  if (width || height) {
    // Could append query params for image resizing service
    return url;
  }
  return url;
}

/**
 * Lazy load images
 */
export function useLazyImage(src: string | null): { source: string | null; loading: boolean } {
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setSource(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const img = new Image();
    
    img.onload = () => {
      setSource(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setSource(null);
      setLoading(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { source, loading };
}

/**
 * Virtual list helper for large lists
 */
export function getVisibleRange(
  scrollOffset: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - 5); // Buffer
  const end = Math.min(
    totalItems - 1,
    Math.ceil((scrollOffset + containerHeight) / itemHeight) + 5 // Buffer
  );

  return { start, end };
}

/**
 * Batch operations for performance
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

