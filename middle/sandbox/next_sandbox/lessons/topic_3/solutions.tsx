/**
 * Тема 3 — Scope и замыкания
 * Решения практических заданий | React / Next.js контекст
 *
 * Компоненты можно подключить на странице:
 *   src/app/lessons/topic_3/page.tsx
 */

"use client";

import { useState, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание
// ─────────────────────────────────────────────────────────────────────────────

export function predict_1_1(): void {
  const apiBase = "https://api.example.com";

  function buildUrl(path: string) {
    const version = "v1";

    return function resolve(query: string) {
      const qs = query ? `?${query}` : "";
      console.log(`${apiBase}/${version}${path}${qs}`);
    };
  }

  const getUsers = buildUrl("/users");
  getUsers("page=1");

  try {
    // @ts-expect-error version — function scope
    console.log(version);
  } catch (err) {
    console.log("resolve не видит version снаружи:", (err as Error).name);
  }
}

export function predict_1_2(): void {
  function createSlot(initial: number) {
    let value = initial;
    return {
      read: () => value,
      write: (next: number) => {
        value = next;
      },
    };
  }

  const slotA = createSlot(0);
  const slotB = createSlot(100);

  slotA.write(5);
  console.log("A:", slotA.read(), "B:", slotB.read());
}

export function predict_1_3(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  const renderCount = 0;

  const id = setInterval(() => {
    setCount(renderCount + 1);
  }, 80);

  setTimeout(() => clearInterval(id), 450);
  return () => clearInterval(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Cart store и mini useState
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  title: string;
  qty: number;
}

export interface CartStore {
  addItem(title: string): CartItem;
  removeItem(id: number): void;
  getItems(): CartItem[];
  subscribe(listener: (items: CartItem[]) => void): () => void;
}

/**
 * Решение 2.1 — модульный паттерн createCartStore
 */
export function createCartStore(): CartStore {
  let items: CartItem[] = [];
  let nextId = 1;
  const listeners = new Set<(items: CartItem[]) => void>();

  function notify() {
    const snapshot = [...items];
    listeners.forEach((fn) => fn(snapshot));
  }

  return {
    addItem(title) {
      const existing = items.find((i) => i.title === title);
      if (existing) {
        existing.qty++;
        notify();
        return existing;
      }
      const item = { id: nextId++, title, qty: 1 };
      items.push(item);
      notify();
      return item;
    },
    removeItem(id) {
      items = items.filter((i) => i.id !== id);
      notify();
    },
    getItems() {
      return [...items];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Решение 2.2 — createMiniUseState
 */
export function createMiniUseState<T>(initial: T): () => [T, (next: T) => void] {
  let state = initial;

  return () => [
    state,
    (next: T) => {
      state = next;
    },
  ];
}

/**
 * React-компонент: корзина на createCartStore
 */
export function CartStoreDemo() {
  const store = useMemo(() => createCartStore(), []);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(store.getItems());
    return store.subscribe(setItems);
  }, [store]);

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Cart Store (модульный паттерн)</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => store.addItem("Next.js Course")}
          className="px-3 py-1 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          Добавить курс
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => store.removeItem(items[0].id)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Удалить первый
          </button>
        )}
      </div>
      <ul className="text-sm space-y-1">
        {items.length === 0 ? (
          <li className="text-gray-500">Корзина пуста</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="font-mono p-1 bg-gray-50 rounded">
              {item.title} × {item.qty}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Stale closure и refs
// ─────────────────────────────────────────────────────────────────────────────

export function staleCounter_demo(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  const renderCount = 0;

  const id = setInterval(() => {
    setCount(renderCount + 1);
  }, 200);

  setTimeout(() => {
    clearInterval(id);
    console.log("Финальный count:", count);
  }, 1050);

  return () => clearInterval(id);
}

/**
 * Решение 3.1 — fixedCounter с функциональным updater
 */
export function fixedCounter(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  const id = setInterval(() => {
    setCount((prev) => prev + 1);
  }, 200);

  setTimeout(() => {
    clearInterval(id);
    console.log("Финальный count:", count);
  }, 1050);

  return () => clearInterval(id);
}

export interface SearchResult {
  id: number;
  title: string;
}

const searchBus = new Map<string, Set<(results: SearchResult[]) => void>>();

export function emitSearch(channel: string, results: SearchResult[]): void {
  searchBus.get(channel)?.forEach((handler) => handler(results));
}

export function leakySearchSubscription(
  channel: string,
  onResults: (results: SearchResult[]) => void
): void {
  if (!searchBus.has(channel)) searchBus.set(channel, new Set());
  searchBus.get(channel)!.add(onResults);
}

/**
 * Решение 3.2 — createSearchSubscription с cleanup
 */
export function createSearchSubscription(channel: string): {
  setQuery: (query: string) => void;
  getQuery: () => string;
  subscribe: (onResults: (results: SearchResult[]) => void) => () => void;
} {
  let query = "";

  if (!searchBus.has(channel)) searchBus.set(channel, new Set());

  return {
    setQuery(next) {
      query = next;
    },
    getQuery() {
      return query;
    },
    subscribe(onResults) {
      searchBus.get(channel)!.add(onResults);
      return () => searchBus.get(channel)!.delete(onResults);
    },
  };
}

/**
 * Решение 3.3 — createLatestRef (аналог useRef)
 */
export function createLatestRef<T>(initial: T): { current: T } {
  const box = { current: initial };
  return box;
}

/**
 * React-компонент: stale vs fixed counter
 */
export function StaleClosureDemo() {
  const [log, setLog] = useState<string[]>([]);

  const runFixed = () => {
    setLog([]);
    let count = 0;
    const lines: string[] = [];

    const setCount = (updater: (prev: number) => number) => {
      count = updater(count);
      lines.push(`functional: ${count}`);
    };

    const id = setInterval(() => {
      setCount((prev) => prev + 1);
      if (lines.length >= 5) {
        clearInterval(id);
        setLog(lines);
      }
    }, 100);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Stale Closure vs Functional Updater</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={runFixed}
          className="px-3 py-1 text-sm bg-teal-500 text-white rounded"
        >
          Fixed (prev =&gt; prev + 1)
        </button>
      </div>
      <ul className="text-xs font-mono space-y-1">
        {log.map((entry, i) => (
          <li key={i} className="p-1 bg-gray-50 rounded">
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — memoize и useMemo
// ─────────────────────────────────────────────────────────────────────────────

export interface MemoStats {
  hits: number;
  misses: number;
  size: number;
}

export interface MemoizedFn<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  invalidate(...args: Parameters<T>): void;
  clear(): void;
  stats(): MemoStats;
}

/**
 * Решение 4.1 — memoize из практического задания курса
 */
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T
): MemoizedFn<T> {
  const cache = new Map<string, ReturnType<T>>();
  let hits = 0;
  let misses = 0;

  const makeKey = (args: Parameters<T>) => JSON.stringify(args);

  function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = makeKey(args);
    if (cache.has(key)) {
      hits++;
      return cache.get(key)!;
    }
    misses++;
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }

  memoized.invalidate = (...args: Parameters<T>) => {
    cache.delete(makeKey(args));
  };

  memoized.clear = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };

  memoized.stats = (): MemoStats => ({
    hits,
    misses,
    size: cache.size,
  });

  return memoized as MemoizedFn<T>;
}

/**
 * Решение 4.2 — createMemoHook
 */
export function createMemoHook(): <T>(
  factory: () => T,
  deps: unknown[]
) => T {
  let lastDeps: string | null = null;
  let lastValue: unknown;

  return <T>(factory: () => T, deps: unknown[]): T => {
    const key = JSON.stringify(deps);
    if (key !== lastDeps) {
      lastDeps = key;
      lastValue = factory();
    }
    return lastValue as T;
  };
}

/**
 * React-компонент: memoize для фильтрации постов
 */
const DEMO_POSTS = [
  { id: 1, title: "React Hooks Guide" },
  { id: 2, title: "Next.js App Router" },
  { id: 3, title: "JavaScript Closures" },
];

export function MemoizeDemo() {
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<MemoStats | null>(null);

  const filterPosts = useMemo(
    () =>
      memoize((posts: typeof DEMO_POSTS, q: string) =>
        posts.filter((p) =>
          p.title.toLowerCase().includes(q.toLowerCase())
        )
      ),
    []
  );

  const results = filterPosts(DEMO_POSTS, query);

  const handleFilter = () => {
    filterPosts(DEMO_POSTS, query);
    setStats(filterPosts.stats());
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">memoize — фильтр постов</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
        className="px-3 py-1 border rounded text-sm w-full max-w-xs"
      />
      <button
        type="button"
        onClick={handleFilter}
        className="px-3 py-1 text-sm bg-teal-500 text-white rounded"
      >
        Фильтровать (с кэшем)
      </button>
      <ul className="text-sm">
        {results.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
      {stats && (
        <p className="text-xs font-mono text-gray-600">
          hits: {stats.hits}, misses: {stats.misses}, cache size: {stats.size}
        </p>
      )}
    </div>
  );
}
