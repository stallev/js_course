/**
 * Тема 1 — Event Loop
 * Практические задания | React / Next.js контекст
 *
 * Файл содержит TypeScript-упражнения, специфичные для стека React + Next.js.
 * Каждое задание — реальный паттерн, встречающийся в production-коде.
 *
 * Решения: sandbox/next_sandbox/lessons/topic_1/solutions.tsx
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Promise.all в Server Components (Next.js App Router)
//
// В Next.js Server Components данные можно фетчить прямо в компоненте.
// Задача — делать это эффективно.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — Параллельный fetch в Server Component
 *
 * Ниже — функция, имитирующая получение данных для страницы профиля.
 * BUG: данные загружаются последовательно (~850ms).
 *
 * Вопросы:
 *   1. Какое общее время выполнения slowProfile? Объясни.
 *   2. Перепиши fastProfile с Promise.all → время ≈ max из трёх запросов.
 *   3. Что произойдёт если один из запросов упадёт с ошибкой в Promise.all?
 *      Как изменить код чтобы остальные данные всё равно вернулись?
 */
const mockDelay = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

export async function fetchUserProfile(id: string) {
  await mockDelay(300);
  return { id, name: "Alice", email: "alice@example.com" };
}
export async function fetchUserPosts(userId: string) {
  await mockDelay(400);
  return [{ id: 1, title: "Hello World" }, { id: 2, title: "Second Post" }];
}
export async function fetchUserFollowers(userId: string) {
  await mockDelay(150);
  return { count: 42 };
}

// BUG: последовательно ≈ 300 + 400 + 150 = 850ms
export async function slowProfile(userId: string) {
  const user      = await fetchUserProfile(userId);
  const posts     = await fetchUserPosts(userId);
  const followers = await fetchUserFollowers(userId);
  return { user, posts, followers };
}

// TODO 1: переписать с Promise.all → ≈ 400ms
export async function fastProfile(userId: string) {
  throw new Error("Not implemented");
}

// TODO 2: переписать с Promise.allSettled → частичный результат при ошибке
export async function resilientProfile(userId: string) {
  // Hint: Promise.allSettled не бросает при ошибке отдельного запроса
  // Каждый результат: { status: "fulfilled", value } | { status: "rejected", reason }
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Stale Closure в React hooks
//
// Самая частая причина багов с useEffect и асинхронным кодом в React.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 2.1 — Stale closure в setInterval
 *
 * Ниже — логика React-компонента, упрощённая до чистого TypeScript.
 * BUG: counter растёт только до 1, потом застревает.
 *
 * Вопросы:
 *   1. Объясни почему count всегда равен 0 внутри интервала.
 *   2. Реализуй fixedCounter используя функциональный updater.
 *   3. Что такое "stale closure"? Как deps array в useEffect связан с этим?
 *
 * Контекст (React-компонент с этим багом):
 *   function Counter() {
 *     const [count, setCount] = useState(0);
 *     useEffect(() => {
 *       const id = setInterval(() => setCount(count + 1), 1000);
 *       return () => clearInterval(id);
 *     }, []); // [] → эффект не обновляется → count всегда 0 в замыкании
 *   }
 */
export function staleClosure_demo(): () => void {
  // Имитируем useState: замкнутая переменная
  let count = 0;
  const setCount = (updater: number | ((prev: number) => number)) => {
    count = typeof updater === "function" ? updater(count) : updater;
    console.log("count:", count);
  };

  // BUG: count захвачен = 0 в момент создания setInterval
  const buggyId = setInterval(() => {
    setCount(count + 1); // count всегда 0 → всегда setCount(1)
  }, 200);

  // Остановка через 1 секунду
  setTimeout(() => {
    clearInterval(buggyId);
    console.log("Финальный count:", count); // всегда 1, не 5!
  }, 1050);

  return () => clearInterval(buggyId);
}

// TODO: реализуй fixedCounter — count должен корректно расти 1, 2, 3, 4, 5
export function fixedCounter(): () => void {
  let count = 0;
  const setCount = (updater: number | ((prev: number) => number)) => {
    count = typeof updater === "function" ? updater(count) : updater;
    console.log("count:", count);
  };

  // TODO: используй функциональный updater: setCount(prev => prev + 1)
  const id = setInterval(() => {
    // TODO: исправь здесь
    throw new Error("Not implemented");
  }, 200);

  setTimeout(() => {
    clearInterval(id);
    console.log("Финальный count:", count); // должно быть 5
  }, 1050);

  return () => clearInterval(id);
}

/**
 * Задание 2.2 — Cleanup в useEffect
 *
 * Ниже — паттерн подписки на события с потенциальной утечкой памяти.
 *
 * Вопросы:
 *   1. Что происходит если не вернуть cleanup из useEffect?
 *   2. Реализуй createEventSubscription с корректным cleanup.
 *   3. Почему "большие данные" опасны в замыканиях обработчиков?
 *
 * Контекст (React):
 *   useEffect(() => {
 *     const cleanup = createEventSubscription(userId, onNewMessage);
 *     return cleanup; // React вызовет при размонтировании
 *   }, [userId]);
 */
export interface Message {
  id: number;
  text: string;
  userId: string;
}

// Имитация WebSocket / EventEmitter
const eventBus = new Map<string, Set<(msg: Message) => void>>();

export function emit(channel: string, msg: Message): void {
  eventBus.get(channel)?.forEach((handler) => handler(msg));
}

// BUG: нет cleanup → каждый вызов добавляет обработчик, старые не удаляются
export function leakySubscription(
  userId: string,
  onMessage: (msg: Message) => void
): void {
  const channel = `user:${userId}`;
  if (!eventBus.has(channel)) eventBus.set(channel, new Set());
  eventBus.get(channel)!.add(onMessage); // добавляем, но никогда не удаляем
}

// TODO: реализуй корректную подписку, возвращающую функцию-отмены
export function createEventSubscription(
  userId: string,
  onMessage: (msg: Message) => void
): () => void {
  // TODO: подпишись на канал `user:${userId}` и верни cleanup-функцию
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — React 18: автоматический батчинг и queueMicrotask
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 3.1 — Понимание батчинга React 18
 *
 * React 18 использует queueMicrotask для батчинга setState.
 * Несколько setState → один ре-рендер, даже внутри setTimeout.
 *
 * Вопросы:
 *   1. Сколько ре-рендеров произойдёт в React 17 для кода ниже? А в React 18?
 *   2. Почему React 18 использует именно microtask, а не macrotask?
 *   3. В каких случаях нужно flushSync из 'react-dom'?
 *
 * // Ответ на вопрос 1:
 * //   React 17: внутри setTimeout → 2 отдельных ре-рендера
 * //   React 18: автобатчинг → всегда 1 ре-рендер
 *
 * // Ответ на вопрос 2:
 * //   ?
 *
 * // Ответ на вопрос 3:
 * //   ?
 */
export function batchingExplained(): void {
  // Имитируем React 18 батчинг через microtask
  let renderCount = 0;
  const pendingUpdates: Array<() => void> = [];
  let batchScheduled = false;

  function setState(update: () => void): void {
    pendingUpdates.push(update);
    if (!batchScheduled) {
      batchScheduled = true;
      // TODO: замени queueMicrotask на setTimeout и сравни поведение
      queueMicrotask(() => {
        pendingUpdates.forEach((u) => u());
        pendingUpdates.length = 0;
        batchScheduled = false;
        renderCount++;
        console.log(`Ре-рендер #${renderCount}`);
      });
    }
  }

  // Два setState → один ре-рендер (батчинг)
  setState(() => console.log("setCount(1)"));
  setState(() => console.log("setName('Alice')"));
  // Ожидаем: один "Ре-рендер #1"
}

/**
 * Задание 3.2 — Debounce через замыкание (паттерн в React)
 *
 * Debounce — откладывает выполнение функции пока не пройдёт `wait` ms
 * с момента последнего вызова. Используется для поиска, автосохранения.
 *
 * Реализуй debounce<T extends (...args: any[]) => void>(fn, wait).
 *
 * Пример:
 *   const search = debounce((query: string) => {
 *     console.log("Поиск:", query);
 *   }, 300);
 *
 *   search("h");      // таймер сбрасывается
 *   search("he");     // таймер сбрасывается
 *   search("hel");    // таймер сбрасывается
 *   // через 300ms: "Поиск: hel"  — только один вызов
 *
 * В React:
 *   const debouncedSearch = useCallback(debounce(handleSearch, 300), []);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): T & { cancel(): void } {
  // TODO:
  // - Храни timerId через замыкание (let timerId: ReturnType<typeof setTimeout>)
  // - При каждом вызове: clearTimeout(timerId), затем новый setTimeout
  // - Добавь метод .cancel() для отмены отложенного вызова
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — processInChunks для React UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 4.1 — Тяжёлые вычисления без блокировки UI
 *
 * Задача: обработать большой массив данных, не "замораживая" страницу.
 * В React: компонент должен оставаться отзывчивым во время обработки.
 *
 * Реализуй processItemsWithProgress:
 *   - Обрабатывает массив чанками
 *   - Вызывает onProgress(percent) между чанками
 *   - Возвращает промис с результатами
 *
 * В React-компоненте использование:
 *   const [progress, setProgress] = useState(0);
 *   await processItemsWithProgress(items, transform, 100, setProgress);
 */
export async function processItemsWithProgress<T, R>(
  items: T[],
  transform: (item: T) => R,
  chunkSize: number,
  onProgress: (percentComplete: number) => void
): Promise<R[]> {
  // TODO:
  // 1. Обрабатывай чанками по chunkSize
  // 2. После каждого чанка: вычисли процент и вызови onProgress
  // 3. Уступи управление: await new Promise(r => setTimeout(r, 0))
  throw new Error("Not implemented");
}

/**
 * Задание 4.2 — Очередь запросов с ограничением параллелизма
 *
 * В production часто нужно ограничить количество одновременных API-запросов
 * чтобы не перегрузить сервер (rate limiting).
 *
 * Реализуй createRequestQueue(concurrency):
 *   - .add(fn) добавляет задачу в очередь и возвращает Promise результата
 *   - Одновременно выполняется не более `concurrency` задач
 *
 * Пример:
 *   const queue = createRequestQueue(2);
 *   const p1 = queue.add(() => fetch('/api/1'));
 *   const p2 = queue.add(() => fetch('/api/2'));
 *   const p3 = queue.add(() => fetch('/api/3')); // ждёт пока p1 или p2 завершится
 *   await Promise.all([p1, p2, p3]);
 */
export interface RequestQueue {
  add<T>(fn: () => Promise<T>): Promise<T>;
  get size(): number;      // задачи в ожидании
  get running(): number;   // выполняемые сейчас
}

export function createRequestQueue(concurrency: number): RequestQueue {
  // TODO:
  // Hint: храни массив pending задач и счётчик running
  // После завершения задачи — запускай следующую из pending
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — раскомментируй нужный блок
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  // --- Раздел 1 ---
  console.log("═══ 1.1  slowProfile  ══════════════════════════════");
  const t1 = Date.now();
  await slowProfile("user1");
  console.log(`slow: ${Date.now() - t1}ms`); // ~850ms

  // console.log("\n═══ 1.1  fastProfile  ══════════════════════════════");
  // const t2 = Date.now();
  // await fastProfile("user1");
  // console.log(`fast: ${Date.now() - t2}ms`); // ~400ms

  // --- Раздел 2 ---
  console.log("\n═══ 2.1  staleClosure_demo  ════════════════════════");
  staleClosure_demo();
  await pause(1200);

  // console.log("\n═══ 2.1  fixedCounter  ════════════════════════════");
  // fixedCounter();
  // await pause(1200);

  // --- Раздел 3 ---
  console.log("\n═══ 3.1  batchingExplained  ════════════════════════");
  batchingExplained();
  await pause();

  // --- Раздел 4 ---
  // console.log("\n═══ 4.1  processItemsWithProgress  ═════════════════");
  // const items = Array.from({ length: 300 }, (_, i) => i);
  // await processItemsWithProgress(items, x => x * 2, 50, (p) => {
  //   process.stdout.write(`\rПрогресс: ${p}%`);
  // });
  // console.log("\nГотово");
}

main().catch(console.error);
