/**
 * Тема 3 — Scope и замыкания
 * Практические задания | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx sandbox/js_sandbox/topics/topic_3/exercises.ts
 *
 * Инструкция:
 *  1. Читай условие задания
 *  2. Запиши ответ / реализацию
 *  3. Раскомментируй вызов в секции ЗАПУСК и проверь результат
 *  4. Сверься с solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание вывода и поведения
//
// Правило: перед запуском — запиши ответ в строку "// Вывод: ?"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — Scope Chain: матрёшка
 *
 * // Вывод: ?
 *
 * Объясни: почему inner видит outer, но outer не видит inner?
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
 * Задание 1.2 — Замыкание: два независимых счётчика
 *
 * // Вывод: ?
 *
 * Почему c1 и c2 не влияют друг на друга?
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
 * Задание 1.3 — Классическая ловушка: var + замыкание в цикле
 *
 * // Вывод: ?
 *
 * Подсказка: все функции захватывают ОДНУ переменную i.
 */
export function predict_1_3(): void {
  const funcs: Array<() => number> = [];

  for (var i = 0; i < 3; i++) {
    funcs.push(() => i);
  }

  console.log(funcs.map((fn) => fn()));
}

/**
 * Задание 1.4 — Stale closure в setInterval
 *
 * // Вывод: ?
 *
 * Имитация React: эффект с [] создаёт interval один раз.
 * renderCount «заморожен» на 0 — как count с первого рендера.
 * Почему count всегда 1, а не растёт?
 */
export function predict_1_4(): () => void {
  let count = 0;
  const setCount = (next: number | ((prev: number) => number)) => {
    count = typeof next === "function" ? next(count) : next;
    console.log("count:", count);
  };

  // «Первый рендер» — значение захвачено навсегда
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

/**
 * Задание 2.1 — makeCounter(initial)
 *
 * Каждый вызов makeCounter создаёт НОВОЕ замыкание с отдельным count.
 *
 * Пример:
 *   const c = makeCounter(5);
 *   c.increment(); c.increment();
 *   c.value(); // 7
 */
export function makeCounter(initial = 0): Counter {
  // TODO
  throw new Error("Not implemented");
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

/**
 * Задание 2.2 — memoize(fn)
 *
 * Практическое задание из курса. Кэш через замыкание (Map).
 *
 * Пример:
 *   const fib = memoize((n: number) => n <= 1 ? n : fib(n - 1) + fib(n - 2));
 *   fib(40);
 *   fib.stats(); // { hits: N, misses: 41, size: 41, hitRate: ~0.97 }
 *   fib.invalidate(40);
 *   fib.clear();
 */
export function memoize<T extends (...args: never[]) => unknown>(
  fn: T
): MemoizedFn<T> {
  // TODO: cache Map, hits/misses, методы invalidate/clear/stats
  throw new Error("Not implemented");
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

/**
 * Задание 2.3 — createUserStore()
 *
 * Модульный паттерн: users и nextId приватны, доступ только через API.
 *
 * Пример:
 *   const store = createUserStore();
 *   store.add("Alice");
 *   store.getAll(); // [{ id: 1, name: "Alice" }]
 *   const unsub = store.subscribe(users => console.log(users.length));
 *   store.add("Bob"); // listener вызван с 2 пользователями
 *   unsub();
 */
export function createUserStore(): UserStore {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 2.4 — once(fn)
 *
 * Возвращает функцию, которая вызывает fn только при первом вызове.
 * Повторные вызовы возвращают результат первого вызова.
 *
 * Пример:
 *   let n = 0;
 *   const init = once(() => ++n);
 *   init(); // 1
 *   init(); // 1 (fn не вызывается снова)
 */
export function once<T extends (...args: never[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  // TODO
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Найди и исправь баг
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 3.1 — createHandlers: var в цикле
 *
 * BUG: все handler'ы возвращают 3.
 *
 * Реализуй createHandlers_fixed двумя способами (выбери один):
 *   A) let i в цикле
 *   B) IIFE: (function(j) { ... })(i)
 */
export function createHandlers_buggy(): Array<() => number> {
  const handlers: Array<() => number> = [];
  for (var i = 0; i < 3; i++) {
    handlers.push(() => i);
  }
  return handlers;
}

export function createHandlers_fixed(): Array<() => number> {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 3.2 — Stale closure в async-обработчике
 *
 * BUG: processBatch всегда использует batchSize = 10, даже после setBatchSize(50).
 *
 * Вопросы:
 *   1. Почему замыкание «застыло» на 10?
 *   2. Реализуй createProcessor_fixed — читает актуальный batchSize через getter.
 */
export function createProcessor_buggy() {
  let batchSize = 10;
  // BUG: batchSize «заморожен» при создании фабрики
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
      // TODO: используй batchSize напрямую, без «заморозки» в captured
      throw new Error("Not implemented");
    },
  };
}

/**
 * Задание 3.3 — Утечка памяти: обработчик держит большой объект
 *
 * BUG: handler захватывает HUGE_DATA целиком, хотя использует только summary.
 *
 * Реализуй setupAnalytics_fixed:
 *   - захватывай только summary (число)
 *   - верни cleanup для removeEventListener
 */
type ClickHandler = () => void;
const analyticsListeners = new Set<ClickHandler>();

export function setupAnalytics_buggy(onClick: ClickHandler): void {
  const HUGE_DATA = new Array(1000).fill("x");
  const summary = HUGE_DATA.length;

  const handler = () => {
    console.log("items:", summary, "bytes:", HUGE_DATA.length); // держит HUGE_DATA
    onClick();
  };

  analyticsListeners.add(handler);
}

export function setupAnalytics_fixed(onClick: ClickHandler): () => void {
  // TODO: только summary в замыкании + cleanup
  throw new Error("Not implemented");
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

/**
 * Задание 4.1 — compose(...fns)
 *
 * Композиция функций справа налево: compose(f, g, h)(x) === f(g(h(x)))
 *
 * Пример:
 *   const process = compose(
 *     (s: string) => s + "!",
 *     (s: string) => s.toUpperCase(),
 *     (s: string) => s.trim(),
 *   );
 *   process("  hello  "); // "HELLO!"
 */
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 4.2 — createRateLimiter(maxCalls, windowMs)
 *
 * Ограничивает число вызовов fn за скользящее окно через замыкание.
 *
 * Пример:
 *   const limiter = createRateLimiter(3, 1000);
 *   limiter(() => console.log("ok")); // ok
 *   limiter(() => console.log("ok")); // ok
 *   limiter(() => console.log("ok")); // ok
 *   limiter(() => console.log("blocked")); // false, fn не вызвана
 *
 * Возвращает (fn) => boolean — true если fn вызвана, false если лимит превышен.
 */
export function createRateLimiter(
  maxCalls: number,
  windowMs: number
): (fn: () => void) => boolean {
  // TODO: массив timestamps в замыкании
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — раскомментируй нужный блок
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  // --- Раздел 1: предсказание ---
  console.log("═══ 1.1 Scope Chain ═══════════════════════════════");
  predict_1_1();

  console.log("\n═══ 1.2 Два счётчика ═════════════════════════════");
  predict_1_2();

  console.log("\n═══ 1.3 var + замыкание ══════════════════════════");
  predict_1_3();

  console.log("\n═══ 1.4 Stale closure ════════════════════════════");
  const stop = predict_1_4();
  await pause(350);
  stop();

  // --- Раздел 2 ---
  // console.log("\n═══ 2.1 makeCounter ═════════════════════════════");
  // const c = makeCounter(10);
  // c.increment(); c.increment();
  // console.log(c.value()); // 12

  // console.log("\n═══ 2.2 memoize ═════════════════════════════════");
  // let calls = 0;
  // const expensive = memoize((n: number) => { calls++; return n * 2; });
  // console.log(expensive(5), expensive(5), calls); // 10, 10, 1
  // console.log(expensive.stats());

  // console.log("\n═══ 2.3 createUserStore ═════════════════════════");
  // const store = createUserStore();
  // store.add("Alice");
  // console.log(store.getAll());

  // console.log("\n═══ 2.4 once ════════════════════════════════════");
  // let n = 0;
  // const init = once(() => ++n);
  // console.log(init(), init(), n); // 1, 1, 1

  // --- Раздел 3 ---
  // console.log("\n═══ 3.1 createHandlers ════════════════════════");
  // console.log("buggy:", createHandlers_buggy().map(h => h()));
  // console.log("fixed:", createHandlers_fixed().map(h => h()));

  // console.log("\n═══ 3.2 processor ═══════════════════════════════");
  // const buggy = createProcessor_buggy();
  // buggy.setBatchSize(50);
  // console.log("buggy len:", buggy.processBatch(Array(100).fill(0)).length);
  // const fixed = createProcessor_fixed();
  // fixed.setBatchSize(50);
  // console.log("fixed len:", fixed.processBatch(Array(100).fill(0)).length);

  // console.log("\n═══ 3.3 analytics cleanup ═══════════════════════");
  // const cleanup = setupAnalytics_fixed(() => {});
  // triggerAnalyticsClick();
  // cleanup();
  // clearAnalyticsListeners();

  // --- Раздел 4 ---
  // console.log("\n═══ 4.1 compose ═════════════════════════════════");
  // const process = compose(
  //   (s: string) => s + "!",
  //   (s: string) => s.toUpperCase(),
  //   (s: string) => s.trim(),
  // );
  // console.log(process("  hello  "));

  // console.log("\n═══ 4.2 rate limiter ════════════════════════════");
  // const limit = createRateLimiter(2, 500);
  // console.log(limit(() => console.log("a"))); // true
  // console.log(limit(() => console.log("b"))); // true
  // console.log(limit(() => console.log("c"))); // false
}

if (typeof window === "undefined") {
  main().catch(console.error);
}
