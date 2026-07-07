/**
 * Тема 3 — Scope и замыкания
 * Практические задания | React / Next.js контекст
 *
 * Файл содержит TypeScript-упражнения, специфичные для стека React + Next.js.
 * Каждое задание — реальный паттерн, встречающийся в production-коде.
 *
 * Решения: sandbox/next_sandbox/lessons/topic_3/solutions.tsx
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание (scope chain и замыкания)
//
// Запиши ответ в комментарий // Вывод: ? перед запуском main().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — Scope Chain в nested helpers
 *
 * // Вывод: ?
 */
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
    // @ts-expect-error version — function scope внутри buildUrl
    console.log(version);
  } catch (err) {
    console.log("resolve не видит version снаружи:", (err as Error).name);
  }
}

/**
 * Задание 1.2 — Независимые замыкания (фабрика store)
 *
 * // Вывод: ?
 */
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

/**
 * Задание 1.3 — Stale closure (имитация useEffect с [])
 *
 * // Вывод: ?
 *
 * renderCount заморожен на 0 — как count с первого рендера React.
 */
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
// РАЗДЕЛ 2 — Модульный паттерн и client-side store
//
// Аналог zustand/redux-lite без библиотек — приватное состояние через замыкание.
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
 * Задание 2.1 — createCartStore()
 *
 * Client Component корзины: состояние инкапсулировано, снаружи только API.
 *
 * Контекст (React):
 *   const store = useMemo(() => createCartStore(), []);
 *   useEffect(() => store.subscribe(setItems), [store]);
 *
 * Пример:
 *   store.addItem("Next.js Course");
 *   store.getItems(); // [{ id: 1, title: "...", qty: 1 }]
 */
export function createCartStore(): CartStore {
  // TODO: items, nextId, listeners — всё приватно
  throw new Error("Not implemented");
}

/**
 * Задание 2.2 — createMiniUseState(initial)
 *
 * Упрощённая модель useState из курса — state «помнится» через замыкание.
 *
 * Пример:
 *   const usePair = createMiniUseState({ count: 0, name: "" });
 *   const [state, setState] = usePair();
 *   setState({ count: 1, name: "Alice" });
 *   usePair()[0]; // { count: 1, name: "Alice" }
 *
 * Важно: один вызов createMiniUseState = один слот состояния (как один useState).
 */
export function createMiniUseState<T>(initial: T): () => [T, (next: T) => void] {
  // TODO
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Stale closure и утечки в React-паттернах
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 3.1 — fixedCounter (функциональный updater)
 *
 * BUG в staleCounter_demo: count захвачен = 0, всегда setCount(1).
 *
 * Реализуй fixedCounter — count растёт 1, 2, 3, 4, 5.
 *
 * Контекст (React):
 *   useEffect(() => {
 *     const id = setInterval(() => setCount(prev => prev + 1), 1000);
 *     return () => clearInterval(id);
 *   }, []);
 */
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

export function fixedCounter(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  const id = setInterval(() => {
    // TODO: setCount(prev => prev + 1)
    throw new Error("Not implemented");
  }, 200);

  setTimeout(() => {
    clearInterval(id);
    console.log("Финальный count:", count);
  }, 1050);

  return () => clearInterval(id);
}

/**
 * Задание 3.2 — createSearchSubscription
 *
 * BUG в leakySearchSubscription: обработчик не удаляется → утечка + stale query.
 *
 * Реализуй createSearchSubscription:
 *   - subscribe(onResults) возвращает cleanup
 *   - getQuery() всегда возвращает актуальный query (через замыкание на ref-like объект)
 *
 * Контекст (React Client Component):
 *   useEffect(() => {
 *     const cleanup = search.subscribe(setResults);
 *     return cleanup;
 *   }, [search]);
 */
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

export function createSearchSubscription(channel: string): {
  setQuery: (query: string) => void;
  getQuery: () => string;
  subscribe: (onResults: (results: SearchResult[]) => void) => () => void;
} {
  // TODO: query в замыкании, subscribe с cleanup
  throw new Error("Not implemented");
}

/**
 * Задание 3.3 — createLatestRef(initial)
 *
 * Паттерн useRef для актуального значения без stale closure.
 *
 * Пример:
 *   const ref = createLatestRef("v1");
 *   const log = () => console.log(ref.current);
 *   ref.current = "v2";
 *   log(); // "v2" — не stale
 *
 * В React: useRef(value).current обновляется без ре-рендера.
 */
export function createLatestRef<T>(initial: T): { current: T } {
  // TODO: объект { current } в замыкании
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — memoize и useMemo-подобные паттерны
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
 * Задание 4.1 — memoize(fn) — практическое задание курса
 *
 * Используй для дорогого фильтра списка постов в Client Component.
 *
 * Пример:
 *   const filterPosts = memoize((posts: Post[], q: string) =>
 *     posts.filter(p => p.title.includes(q))
 *   );
 */
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T
): MemoizedFn<T> {
  // TODO: Map-кэш, invalidate, clear, stats
  throw new Error("Not implemented");
}

/**
 * Задание 4.2 — createMemoHook()
 *
 * Упрощённый useMemo: пересчитывает factory только при изменении deps.
 *
 * Пример:
 *   const useMemo = createMemoHook();
 *   const expensive = useMemo(() => compute(data), [data]);
 *   // повторный вызов с тем же data → из кэша
 *
 * deps сравниваются через JSON.stringify (достаточно для учебного примера).
 */
export function createMemoHook(): <T>(
  factory: () => T,
  deps: unknown[]
) => T {
  // TODO: lastDeps + lastValue в замыкании
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — раскомментируй нужный блок
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  console.log("═══ 1.1 predict_1_1 ═══════════════════════════════");
  predict_1_1();

  console.log("\n═══ 1.2 predict_1_2 ═══════════════════════════════");
  predict_1_2();

  console.log("\n═══ 1.3 stale closure demo ════════════════════════");
  predict_1_3();
  await pause(500);

  // --- Раздел 2 ---
  // console.log("\n═══ 2.1 createCartStore ═════════════════════════");
  // const cart = createCartStore();
  // cart.addItem("Next.js Course");
  // console.log(cart.getItems());

  // console.log("\n═══ 2.2 createMiniUseState ════════════════════════");
  // const useSlot = createMiniUseState({ n: 0 });
  // const [, set] = useSlot();
  // set({ n: 42 });
  // console.log(useSlot()[0]);

  // --- Раздел 3 ---
  // console.log("\n═══ 3.1 staleCounter ════════════════════════════");
  // staleCounter_demo();
  // await pause(1200);
  // console.log("\n═══ 3.1 fixedCounter ════════════════════════════");
  // fixedCounter();
  // await pause(1200);

  // console.log("\n═══ 3.3 createLatestRef ═══════════════════════════");
  // const ref = createLatestRef("v1");
  // const log = () => console.log(ref.current);
  // log();
  // ref.current = "v2";
  // log();

  // --- Раздел 4 ---
  // console.log("\n═══ 4.1 memoize ═════════════════════════════════");
  // let calls = 0;
  // const fn = memoize((x: number) => { calls++; return x * 2; });
  // console.log(fn(3), fn(3), calls, fn.stats());

  // console.log("\n═══ 4.2 createMemoHook ════════════════════════════");
  // const useMemo = createMemoHook();
  // let computeCalls = 0;
  // const factory = () => { computeCalls++; return 100; };
  // console.log(useMemo(factory, [1]));
  // console.log(useMemo(factory, [1]), "computeCalls:", computeCalls);
}

main().catch(console.error);
