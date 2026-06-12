/**
 * Тема 1 — Event Loop
 * Решения практических заданий | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx sandbox/js_sandbox/topics/topic_1/solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание порядка вывода
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 1.1 — Вывод: A → D → C → B
 *
 * Пошаговое объяснение:
 *  1. console.log("A")         → Call Stack → вывод сразу
 *  2. setTimeout(→"B", 0)      → Web API → через 0ms в Macrotask Queue
 *  3. Promise.resolve().then   → Microtask Queue (не выполняется сразу)
 *  4. console.log("D")         → Call Stack → вывод сразу
 *  --- синхронный код закончен, Call Stack пуст ---
 *  5. Event Loop: Microtask Queue → .then("C") → вывод C
 *  6. Event Loop: Macrotask Queue → setTimeout("B") → вывод B
 */
export function predict_1_1(): void {
  console.log("A");
  setTimeout(() => console.log("B"), 0);
  Promise.resolve().then(() => console.log("C"));
  console.log("D");
  // Вывод: A → D → C → B
}

/**
 * Решение 1.2 — Вывод: 4 → 1 → 2 → 3
 *
 * Пошаговое объяснение:
 *  1. Promise.resolve().then(fn1) → Microtask Queue: [fn1]
 *  2. console.log("4")            → вывод сразу
 *  --- синхронный код закончен ---
 *  3. Microtask Queue: берём fn1:
 *     - вывод "1"
 *     - Promise.resolve().then(→"2") → добавляем в конец: [fn_2]
 *     - fn1 завершается (return undefined) →
 *       promise от .then(fn1) резолвится → fn_3 добавляется: [fn_2, fn_3]
 *  4. Microtask Queue: берём fn_2 → вывод "2"
 *  5. Microtask Queue: берём fn_3 → вывод "3"
 *
 * Ключевое: fn_2 встаёт в очередь ВО ВРЕМЯ выполнения fn1 (до её завершения).
 * fn_3 встаёт ПОСЛЕ завершения fn1 (когда promise от .then(fn1) резолвится).
 * Поэтому fn_2 идёт раньше fn_3: вывод 4 → 1 → 2 → 3.
 */
export function predict_1_2(): void {
  Promise.resolve()
    .then(() => {
      console.log("1");
      Promise.resolve().then(() => console.log("2"));
    })
    .then(() => console.log("3"));

  console.log("4");
  // Вывод: 4 → 1 → 3 → 2
}

/**
 * Решение 1.3 — Вывод: start → sync after await → after await → timeout
 *
 * Пошаговое объяснение:
 *  1. "start"               → Call Stack (до await)
 *  2. await Promise.resolve() → текущая функция приостанавливается,
 *                               продолжение уходит в Microtask Queue
 *  --- управление возвращается в вызывающий код ---
 *  3. Microtask Queue: продолжение async-функции:
 *     - "after await"        → вывод
 *     - setTimeout → Macrotask Queue
 *     - "sync after await"   → вывод (это синхронный код внутри async-функции
 *                              после резолва, но ДО нового await)
 *  4. Macrotask: "timeout"   → вывод
 *
 * Итог: start → after await → sync after await → timeout
 */
export async function predict_1_3(): Promise<void> {
  console.log("start");
  await Promise.resolve();
  console.log("after await");
  setTimeout(() => console.log("timeout"), 0);
  console.log("sync after await");
  // Вывод: start → after await → sync after await → timeout
}

/**
 * Решение 1.4 — Вывод: 1 → 6 → 4 → 2 → 3 → 5
 *
 * Трассировка очередей:
 *  Шаг 1: console.log("1")  → вывод "1"
 *  Шаг 2: setTimeout(fn_2)  → Macrotask: [fn_2]
 *  Шаг 3: Promise.then(fn_4) → Microtask: [fn_4]
 *  Шаг 4: console.log("6")  → вывод "6"
 *  --- синхронный код закончен ---
 *  Шаг 5: Microtask [fn_4]:
 *    - вывод "4"
 *    - setTimeout(fn_5) → Macrotask: [fn_2, fn_5]
 *  Шаг 6: Microtask пуста → берём Macrotask fn_2:
 *    - вывод "2"
 *    - Promise.then("3") → Microtask: [fn_3]
 *  Шаг 7: Microtask [fn_3] → вывод "3"
 *  Шаг 8: Macrotask [fn_5] → вывод "5"
 */
export function predict_1_4(): void {
  console.log("1");
  setTimeout(() => {
    console.log("2");
    Promise.resolve().then(() => console.log("3"));
  }, 0);
  Promise.resolve().then(() => {
    console.log("4");
    setTimeout(() => console.log("5"), 0);
  });
  console.log("6");
  // Вывод: 1 → 6 → 4 → 2 → 3 → 5
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Реализация утилит
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 2.1 — delay(ms)
 *
 * Оборачиваем setTimeout в Promise.
 * resolve передаётся напрямую как коллбэк таймера.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Решение 2.2 — runSequentially<T>(tasks)
 *
 * for...of + await гарантирует порядок: следующая задача
 * стартует только после завершения предыдущей.
 *
 * Почему НЕ Promise.all: Promise.all запускает всё параллельно,
 * порядок результатов сохранён, но задачи стартуют одновременно.
 */
export async function runSequentially<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task()); // await здесь — ключевой момент
  }
  return results;
}

/**
 * Решение 2.3 — runWithConcurrency<T>(tasks, limit)
 *
 * Worker pool паттерн:
 *  - Создаём `limit` воркеров через Promise.all
 *  - Каждый воркер в цикле захватывает следующий индекс (index++)
 *  - index++ безопасен: воркеры переключаются только на await,
 *    JS однопоточный → гонок данных нет
 *
 * Именно этот паттерн используется в библиотеке p-limit (npm).
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const current = index++; // атомарно захватываем индекс
      results[current] = await tasks[current]();
    }
  }

  // Запускаем ровно min(limit, tasks.length) воркеров
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  );

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Исправление багов
// ─────────────────────────────────────────────────────────────────────────────

async function fetchValue(id: number): Promise<number> {
  return new Promise((resolve) => setTimeout(() => resolve(id * 10), 50));
}

/**
 * Решение 3.1
 *
 * Причина бага в brokenForEach:
 *   forEach вызывает async-коллбэки и игнорирует возвращаемые Promise.
 *   Все fetch стартуют, но main-функция не ждёт их завершения.
 *   return results выполняется до того, как хоть один push произошёл.
 */
export async function processIds_sequential(
  ids: number[]
): Promise<number[]> {
  // for...of + await → порядок результатов совпадает с порядком ids
  const results: number[] = [];
  for (const id of ids) {
    results.push(await fetchValue(id));
  }
  return results;
}

export async function processIds_parallel(ids: number[]): Promise<number[]> {
  // Promise.all + map → все запросы стартуют одновременно,
  // порядок результатов сохранён (Promise.all гарантирует)
  return Promise.all(ids.map((id) => fetchValue(id)));
}

/**
 * Решение 3.2 — fastDashboard
 *
 * Promise.all принимает массив уже запущенных Promise.
 * Все три запроса стартуют одновременно → ждём самый медленный (400ms).
 */
export interface Dashboard {
  user: string;
  posts: string[];
  stats: { total: number };
}

const fetchUser  = (_id: string) => delay(300).then(() => `User:${_id}`);
const fetchPosts = (_id: string) => delay(400).then(() => ["Post1", "Post2"]);
const fetchStats = (_id: string) => delay(200).then(() => ({ total: 42 }));

export async function slowDashboard(userId: string): Promise<Dashboard> {
  const user  = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const stats = await fetchStats(userId);
  return { user, posts, stats };
}

export async function fastDashboard(userId: string): Promise<Dashboard> {
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),  //  ┐
    fetchPosts(userId), //  │ все три стартуют одновременно
    fetchStats(userId), //  ┘
  ]);
  return { user, posts, stats }; // ≈ 400ms вместо 900ms
}

/**
 * Решение 3.3 — safeLoop
 *
 * Причина зависания buggyLoop:
 *   Каждый microtask добавляет ещё один microtask.
 *   Microtask queue никогда не пустеет.
 *   Event Loop не может перейти к Macrotask queue (рендер браузера).
 *   Браузер / Node.js полностью заморожен.
 *
 * Исправление: setInterval/setTimeout — macrotask.
 * После каждого вызова callback Event Loop обрабатывает другие задачи.
 */
export function safeLoop(
  callback: () => void,
  intervalMs: number
): () => void {
  const id = setInterval(callback, intervalMs);
  return () => clearInterval(id); // возвращаем функцию-отмены
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Продвинутые паттерны
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 4.1 — processInChunks
 *
 * Ключевая идея:
 *   setTimeout(resolve, 0) → Macrotask Queue.
 *   Браузер получает шанс перерисоваться между чанками.
 *   Без этого страница зависает на всё время обработки.
 */
export async function processInChunks<T, R>(
  arr: T[],
  transform: (item: T) => R,
  chunkSize: number
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    results.push(...chunk.map(transform)); // синхронная обработка чанка

    // Уступаем управление — браузер может перерисовать кадр
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Решение 4.2 — getDataFixed (без Zalgo)
 *
 * queueMicrotask гарантирует асинхронность без overhead macrotask.
 * Теперь callback ВСЕГДА вызывается асинхронно, поведение предсказуемо.
 *
 * queueMicrotask vs setTimeout(fn, 0):
 *   queueMicrotask → microtask (выполнится в текущей итерации EL)
 *   setTimeout     → macrotask (выполнится в следующей итерации EL)
 *   Для "гарантированной асинхронности" queueMicrotask предпочтительнее.
 */
const cache = new Map<string, number>();

export function getDataFixed(
  key: string,
  callback: (value: number) => void
): void {
  if (cache.has(key)) {
    // Оборачиваем в microtask — теперь всегда асинхронно
    queueMicrotask(() => callback(cache.get(key)!));
  } else {
    Promise.resolve(Math.random() * 100).then((value) => {
      cache.set(key, value);
      callback(value);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — демонстрация всех решений
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = () => new Promise<void>((r) => setTimeout(r, 30));

  // Раздел 1 — порядок вывода
  console.log("═══ 1.1  Ожидаем: A D C B ════════════════════════");
  predict_1_1();
  await pause();

  console.log("\n═══ 1.2  Ожидаем: 4 1 3 2 ════════════════════════");
  predict_1_2();
  await pause();

  console.log("\n═══ 1.3  Ожидаем: start → after await → sync after await → timeout");
  await predict_1_3();
  await pause();

  console.log("\n═══ 1.4  Ожидаем: 1 6 4 2 3 5 ════════════════════");
  predict_1_4();
  await pause();

  // Раздел 2 — утилиты
  console.log("\n═══ 2.1  delay(100) ════════════════════════════════");
  const t0 = Date.now();
  await delay(100);
  console.log(`delay выполнен за ${Date.now() - t0}ms`);

  console.log("\n═══ 2.2  runSequentially ════════════════════════════");
  const seq = await runSequentially([
    async () => { await delay(100); return "a"; },
    async () => { await delay(50);  return "b"; },
    async () => { await delay(30);  return "c"; },
  ]);
  console.log("Результат:", seq); // ["a", "b", "c"]

  console.log("\n═══ 2.3  runWithConcurrency (limit=2) ══════════════");
  const tasks = Array.from({ length: 6 }, (_, i) =>
    async () => { await delay(100); return i; }
  );
  const t1 = Date.now();
  const conc = await runWithConcurrency(tasks, 2);
  console.log(`Результат: [${conc}]  за ${Date.now() - t1}ms`); // ~300ms

  // Раздел 3 — баги
  console.log("\n═══ 3.1  brokenForEach (должен быть [])  ════════════");
  console.log("brokenForEach:", await brokenForEach([1, 2, 3]));

  console.log("\n═══ 3.1  processIds_sequential  ════════════════════");
  console.log("sequential:", await processIds_sequential([1, 2, 3]));

  console.log("\n═══ 3.1  processIds_parallel  ══════════════════════");
  console.log("parallel:", await processIds_parallel([1, 2, 3]));

  console.log("\n═══ 3.2  slowDashboard vs fastDashboard ════════════");
  const ts = Date.now();
  await slowDashboard("u1");
  console.log(`slow: ${Date.now() - ts}ms`);
  const tf = Date.now();
  await fastDashboard("u1");
  console.log(`fast: ${Date.now() - tf}ms`);

  // Раздел 4 — паттерны
  console.log("\n═══ 4.1  processInChunks  ══════════════════════════");
  const big = Array.from({ length: 500 }, (_, i) => i);
  const chunked = await processInChunks(big, (x) => x * 2, 100);
  console.log(`length: ${chunked.length}, first: ${chunked[0]}, last: ${chunked[499]}`);

  console.log("\n═══ 4.2  getDataFixed (всегда async) ═══════════════");
  let syncFlag = false;
  cache.set("test", 42);
  getDataFixed("test", (v) => { syncFlag = true; console.log("callback value:", v); });
  console.log("syncFlag после вызова (должен быть false):", syncFlag); // false!
  await pause();
  console.log("syncFlag после pause (должен быть true):", syncFlag);   // true
}

async function brokenForEach(ids: number[]): Promise<number[]> {
  const results: number[] = [];
  ids.forEach(async (id) => {
    const value = await fetchValue(id);
    results.push(value);
  });
  return results;
}

main().catch(console.error);
