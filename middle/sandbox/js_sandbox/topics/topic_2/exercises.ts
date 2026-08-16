/**
 * Тема 2 — Hoisting и TDZ
 * Практические задания | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx middle/sandbox/js_sandbox/topics/topic_2/exercises.ts
 *
 * Инструкция:
 *  1. Читай условие задания
 *  2. Запиши ответ / реализацию
 *  3. Раскомментируй вызов в секции ЗАПУСК и проверь результат
 *  4. Сверься с solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание вывода и ошибок
//
// Правило: перед запуском — запиши ответ в строку "// Вывод: ?"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 1.1 — var hoists с undefined, let — в TDZ
 *
 * // Вывод: ?
 *
 * Объясни разницу между `typeof a` до объявления и попыткой прочитать `b`.
 */
export function predict_1_1(): void {
  // @ts-expect-error var hoisted — typeof безопасен до строки объявления
  console.log("typeof a до объявления:", typeof a);

  try {
    // @ts-expect-error let в TDZ — runtime ReferenceError
    const _ = b;
    console.log("b доступен — не должно случиться");
  } catch (err) {
    console.log("b в TDZ:", (err as Error).name);
  }

  var a = 1;
  let b = 2;
  console.log("после инициализации: a =", a, ", b =", b);
}

/**
 * Задание 1.2 — Function Declaration vs Function Expression
 *
 * // Вывод: ?
 *
 * Почему decl() работает до строки объявления, а expr() — нет?
 */
export function predict_1_2(): void {
  console.log("decl():", decl());

  try {
    // @ts-expect-error function expression в TDZ
    console.log("expr():", expr());
  } catch (err) {
    console.log("expr() ошибка:", (err as Error).name, "—", (err as Error).message);
  }

  function decl(): string {
    return "function declaration hoisted";
  }

  const expr = function (): string {
    return "function expression";
  };
}

/**
 * Задание 1.3 — Классическая ловушка: var shadowing внутри функции
 *
 * // Вывод: ?
 *
 * Подсказка: объявление `var x` внутри test() поднимается наверх функции.
 */
export function predict_1_3(): void {
  var x = 1;

  function test(): void {
    // @ts-expect-error локальный var shadowing — hoisted undefined
    console.log("первый log:", x);
    var x = 2;
    console.log("второй log:", x);
  }

  test();
  console.log("глобальный x:", x);
}

/**
 * Задание 1.4 — var vs let в цикле с setTimeout
 *
 * Сначала предскажи вывод для обоих вариантов, потом запусти.
 *
 * // Вывод var: ?
 * // Вывод let: ?
 */
export function predict_1_4_var(): void {
  for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log("var i =", i), 0);
  }
}

export function predict_1_4_let(): void {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log("let i =", i), 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 2 — Реализация утилит
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 2.1 — createIndexHandlers(count)
 *
 * Возвращает массив функций. Каждая при вызове логирует свой индекс: 0, 1, 2...
 *
 * BUG-версия createIndexHandlers_var использует var — все handler'ы видят одно i.
 * Реализуй createIndexHandlers_let через let в цикле.
 *
 * Пример:
 *   const handlers = createIndexHandlers_let(3);
 *   handlers.forEach(h => h()); // 0, 1, 2
 */
export function createIndexHandlers_var(count: number): Array<() => void> {
  const handlers: Array<() => void> = [];
  for (var i = 0; i < count; i++) {
    handlers.push(() => console.log(i));
  }
  return handlers;
}

export function createIndexHandlers_let(count: number): Array<() => void> {
  // TODO: let вместо var — отдельный binding на каждой итерации
  throw new Error("Not implemented");
}

/**
 * Задание 2.2 — tryAccess(label, read)
 *
 * Утилита для безопасной демонстрации TDZ в тестах и консоли.
 * Вызывает read() в try/catch и возвращает результат или информацию об ошибке.
 *
 * Пример:
 *   tryAccess("до let x", () => x)           // { ok: false, error: "ReferenceError" }
 *   let x = 1;
 *   tryAccess("после let x", () => x)        // { ok: true, value: 1 }
 */
export type AccessResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; message: string };

export function tryAccess<T>(label: string, read: () => T): AccessResult<T> {
  // TODO: try/catch, логируй label при необходимости снаружи
  throw new Error("Not implemented");
}

/**
 * Задание 2.3 — runPipeline(steps)
 *
 * Демонстрация hoisting function declaration:
 * главная функция может вызывать helper'ы, объявленные НИЖЕ в том же scope.
 *
 * Реализуй runPipeline так, чтобы порядок объявлений был:
 *   1. export function runPipeline — вызывает validate → transform → format
 *   2. function validate / transform / format — ниже runPipeline
 *
 * runPipeline("  hello  ") → "HELLO!"
 */
export function runPipeline(input: string): string {
  // TODO: вызови validate, transform, format (объяви их ниже как function declaration)
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Найди и исправь баг
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 3.1 — createButtons (var в цикле)
 *
 * BUG: все setTimeout выводят 5.
 *
 * Реализуй createButtons_fixed — ожидаемый вывод: 0, 1, 2, 3, 4.
 */
export function createButtons_buggy(onClick: (index: number) => void): void {
  for (var i = 0; i < 5; i++) {
    setTimeout(() => onClick(i), 0);
  }
}

export function createButtons_fixed(onClick: (index: number) => void): void {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 3.2 — initApp: обращение до инициализации
 *
 * BUG: config === undefined из-за hoisting var.
 *
 * Реализуй initApp_fixed: сначала объявление, потом использование.
 */
export function initApp_buggy(): string {
  // @ts-expect-error var hoisted — config === undefined в runtime
  console.log("URL:", config.apiUrl);
  var config = { apiUrl: "https://api.example.com" };
  return config.apiUrl;
}

export function initApp_fixed(): string {
  // TODO: const config до console.log
  throw new Error("Not implemented");
}

/**
 * Задание 3.3 — Block scope: var vs let
 *
 * BUG: sessionId недоступен снаружи if — ReferenceError.
 *
 * Реализуй processUser_fixed: оба значения доступны после блока.
 */
export function processUser_buggy(): { userId: string; sessionId: string } {
  if (true) {
    var userId = "abc";
    let sessionId = "xyz";
  }
  // @ts-expect-error sessionId — block scope, runtime ReferenceError
  return { userId, sessionId };
}

export function processUser_fixed(): { userId: string; sessionId: string } {
  // TODO: объяви переменные до блока или используй let на уровне функции
  throw new Error("Not implemented");
}

/**
 * Задание 3.4 — Function Expression до объявления
 *
 * BUG: greet вызывается до const greet = ...
 *
 * Реализуй greetUser_fixed двумя способами (выбери один):
 *   A) function declaration greetUser
 *   B) const greetUser + вызов только после объявления
 */
export function greetUser_buggy(name: string): string {
  // @ts-expect-error const greet в TDZ
  return greet(name) + "!";

  const greet = (n: string) => `Hello, ${n}`;
}

export function greetUser_fixed(name: string): string {
  // TODO
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Продвинутые паттерны
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Задание 4.1 — createLazyGetter(initializer)
 *
 * Паттерн «ленивая инициализация» — безопасная альтернатива use-before-init.
 * Первый вызов getter() выполняет initializer(), кэширует результат.
 * Повторные вызовы возвращают кэш.
 *
 * Пример:
 *   let initCount = 0;
 *   const getConfig = createLazyGetter(() => {
 *     initCount++;
 *     return { apiUrl: "https://api.example.com" };
 *   });
 *   getConfig(); // initCount = 1
 *   getConfig(); // initCount = 1 (кэш)
 */
export function createLazyGetter<T>(initializer: () => T): () => T {
  // TODO
  throw new Error("Not implemented");
}

/**
 * Задание 4.2 — assertInitialized(value, name)
 *
 * Runtime-guard для случаев когда TypeScript не спасает (any, внешние данные).
 * Если value === undefined → throw ReferenceError с понятным сообщением.
 * null пропускаем (это явное «пусто», не «не инициализировано»).
 *
 * Пример:
 *   let config: { url: string } | undefined;
 *   assertInitialized(config, "config"); // ReferenceError
 *   config = { url: "..." };
 *   assertInitialized(config, "config"); // ok
 */
export function assertInitialized<T>(
  value: T | undefined,
  name: string
): asserts value is T {
  // TODO
  throw new Error("Not implemented");
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — раскомментируй нужный блок
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  // --- Раздел 1: предсказание ---
  console.log("═══ 1.1 ═══════════════════════════════════════════");
  predict_1_1();

  console.log("\n═══ 1.2 ═══════════════════════════════════════════");
  predict_1_2();

  console.log("\n═══ 1.3 ═══════════════════════════════════════════");
  predict_1_3();

  console.log("\n═══ 1.4 var ═══════════════════════════════════════");
  predict_1_4_var();
  await pause(50);

  console.log("\n═══ 1.4 let ═══════════════════════════════════════");
  predict_1_4_let();
  await pause(50);

  // --- Раздел 2 ---
  // console.log("\n═══ 2.1 createIndexHandlers ═══════════════════════");
  // createIndexHandlers_var(3).forEach(h => h()); // все 3
  // createIndexHandlers_let(3).forEach(h => h()); // 0, 1, 2

  // console.log("\n═══ 2.2 tryAccess ════════════════════════════════");
  // console.log(tryAccess("example", () => 42));

  // console.log("\n═══ 2.3 runPipeline ════════════════════════════════");
  // console.log(runPipeline("  hello  ")); // HELLO!

  // --- Раздел 3 ---
  // console.log("\n═══ 3.1 createButtons ════════════════════════════");
  // createButtons_buggy(i => console.log("buggy", i));
  // await pause(50);
  // createButtons_fixed(i => console.log("fixed", i));
  // await pause(50);

  // console.log("\n═══ 3.2 initApp ═══════════════════════════════════");
  // try { initApp_buggy(); } catch (e) { console.log("buggy:", (e as Error).message); }
  // console.log("fixed:", initApp_fixed());

  // console.log("\n═══ 3.3 processUser ══════════════════════════════");
  // try { processUser_buggy(); } catch (e) { console.log("buggy:", (e as Error).message); }
  // console.log("fixed:", processUser_fixed());

  // console.log("\n═══ 3.4 greetUser ════════════════════════════════");
  // console.log("fixed:", greetUser_fixed("Alice"));

  // --- Раздел 4 ---
  // console.log("\n═══ 4.1 createLazyGetter ══════════════════════════");
  // let calls = 0;
  // const get = createLazyGetter(() => { calls++; return { v: 1 }; });
  // get(); get();
  // console.log("init calls:", calls); // 1

  // console.log("\n═══ 4.2 assertInitialized ═════════════════════════");
  // let cfg: { x: number } | undefined;
  // try { assertInitialized(cfg, "cfg"); } catch (e) { console.log((e as Error).message); }
}

if (typeof window === "undefined") {
  main().catch(console.error);
}
