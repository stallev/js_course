/**
 * Тема 3 — Scope и замыкания
 * Решения практических заданий | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx sandbox/js_sandbox/topics/topic_3/solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание вывода и поведения
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 1.1 — outer middle inner, затем ReferenceError для innerVal
 *
 * Scope chain: inner → middle → global. innerVal живёт только в inner.
 */
export function predict_1_1(): void {
  const outer = "outer";

  function middle() {
    const mid = "middle";

    function inner() {
      const innerVal = "inner";
      console.log(outer, mid, innerVal);
    }

    inner();
    try {
      // @ts-expect-error innerVal — block scope внутри inner
      console.log(innerVal);
    } catch (err) {
      console.log("outer не видит innerVal:", (err as Error).name);
    }
  }

  middle();
}

/**
 * Решение 1.2 — c1: 11, 12 | c2: 0 | c1 снова: 12
 *
 * Каждый makeCounter() создаёт своё лексическое окружение с отдельным count.
 */
export function predict_1_2(): void {
  function makeCounter(start: number) {
    let count = start;
    return {
      inc() {
        count++;
        return count;
      },
      get() {
        return count;
      },
    };
  }

  const c1 = makeCounter(10);
  const c2 = makeCounter(0);

  console.log("c1:", c1.inc(), c1.inc());
  console.log("c2:", c2.get());
  console.log("c1 снова:", c1.get());
}

/**
 * Решение 1.3 — [3, 3, 3]
 *
 * var i — одна переменная; к моменту вызова fn() цикл завершён, i === 3.
 */
export function predict_1_3(): void {
  const funcs: Array<() => number> = [];

  for (var i = 0; i < 3; i++) {
    funcs.push(() => i);
  }

  console.log(funcs.map((fn) => fn()));
}

/**
 * Решение 1.4 — count: 1, 1, 1, ... (renderCount всегда 0)
 *
 * renderCount захвачен при создании interval — классический stale closure.
 */
export function predict_1_4(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  const renderCount = 0;

  const id = setInterval(() => {
    setCount(renderCount + 1);
  }, 50);

  return () => clearInterval(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Реализация утилит
// ─────────────────────────────────────────────────────────────────────────────

export interface Counter {
  increment(): void;
  decrement(): void;
  value(): number;
}

export function makeCounter(initial = 0): Counter {
  let count = initial;

  return {
    increment() {
      count++;
    },
    decrement() {
      count--;
    },
    value() {
      return count;
    },
  };
}

export interface MemoStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface MemoizedFn<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  invalidate(...args: Parameters<T>): void;
  clear(): void;
  stats(): MemoStats;
}

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
    hitRate: hits + misses === 0 ? 0 : hits / (hits + misses),
  });

  return memoized as MemoizedFn<T>;
}

export interface User {
  id: number;
  name: string;
}

export interface UserStore {
  add(name: string): User;
  remove(id: number): void;
  getAll(): User[];
  subscribe(listener: (users: User[]) => void): () => void;
}

export function createUserStore(): UserStore {
  let users: User[] = [];
  let nextId = 1;
  const listeners = new Set<(users: User[]) => void>();

  function notify() {
    const snapshot = [...users];
    listeners.forEach((fn) => fn(snapshot));
  }

  return {
    add(name) {
      const user = { id: nextId++, name };
      users.push(user);
      notify();
      return user;
    },
    remove(id) {
      users = users.filter((u) => u.id !== id);
      notify();
    },
    getAll() {
      return [...users];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function once<T extends (...args: never[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  let called = false;
  let result: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<T>;
    }
    return result;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Исправление багов
// ─────────────────────────────────────────────────────────────────────────────

export function createHandlers_buggy(): Array<() => number> {
  const handlers: Array<() => number> = [];
  for (var i = 0; i < 3; i++) {
    handlers.push(() => i);
  }
  return handlers;
}

export function createHandlers_fixed(): Array<() => number> {
  const handlers: Array<() => number> = [];
  for (let i = 0; i < 3; i++) {
    handlers.push(() => i);
  }
  return handlers;
}

export function createProcessor_buggy() {
  let batchSize = 10;
  const capturedAtCreation = batchSize;

  return {
    setBatchSize(size: number) {
      batchSize = size;
    },
    processBatch(items: unknown[]) {
      return items.slice(0, capturedAtCreation);
    },
  };
}

export function createProcessor_fixed() {
  let batchSize = 10;

  return {
    setBatchSize(size: number) {
      batchSize = size;
    },
    processBatch(items: unknown[]) {
      return items.slice(0, batchSize);
    },
  };
}

type ClickHandler = () => void;
const analyticsListeners = new Set<ClickHandler>();

export function setupAnalytics_buggy(onClick: ClickHandler): void {
  const HUGE_DATA = new Array(1000).fill("x");
  const summary = HUGE_DATA.length;

  const handler = () => {
    console.log("items:", summary, "bytes:", HUGE_DATA.length);
    onClick();
  };

  analyticsListeners.add(handler);
}

export function setupAnalytics_fixed(onClick: ClickHandler): () => void {
  const summary = 1000;

  const handler = () => {
    console.log("items:", summary);
    onClick();
  };

  analyticsListeners.add(handler);

  return () => {
    analyticsListeners.delete(handler);
  };
}

export function triggerAnalyticsClick(): void {
  analyticsListeners.forEach((h) => h());
}

export function clearAnalyticsListeners(): void {
  analyticsListeners.clear();
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Продвинутые паттерны
// ─────────────────────────────────────────────────────────────────────────────

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function createRateLimiter(
  maxCalls: number,
  windowMs: number
): (fn: () => void) => boolean {
  const timestamps: number[] = [];

  return (fn: () => void): boolean => {
    const now = Date.now();
    while (timestamps.length > 0 && now - timestamps[0] >= windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= maxCalls) {
      return false;
    }

    timestamps.push(now);
    fn();
    return true;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — демонстрация всех решений
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  console.log("═══ 1.1 Scope Chain ═══════════════════════════════");
  predict_1_1();

  console.log("\n═══ 1.2 Два счётчика ═════════════════════════════");
  predict_1_2();

  console.log("\n═══ 1.3 var + замыкание (ожидаем [3,3,3]) ═══════");
  predict_1_3();

  console.log("\n═══ 1.4 Stale closure (ожидаем count: 1...) ═════");
  const stop = predict_1_4();
  await pause(350);
  stop();

  console.log("\n═══ 2.1 makeCounter ═════════════════════════════");
  const c = makeCounter(10);
  c.increment();
  c.increment();
  console.log(c.value());

  console.log("\n═══ 2.2 memoize ═════════════════════════════════");
  let calls = 0;
  const expensive = memoize((n: number) => {
    calls++;
    return n * 2;
  });
  console.log(expensive(5), expensive(5), "calls:", calls);
  console.log(expensive.stats());

  console.log("\n═══ 2.3 createUserStore ═════════════════════════");
  const store = createUserStore();
  store.add("Alice");
  store.add("Bob");
  console.log(store.getAll());

  console.log("\n═══ 2.4 once ════════════════════════════════════");
  let n = 0;
  const init = once(() => ++n);
  console.log(init(), init(), "n:", n);

  console.log("\n═══ 3.1 createHandlers ════════════════════════");
  console.log("buggy:", createHandlers_buggy().map((h) => h()));
  console.log("fixed:", createHandlers_fixed().map((h) => h()));

  console.log("\n═══ 3.2 processor ═══════════════════════════════");
  const buggy = createProcessor_buggy();
  buggy.setBatchSize(50);
  console.log("buggy len:", buggy.processBatch(Array(100).fill(0)).length, "(ожидается 10)");
  const fixed = createProcessor_fixed();
  fixed.setBatchSize(50);
  console.log("fixed len:", fixed.processBatch(Array(100).fill(0)).length, "(ожидается 50)");

  console.log("\n═══ 3.3 analytics cleanup ═══════════════════════");
  const cleanup = setupAnalytics_fixed(() => {});
  triggerAnalyticsClick();
  cleanup();
  clearAnalyticsListeners();

  console.log("\n═══ 4.1 compose ═════════════════════════════════");
  const process = compose(
    (s: string) => s + "!",
    (s: string) => s.toUpperCase(),
    (s: string) => s.trim()
  );
  console.log(process("  hello  "));

  console.log("\n═══ 4.2 rate limiter ════════════════════════════");
  const limit = createRateLimiter(2, 500);
  console.log("a:", limit(() => console.log("a")));
  console.log("b:", limit(() => console.log("b")));
  console.log("c blocked:", limit(() => console.log("c")));
}

main().catch(console.error);
