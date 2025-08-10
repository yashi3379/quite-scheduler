import { useEffect, useCallback } from 'react'

// Simple debounce implementation to avoid lodash dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounced = ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T & { cancel: () => void }
  
  debounced.cancel = () => {
    clearTimeout(timeout)
  }
  
  return debounced
}

// 画像遅延読み込み
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(element)
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, options])
}

// デバウンス検索
export function useDebounceSearch(
  searchTerm: string,
  delay: number,
  callback: (term: string) => void
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCallback = useCallback(
    debounce((term: string) => callback(term), delay),
    [callback, delay]
  )

  useEffect(() => {
    debouncedCallback(searchTerm)
    return () => debouncedCallback.cancel()
  }, [searchTerm, debouncedCallback])
}

// メモリ使用量監視
export function useMemoryMonitoring() {
  useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576)
        
        if (usedMB > 100) { // 100MB以上使用時に警告
          console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`)
        }
      }

      const interval = setInterval(checkMemory, 30000) // 30秒ごと
      return () => clearInterval(interval)
    }
  }, [])
}

// バンドルサイズ最適化のための遅延読み込み
export { lazy } from 'react'

// パフォーマンス測定ユーティリティ
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}

// 非同期パフォーマンス測定
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}

// レンダリング最適化のためのメモ化ヘルパー
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  let lastResult: R
  let lastState: T
  
  return (state: T): R => {
    if (state !== lastState) {
      const newResult = selector(state)
      
      if (equalityFn) {
        if (!equalityFn(newResult, lastResult)) {
          lastResult = newResult
        }
      } else {
        lastResult = newResult
      }
      
      lastState = state
    }
    
    return lastResult
  }
}

// DOM操作の最適化
export function batchDOMUpdates(updates: () => void) {
  requestAnimationFrame(() => {
    updates()
  })
}

// 仮想スクロールのためのヘルパー
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  return { startIndex, endIndex }
}

// ネットワーク最適化
export function prefetchData(url: string) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  document.head.appendChild(link)
}

// キャッシュ管理
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private maxAge: number

  constructor(maxAge: number = 5 * 60 * 1000) { // デフォルト5分
    this.maxAge = maxAge
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}