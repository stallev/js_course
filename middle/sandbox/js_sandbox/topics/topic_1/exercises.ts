/**
 * Тема 1 — Event Loop
 * Практические задания | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx middle/sandbox/js_sandbox/topics/topic_1/exercises.ts
 *
 * Инструкция:
 *  1. Читай условие задания
 *  2. Запиши ответ / реализацию
 *  3. Раскомментируй вызов в секции ЗАПУСК и проверь результат
 *  4. Сверься с solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание порядка вывода
//
// Правило: перед запуском — запиши ответ в строку "// Вывод: ?"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — Базовый порядок: Call Stack → Microtask → Macrotask
 *
 * // Вывод: ?
 *
 * Объясни почему каждый console.log вызывается именно в этот момент.
 */
export function predict_1_1(): void {
  console.log("A");
  setTimeout(() => console.log("B"), 0);
  Promise.resolve().then(() => console.log("C"));
  console.log("D");
}

/**
 * Задание 1.2 — Вложенный Promise: когда встаёт в очередь вторая .then?
 *
 * // Вывод: ?
 */
export function predict_1_2(): void {
  Promise.resolve()
    .then(() => {
      console.log("1");
      // Этот Promise добавляется в microtask queue ЗДЕСЬ — в середине итерации.
      // Будет ли "2" перед "3" или после?
      Promise.resolve().then(() => console.log("2"));
    })
    .then(() => console.log("3"));

  console.log("4");
}

/**
 * Задание 1.3 — async/await: где находится "пауза"?
 *
 * // Вывод: ?
 *
 * Подсказка: await = продолжение уходит в microtask queue.
 */
export async function predict_1_3(): Promise<void> {
  console.log("start");
  await Promise.resolve();
  // Всё что после await — microtask. Что успеет выполниться раньше?
  console.log("after await");
  setTimeout(() => console.log("timeout"), 0);
  console.log("sync after await");
}

/**
 * Задание 1.4 — Сложный mix: setTimeout внутри .then и наоборот
 *
 * // Вывод: ?
 *
 * Нарисуй в комментарии состояние очередей на каждом шаге.
 * 1-6-4-2-3-5
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
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Реализация утилит
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 2.1 — delay(ms): Promise, резолвящийся через ms миллисекунд
 *
 * Использование:
 *   await delay(500);
 *   console.log("прошло 500ms");
 *
 * Подсказка: new Promise(resolve => setTimeout(resolve, ms))
 */
export function delay(ms: number): Promise<void> {
  // TODO: реализуй
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Задание 2.2 — runSequentially<T>(tasks)
 *
 * Запускает async-функции строго по очереди:
 * каждая следующая стартует ТОЛЬКО после завершения предыдущей.
 *
 * Пример:
 *   const tasks = [
 *     async () => { await delay(200); return "a"; },
 *     async () => { await delay(100); return "b"; },
 *   ];
 *   const result = await runSequentially(tasks);
 *   // result = ["a", "b"]  время ≈ 300ms (200 + 100)
 *
 * Подсказка: for...of + await  (не Promise.all — он параллельный!)
 */

export async function runSequentially<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  // TODO: реализуй
  return results;
}

/**
 * Задание 2.3 — runWithConcurrency<T>(tasks, limit)
 *
 * Запускает задачи параллельно, но одновременно не более `limit` штук.
 *
 * Пример: 6 задач по 100ms, limit = 2:
 *   Волна 1: задачи 0,1 → 100ms
 *   Волна 2: задачи 2,3 → 100ms
 *   Волна 3: задачи 4,5 → 100ms
 *   Итого ≈ 300ms  (vs 600ms последовательно, vs 100ms без лимита)
 *
 * Подсказка: паттерн "worker pool"
 *   - Запусти `limit` независимых воркеров (Promise.all)
 *   - Каждый воркер сам берёт следующий индекс из общего счётчика
 *   - index++ в JS безопасен: воркеры переключаются только на await
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  // TODO: реализуй worker pool
  const results: T[] = [];
  let index = 0;
  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Найди и исправь баг
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 3.1 — async/await внутри forEach
 *
 * BUG: функция возвращает [] вместо [10, 20, 30].
 *
 * Вопросы:
 *   1. Объясни ТОЧНО почему results пустой (что происходит с Promise?)
 *   2. Реализуй processIds_sequential через for...of (гарантированный порядок)
 *   3. Реализуй processIds_parallel через Promise.all (быстрее, порядок сохранён)
 */
async function fetchValue(id: number): Promise<number> {
  // Имитация сетевого запроса
  return new Promise((resolve) => setTimeout(() => resolve(id * 10), 50));
}

export async function brokenForEach(ids: number[]): Promise<number[]> {
  const results: number[] = [];

  // BUG: forEach запускает все async-коллбэки, но не ждёт их завершения
  ids.forEach(async (id) => {
    const value = await fetchValue(id);
    results.push(value);
  });

  return results; // всегда [] — push выполнится после return
}

export async function processIds_sequential(
  ids: number[]
): Promise<number[]> {
  // TODO: for...of + await → результаты в порядке ids
  const results: number[] = [];
  for (const id of ids) {
    results.push(await fetchValue(id));
  }
  return results;
}

export async function processIds_parallel(ids: number[]): Promise<number[]> {
  // TODO: Promise.all + .map → параллельно, результаты в порядке ids
  return Promise.all(ids.map(async (id) => await fetchValue(id)));
}

/**
 * Задание 3.2 — Promise.all вместо последовательных await
 *
 * BUG: три независимых запроса выполняются последовательно (~900ms).
 *
 * Реализуй fastDashboard с Promise.all → время ≈ max(300, 400, 200) = 400ms.
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
  // BUG: последовательно ≈ 300 + 400 + 200 = 900ms
  const user  = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const stats = await fetchStats(userId);
  return { user, posts, stats };
}

export async function fastDashboard(userId: string): Promise<Dashboard> {
  // TODO: Promise.all → ≈ 400ms
  return await Promise.all([fetchUser(userId), fetchPosts(userId), fetchStats(userId)]).then(([user, posts, stats]) => ({ user, posts, stats }));
}

/**
 * Задание 3.3 — Microtask starvation
 *
 * Прочитай функцию buggyLoop. НЕ ЗАПУСКАЙ её — зависнет Node.js!
 *
 * Вопросы:
 *   1. Объясни пошагово что происходит в очереди microtasks
 *   2. Почему браузер/Node.js зависает?
 *   3. Реализуй safeLoop через setTimeout, которая не блокирует Event Loop
 *
 * // Ответ на вопрос 1-2: ?
 */
export function buggyLoop(): void {
  // НЕ ЗАПУСКАТЬ — только читай и объясняй!
  function loop(): void {
    Promise.resolve().then(loop); // каждый microtask добавляет новый microtask
  }
  loop();
  // Microtask queue никогда не опустеет → macrotasks (рендер!) не получат управление
}

export function safeLoop(
  callback: () => void,
  intervalMs: number
): () => void {
  // TODO: реализуй через setInterval или рекурсивный setTimeout
  // Верни функцию-отмены (stop), которая прекратит выполнение
  // const id = setInterval(callback, intervalMs);
  // return () => clearInterval(id);
  let timerId: ReturnType<typeof setTimeout>;
  let isRunning = true;
  function loop() {
    if (isRunning) {
      timerId = setTimeout(loop, intervalMs);
      callback();
    }
  }

  loop();

  return () => {
    isRunning = false;
    clearTimeout(timerId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Продвинутые паттерны (практика из курса)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 4.1 — processInChunks
 *
 * Обработай большой массив порциями (чанками).
 * Между чанками отдавай управление Event Loop через setTimeout(0) —
 * браузер успевает перерисовать страницу, I/O-задачи не голодают.
 *
 * Пример:
 *   const arr = Array.from({ length: 1000 }, (_, i) => i);
 *   const result = await processInChunks(arr, x => x * 2, 100);
 *   // result = [0, 2, 4, ..., 1998]
 *   // 10 итераций по 100 элементов, между ними — пауза 0ms (macrotask)
 */
export async function processInChunks<T, R>(
  arr: T[],
  transform: (item: T) => R,
  chunkSize: number
): Promise<R[]> {
  // TODO:
  // 1. Накопи результаты
  // 2. Разбей на куски: for (let i = 0; i < arr.length; i += chunkSize)
  // 3. Обработай кусок синхронно: chunk.map(transform)
  // 4. Уступи управление: await new Promise(r => setTimeout(r, 0))
  const results: R[] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    for (const item of chunk) {
      results.push(transform(item));
    }
    console.log(results);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return results;
}

/**
 * Задание 4.2 — queueMicrotask: устрани Zalgo-антипаттерн
 *
 * BUG: getDataZalgo иногда вызывает callback синхронно (из кэша),
 * иногда асинхронно (из Promise). Такое поведение непредсказуемо.
 *
 * Например, этот код сломан:
 *
 *   let loaded = false;
 *   getDataZalgo("key", () => { loaded = true; });
 *   // Если кэш есть: loaded = true  (синхронно — неожиданно!)
 *   // Если кэша нет: loaded = false (асинхронно — ожидаемо)
 *   console.log(loaded); // true ИЛИ false — зависит от кэша!
 *
 * Реализуй getDataFixed: callback ВСЕГДА вызывается асинхронно (microtask).
 */
const cache = new Map<string, number>();

export function getDataZalgo(
  key: string,
  callback: (value: number) => void
): void {
  if (cache.has(key)) {
    // callback(cache.get(key)!); // BUG: синхронно!
    queueMicrotask(() => callback(cache.get(key)!));
  } else {
    Promise.resolve(Math.random() * 100).then((value) => {
      cache.set(key, value);
      callback(value);
    });
  }
}

export function getDataFixed(
  key: string,
  callback: (value: number) => void
): void {
  if (cache.has(key)) {
    // TODO: используй queueMicrotask чтобы callback всегда был async
    queueMicrotask(() => callback(cache.get(key)!));
  } else {
    Promise.resolve(Math.random() * 100).then((value) => {
      cache.set(key, value);
      callback(value);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — раскомментируй нужный блок
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // --- Раздел 1: предсказание вывода ---
  console.log("═══ 1.1 ═══════════════════════════════════════════");
  predict_1_1();
  await new Promise((r) => setTimeout(r, 20));

  console.log("\n═══ 1.2 ═══════════════════════════════════════════");
  predict_1_2();
  await new Promise((r) => setTimeout(r, 20));

  console.log("\n═══ 1.3 ═══════════════════════════════════════════");
  await predict_1_3();
  await new Promise((r) => setTimeout(r, 20));

  console.log("\n═══ 1.4 ═══════════════════════════════════════════");
  predict_1_4();
  await new Promise((r) => setTimeout(r, 20));

  // --- Раздел 2: реализации (раскомментируй после выполнения заданий) ---
  // const d = await delay(100).then(() => "delay ok");
  // console.log("\n═══ 2.1 delay:", d);

  // const seq = await runSequentially([
  //   async () => { await delay(100); return 1; },
  //   async () => { await delay(50); return 2; },
  //   async () => { await delay(30); return 3; },
  // ]);
  // console.log("\n═══ 2.2 runSequentially:", seq); // [1, 2, 3]

  // const tasks = Array.from({ length: 6 }, (_, i) =>
  //   async () => { await delay(100); return i; }
  // );
  // const conc = await runWithConcurrency(tasks, 2);
  // console.log("\n═══ 2.3 runWithConcurrency:", conc); // [0, 1, 2, 3, 4, 5]

  // --- Раздел 3: баги ---
  // console.log("\n═══ 3.1 brokenForEach:", await brokenForEach([1, 2, 3])); // []
  // console.log("    processIds_sequential:", await processIds_sequential([1, 2, 3]));
  // console.log("    processIds_parallel:",   await processIds_parallel([1, 2, 3]));

  // const t1 = Date.now();
  // await slowDashboard("user1");
  // console.log("\n═══ 3.2 slowDashboard:", Date.now() - t1, "ms");  // ~900ms
  // const t2 = Date.now();
  // await fastDashboard("user1");
  // console.log("    fastDashboard:", Date.now() - t2, "ms");         // ~400ms

  // --- Раздел 4: паттерны ---
  // const big = Array.from({ length: 500 }, (_, i) => i);
  // const chunks = await processInChunks(big, x => x * 2, 100);
  // console.log("\n═══ 4.1 processInChunks length:", chunks.length); // 500
}

// Запускаем main() только в Node.js (не в браузере)
if (typeof window === "undefined") {
  main().catch(console.error);
}
