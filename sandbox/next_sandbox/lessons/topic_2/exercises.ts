/**
 * Тема 2 — Hoisting и TDZ
 * Практические задания | React / Next.js контекст
 *
 * Файл содержит TypeScript-упражнения, специфичные для стека React + Next.js.
 * Каждое задание — реальный паттерн, встречающийся в production-коде.
 *
 * Решения: sandbox/next_sandbox/lessons/topic_2/solutions.tsx
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание (те же ловушки, что в js_sandbox)
//
// Запиши ответ в комментарий // Вывод: ? перед запуском main().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — var vs let hoisting
 *
 * // Вывод: ?
 */
export function predict_1_1(): void {
  // @ts-expect-error var hoisted — typeof безопасен до строки объявления
  console.log("typeof a:", typeof a);

  try {
    // @ts-expect-error let в TDZ
    const _ = b;
  } catch (err) {
    console.log("b в TDZ:", (err as Error).name);
  }

  var a = 1;
  let b = 2;
  console.log("a =", a, ", b =", b);
}

/**
 * Задание 1.2 — var shadowing (классический вопрос)
 *
 * // Вывод: ?
 */
export function predict_1_2(): void {
  var x = 1;
  function test() {
    // @ts-expect-error локальный var shadowing
    console.log("внутри 1:", x);
    var x = 2;
    console.log("внутри 2:", x);
  }
  test();
}

/**
 * Задание 1.3 — var vs let в цикле (обработчики кликов)
 *
 * В React часто создают обработчики в цикле map/for.
 * // Вывод var: ?
 * // Вывод let: ?
 */
export function predictLoopHandlers_var(): Array<() => number> {
  const handlers: Array<() => number> = [];
  for (var i = 0; i < 3; i++) {
    handlers.push(() => i);
  }
  return handlers;
}

export function predictLoopHandlers_let(): Array<() => number> {
  const handlers: Array<() => number> = [];
  for (let i = 0; i < 3; i++) {
    handlers.push(() => i);
  }
  return handlers;
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — React: обработчики и var/let в цикле
//
// Аналог: список вкладок / кнопок пагинации — каждая должна знать свой index.
// ─────────────────────────────────────────────────────────────────────────────

export interface TabHandler {
  label: string;
  onSelect: () => number;
}

/**
 * Задание 2.1 — createTabHandlers(count)
 *
 * BUG в createTabHandlers_var: все вкладки возвращают count при клике.
 *
 * Реализуй createTabHandlers_let — каждая вкладка возвращает свой index.
 *
 * Контекст (React):
 *   const tabs = createTabHandlers_let(5);
 *   tabs.map((tab, i) => (
 *     <button key={i} onClick={() => setActive(tab.onSelect())}>
 *       {tab.label}
 *     </button>
 *   ));
 */
export function createTabHandlers_var(count: number): TabHandler[] {
  const tabs: TabHandler[] = [];
  for (var i = 0; i < count; i++) {
    tabs.push({
      label: `Tab ${i}`,
      onSelect: () => i,
    });
  }
  return tabs;
}

export function createTabHandlers_let(count: number): TabHandler[] {
  // TODO: let вместо var
  throw new Error("Not implemented");
}

/**
 * Задание 2.2 — buildPageList(totalPages, currentPage)
 *
 * Next.js: пагинация через searchParams.page (строка!).
 * BUG: currentPage объявлен через var ПОСЛЕ использования в map.
 *
 * Реализуй buildPageList_fixed:
 *   - currentPage вычисляется ДО создания массива страниц
 *   - каждая страница знает свой номер (let в цикле)
 */
export function buildPageList_buggy(
  totalPages: number,
  pageParam: string | undefined
): { pageValues: number[]; current: number } {
  const getPageValue: Array<() => number> = [];
  for (var i = 0; i < totalPages; i++) {
    getPageValue.push(() => i + 1);
  }

  var currentPage = Number(pageParam) || 1;
  return {
    current: currentPage,
    pageValues: getPageValue.map((fn) => fn()),
  };
}

export function buildPageList_fixed(
  totalPages: number,
  pageParam: string | undefined
): { pageValues: number[]; current: number } {
  // TODO: const currentPage до цикла; let i в for
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Module init и block scope (Next.js config)
// ─────────────────────────────────────────────────────────────────────────────

export interface AppConfig {
  apiUrl: string;
  defaultLocale: string;
}

/**
 * Задание 3.1 — getAppConfig (use-before-init)
 *
 * BUG: readConfig обращается к CONFIG до var CONFIG = ...
 * В Next.js аналог — чтение env/config до объявления константы модуля.
 *
 * Реализуй getAppConfig_fixed: CONFIG объявлен до readConfig.
 */
export function getAppConfig_buggy(): AppConfig {
  return readConfig();

  function readConfig(): AppConfig {
    // @ts-expect-error CONFIG объявлен ниже — var hoisted undefined
    return CONFIG;
  }

  var CONFIG: AppConfig = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    defaultLocale: "ru",
  };
}

export function getAppConfig_fixed(): AppConfig {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 3.2 — extractSessionIds (block scope)
 *
 * BUG: sessionId объявлен через let внутри if — снаружи ReferenceError.
 *
 * Реализуй extractSessionIds_fixed из практического задания курса.
 */
export function extractSessionIds_buggy(): {
  userId: string;
  sessionId: string;
} {
  if (true) {
    var userId = "user-1";
    let sessionId = "sess-abc";
  }
  // @ts-expect-error sessionId — block scope
  return { userId, sessionId };
}

export function extractSessionIds_fixed(): {
  userId: string;
  sessionId: string;
} {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 3.3 — scheduleButtonClicks (var + setTimeout)
 *
 * Прямой аналог createButtons из курса — кнопки «кликаются» с задержкой.
 * Реализуй scheduleButtonClicks_fixed → индексы 0..4, не пять пятёрок.
 */
export function scheduleButtonClicks_buggy(
  onClick: (index: number) => void
): void {
  for (var i = 0; i < 5; i++) {
    setTimeout(() => onClick(i), 0);
  }
}

export function scheduleButtonClicks_fixed(
  onClick: (index: number) => void
): void {
  // TODO
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Function hoisting и lazy init в модулях
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 4.1 — normalizeSearchQuery (function declaration hoisting)
 *
 * Паттерн Server Action / route handler: главная функция сверху,
 * helper'ы снизу — читается как «публичный API → детали».
 *
 * normalizeSearchQuery("  Hello World  ") → "hello world"
 *
 * TODO: реализуй normalizeSearchQuery, объявив trimQuery и toLowerSafe
 *       как function declaration НИЖЕ normalizeSearchQuery.
 */
export function normalizeSearchQuery(raw: string | undefined): string {
  // TODO: вызови trimQuery затем toLowerSafe
  throw new Error("Not implemented");
}

/**
 * Задание 4.2 — createConfigGetter()
 *
 * Ленивая инициализация конфига — безопасная альтернатива use-before-init.
 * Первый вызов getter() читает env, повторные — из кэша.
 *
 * Пример:
 *   const getConfig = createConfigGetter();
 *   getConfig().apiUrl  // читает process.env один раз
 */
export function createConfigGetter(): () => AppConfig {
  // TODO
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

  console.log("\n═══ 1.3 loop handlers var ═════════════════════════");
  console.log(
    "var:",
    predictLoopHandlers_var().map((h) => h())
  );

  console.log("\n═══ 1.3 loop handlers let ═════════════════════════");
  console.log(
    "let:",
    predictLoopHandlers_let().map((h) => h())
  );

  // --- Раздел 2 ---
  // console.log("\n═══ 2.1 createTabHandlers ════════════════════════");
  // console.log("var:", createTabHandlers_var(3).map(t => t.onSelect()));
  // console.log("let:", createTabHandlers_let(3).map(t => t.onSelect()));

  // console.log("\n═══ 2.2 buildPageList ═════════════════════════════");
  // console.log("fixed:", buildPageList_fixed(5, "3"));

  // --- Раздел 3 ---
  // console.log("\n═══ 3.1 getAppConfig ════════════════════════════");
  // try { getAppConfig_buggy(); } catch (e) { console.log("buggy:", (e as Error).message); }
  // console.log("fixed:", getAppConfig_fixed());

  // console.log("\n═══ 3.2 extractSessionIds ═══════════════════════");
  // try { extractSessionIds_buggy(); } catch (e) { console.log("buggy:", (e as Error).message); }
  // console.log("fixed:", extractSessionIds_fixed());

  // console.log("\n═══ 3.3 scheduleButtonClicks ════════════════════");
  // scheduleButtonClicks_buggy(i => console.log("buggy", i));
  // await pause(50);
  // scheduleButtonClicks_fixed(i => console.log("fixed", i));
  // await pause(50);

  // --- Раздел 4 ---
  // console.log("\n═══ 4.1 normalizeSearchQuery ════════════════════");
  // console.log(normalizeSearchQuery("  Hello World  "));

  // console.log("\n═══ 4.2 createConfigGetter ══════════════════════");
  // const get = createConfigGetter();
  // console.log(get().apiUrl);
  // console.log(get() === get()); // true — тот же объект из кэша
}

main().catch(console.error);
