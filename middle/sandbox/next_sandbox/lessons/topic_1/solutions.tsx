/**
 * Тема 1 — Event Loop
 * Решения практических заданий | React / Next.js контекст
 *
 * Содержит:
 *   - TypeScript-решения к exercises.ts
 *   - React-компоненты, демонстрирующие каждый паттерн
 *
 * Компоненты подключаются на странице:
 *   src/app/lessons/topic_1/page.tsx
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchUserProfile,
  fetchUserPosts,
  fetchUserAlbumStats,
  fetchPlaceholderPost,
} from "./data-api";

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Promise.all в Server Components (JSONPlaceholder)
// ─────────────────────────────────────────────────────────────────────────────

export {
  fetchUserProfile,
  fetchUserPosts,
  fetchUserAlbumStats,
  fetchPlaceholderPost,
} from "./data-api";

/**
 * Решение 1.1 — fastProfile с Promise.all
 *
 * Три fetch к JSONPlaceholder стартуют одновременно.
 * Время ≈ max(latency₁, latency₂, latency₃), а не сумма.
 */
export async function fastProfile(userId: string) {
  const [user, posts, albumStats] = await Promise.all([
    fetchUserProfile(userId),
    fetchUserPosts(userId),
    fetchUserAlbumStats(userId),
  ]);
  return { user, posts, albumStats };
}

/**
 * Решение 1.2 — resilientProfile с Promise.allSettled
 *
 * userId "99" → /users/99 вернёт 404, posts/albums — пустые массивы.
 * Частичный UI лучше, чем белый экран от Promise.all.
 */
export async function resilientProfile(userId: string) {
  const [userResult, postsResult, statsResult] = await Promise.allSettled([
    fetchUserProfile(userId),
    fetchUserPosts(userId),
    fetchUserAlbumStats(userId),
  ]);

  return {
    user:       userResult.status === "fulfilled"  ? userResult.value  : null,
    posts:      postsResult.status === "fulfilled" ? postsResult.value : [],
    albumStats: statsResult.status === "fulfilled" ? statsResult.value : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Stale Closure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 2.1 — fixedCounter
 *
 * Причина бага staleClosure_demo:
 *   setInterval захватывает `count = 0` в момент создания.
 *   Замыкание "застывает" — count внутри коллбэка всегда 0.
 *   setCount(0 + 1) = setCount(1) на каждой итерации.
 *
 * Решение: функциональный updater `prev => prev + 1`
 *   - prev — актуальное значение из внутреннего state, не из замыкания
 *   - React передаёт prev сам при вызове setState
 */
export function fixedCounter(): () => void {
  let count = 0;
  const setCount = (updater: number | ((prev: number) => number)) => {
    count = typeof updater === "function" ? updater(count) : updater;
    console.log("count:", count);
  };

  const id = setInterval(() => {
    setCount((prev) => prev + 1); // ключевое: prev — всегда актуально
  }, 200);

  setTimeout(() => {
    clearInterval(id);
    console.log("Финальный count:", count); // 5 ✓
  }, 1050);

  return () => clearInterval(id);
}

/**
 * React-компонент: демонстрация stale closure vs functional updater
 */
export function StaleClosureDemo() {
  const [buggyCount, setBuggyCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    // BUG: захватывает buggyCount = 0
    const buggyId = setInterval(() => {
      setBuggyCount(buggyCount + 1); // всегда 0 + 1 = 1
    }, 500);

    // FIX: функциональный updater
    const fixedId = setInterval(() => {
      setFixedCount((prev) => prev + 1); // корректно растёт
    }, 500);

    return () => {
      clearInterval(buggyId);
      clearInterval(fixedId);
    };
  }, [isRunning]); // buggyCount НЕ в зависимостях → stale closure

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Stale Closure Demo</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-red-50 rounded">
          <p className="text-sm text-red-700 font-medium">BUG: count + 1</p>
          <p className="text-3xl font-mono">{buggyCount}</p>
          <p className="text-xs text-gray-500">Застрянет на 1</p>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <p className="text-sm text-green-700 font-medium">FIX: prev =&gt; prev + 1</p>
          <p className="text-3xl font-mono">{fixedCount}</p>
          <p className="text-xs text-gray-500">Растёт корректно</p>
        </div>
      </div>
      <button
        onClick={() => {
          setBuggyCount(0);
          setFixedCount(0);
          setIsRunning((v) => !v);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isRunning ? "Стоп" : "Запустить"}
      </button>
    </div>
  );
}

/**
 * Решение 2.2 — createEventSubscription с cleanup
 *
 * Почему утечка опасна:
 *   Каждый mount добавляет обработчик, unmount — нет.
 *   После 10 mount/unmount: 10 обработчиков на одно событие.
 *   Каждый держит замыкание с данными компонента → утечка памяти.
 *
 * В React: cleanup из useEffect вызывается при unmount и перед re-run эффекта.
 */
const eventBus = new Map<string, Set<(msg: { id: number; text: string; userId: string }) => void>>();

export function createEventSubscription(
  userId: string,
  onMessage: (msg: { id: number; text: string; userId: string }) => void
): () => void {
  const channel = `user:${userId}`;
  if (!eventBus.has(channel)) eventBus.set(channel, new Set());
  eventBus.get(channel)!.add(onMessage);

  // Возвращаем cleanup — удаляем обработчик при вызове
  return () => {
    eventBus.get(channel)?.delete(onMessage);
  };
}

/**
 * React-компонент: подписка с корректным cleanup
 */
export function MessageSubscriber({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handler = (msg: { id: number; text: string; userId: string }) => {
      setMessages((prev) => [...prev, msg.text]);
    };

    // Подписываемся и сохраняем cleanup
    const unsubscribe = createEventSubscription(userId, handler);

    // React вызовет cleanup при: unmount или изменении userId
    return unsubscribe;
  }, [userId]); // userId в зависимостях — при смене пользователя переподписываемся

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">Сообщения для {userId}</h3>
      <ul className="mt-2 space-y-1">
        {messages.map((msg, i) => (
          <li key={i} className="text-sm p-2 bg-gray-100 rounded">{msg}</li>
        ))}
      </ul>
      {messages.length === 0 && (
        <p className="text-gray-400 text-sm">Нет сообщений</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — React 18 батчинг и debounce
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 3.2 — debounce через замыкание
 *
 * Механизм:
 *   - timerId хранится в замыкании debounce
 *   - Каждый вызов debounced: сбрасываем старый таймер, ставим новый
 *   - fn вызывается только если не было новых вызовов за `wait` мс
 *
 * В React используется с useCallback:
 *   const debouncedSearch = useCallback(debounce(search, 300), []);
 *   // useCallback мемоизирует функцию — debounce создаётся один раз
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): T & { cancel(): void } {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timerId); // сброс предыдущего таймера
    timerId = setTimeout(() => {
      timerId = undefined;
      fn.apply(this, args);
    }, wait);
  } as T & { cancel(): void };

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = undefined;
  };

  return debounced;
}

/**
 * React-компонент: поиск с debounce
 */
export function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [callCount, setCallCount] = useState(0);

  // debounce создаётся один раз благодаря useCallback
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setCallCount((c) => c + 1);
    }, 400),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Debounced Search (400ms)</h3>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Печатай быстро..."
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <div className="text-sm space-y-1">
        <p>Введено: <span className="font-mono text-blue-600">{query || "—"}</span></p>
        <p>Поиск запущен: <span className="font-mono text-green-600">{searchTerm || "—"}</span></p>
        <p>Кол-во реальных запросов: <span className="font-bold text-purple-600">{callCount}</span></p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — processInChunks для React UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 4.1 — processItemsWithProgress
 *
 * setTimeout(r, 0) → macrotask → браузер успевает:
 *   1. Обработать события (клики, ввод)
 *   2. Вызвать requestAnimationFrame
 *   3. Перерисовать кадр
 *
 * Без этого: вся обработка синхронна → UI заморожен на время работы.
 */
export async function processItemsWithProgress<T, R>(
  items: T[],
  transform: (item: T) => R,
  chunkSize: number,
  onProgress: (percentComplete: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(transform));

    const percent = Math.round(((i + chunk.length) / total) * 100);
    onProgress(percent);

    // Уступаем управление — браузер перерисовывает кадр
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  return results;
}

/**
 * React-компонент: обработка с прогресс-баром
 */
export function HeavyProcessingDemo() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleStart = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    const items = Array.from({ length: 10_000 }, (_, i) => i);

    const processed = await processItemsWithProgress(
      items,
      (x) => x * x, // тяжёлое вычисление (имитация)
      200,
      setProgress
    );

    setResult(`Обработано ${processed.length} элементов, сумма: ${processed.slice(0, 5).join(", ")}...`);
    setIsProcessing(false);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Heavy Processing (чанки по 200)</h3>
      <button
        onClick={handleStart}
        disabled={isProcessing}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
      >
        {isProcessing ? "Обрабатываем..." : "Запустить (10 000 элементов)"}
      </button>
      {isProcessing && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Прогресс</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {result && (
        <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{result}</p>
      )}
      <p className="text-xs text-gray-500">
        UI остаётся отзывчивым: можно кликать и печатать во время обработки
      </p>
    </div>
  );
}

/**
 * Решение 4.2 — createRequestQueue
 *
 * Паттерн: очередь с семафором
 *   - pending: задачи ожидающие запуска
 *   - runningCount: текущее число выполняемых задач
 *   - После завершения задачи — запускаем следующую из pending (если есть)
 */
export interface RequestQueue {
  add<T>(fn: () => Promise<T>): Promise<T>;
  get size(): number;
  get running(): number;
}

export function createRequestQueue(concurrency: number): RequestQueue {
  const pending: Array<() => void> = [];
  let runningCount = 0;

  function next(): void {
    if (runningCount >= concurrency || pending.length === 0) return;
    const run = pending.shift()!;
    run();
  }

  return {
    add<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        pending.push(() => {
          runningCount++;
          fn()
            .then(resolve, reject)
            .finally(() => {
              runningCount--;
              next(); // запускаем следующую задачу из очереди
            });
        });
        next(); // попробуем запустить сразу, если есть слот
      });
    },
    get size()    { return pending.length; },
    get running() { return runningCount; },
  };
}

/**
 * React-компонент: демо очереди запросов
 */
export function RequestQueueDemo() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString("ru")}: ${msg}`]);

  const handleRun = async () => {
    setIsRunning(true);
    setLog([]);

    const queue = createRequestQueue(2); // не более 2 одновременно

    const tasks = Array.from({ length: 6 }, (_, i) => {
      const postId = i + 1;
      return queue.add(async () => {
        addLog(`Запрос /posts/${postId} (queue: ${queue.size}, running: ${queue.running})`);
        const post = await fetchPlaceholderPost(postId);
        addLog(`Пост #${post.id}: ${post.title.slice(0, 40)}…`);
        return post;
      });
    });

    await Promise.all(tasks);
    addLog("Все задачи выполнены");
    setIsRunning(false);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Request Queue (concurrency = 2, JSONPlaceholder)</h3>
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
      >
        {isRunning ? "Выполняется..." : "Запустить 6 задач"}
      </button>
      <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
        {log.map((entry, i) => (
          <div key={i} className="p-1 bg-gray-50 rounded">{entry}</div>
        ))}
      </div>
    </div>
  );
}
