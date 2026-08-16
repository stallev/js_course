/**
 * Тема 2 — Hoisting и TDZ
 * Решения практических заданий | Pure TypeScript / Node.js
 *
 * Запуск:  npx tsx middle/sandbox/js_sandbox/topics/topic_2/solutions.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание вывода и ошибок
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 1.1 — typeof a = "undefined", b → ReferenceError, после: a=1, b=2
 *
 * var поднимается с инициализацией undefined → typeof не бросает ошибку.
 * let поднимается без инициализации → TDZ до строки `let b = 2`.
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
 * Решение 1.2 — decl работает, expr → ReferenceError (const в TDZ)
 *
 * Function declaration hoists целиком — тело доступно до строки объявления.
 * const expr = function... — hoists только binding expr в TDZ, не функцию.
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
 * Решение 1.3 — undefined, 2, глобальный x: 1
 *
 * var x внутри test() shadowing: локальный x hoisted → undefined на первом log.
 * Глобальный x = 1 не затронут — это другая переменная.
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
 * Решение 1.4 — var: 3,3,3 | let: 0,1,2
 *
 * var i — одна переменная на всю функцию, к моменту setTimeout i === 3.
 * let i — новый binding на каждой итерации, коллбэк захватывает своё значение.
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

export function createIndexHandlers_var(count: number): Array<() => void> {
  const handlers: Array<() => void> = [];
  for (var i = 0; i < count; i++) {
    handlers.push(() => console.log(i));
  }
  return handlers;
}

/**
 * Решение 2.1 — let создаёт отдельный binding на каждой итерации
 */
export function createIndexHandlers_let(count: number): Array<() => void> {
  const handlers: Array<() => void> = [];
  for (let i = 0; i < count; i++) {
    handlers.push(() => console.log(i));
  }
  return handlers;
}

/**
 * Решение 2.2 — tryAccess оборачивает read() в try/catch
 */
export type AccessResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; message: string };

export function tryAccess<T>(_label: string, read: () => T): AccessResult<T> {
  try {
    return { ok: true, value: read() };
  } catch (err) {
    const error = err as Error;
    return { ok: false, error: error.name, message: error.message };
  }
}

/**
 * Решение 2.3 — runPipeline + helpers ниже (function declaration hoisting)
 */
export function runPipeline(input: string): string {
  const validated = validate(input);
  const transformed = transform(validated);
  return format(transformed);
}

function validate(input: string): string {
  if (input.trim() === "") throw new Error("empty input");
  return input.trim();
}

function transform(input: string): string {
  return input.toUpperCase();
}

function format(input: string): string {
  return input + "!";
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Исправление багов
// ─────────────────────────────────────────────────────────────────────────────

export function createButtons_buggy(onClick: (index: number) => void): void {
  for (var i = 0; i < 5; i++) {
    setTimeout(() => onClick(i), 0);
  }
}

export function createButtons_fixed(onClick: (index: number) => void): void {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => onClick(i), 0);
  }
}

export function initApp_buggy(): string {
  // @ts-expect-error var hoisted — config === undefined в runtime
  console.log("URL:", config.apiUrl);
  var config = { apiUrl: "https://api.example.com" };
  return config.apiUrl;
}

export function initApp_fixed(): string {
  const config = { apiUrl: "https://api.example.com" };
  console.log("URL:", config.apiUrl);
  return config.apiUrl;
}

export function processUser_buggy(): { userId: string; sessionId: string } {
  if (true) {
    var userId = "abc";
    let sessionId = "xyz";
  }
  // @ts-expect-error sessionId — block scope, runtime ReferenceError
  return { userId, sessionId };
}

export function processUser_fixed(): { userId: string; sessionId: string } {
  let userId: string;
  let sessionId: string;
  if (true) {
    userId = "abc";
    sessionId = "xyz";
  }
  return { userId, sessionId };
}

export function greetUser_buggy(name: string): string {
  // @ts-expect-error const greet в TDZ
  return greet(name) + "!";
  const greet = (n: string) => `Hello, ${n}`;
}

export function greetUser_fixed(name: string): string {
  function greet(n: string): string {
    return `Hello, ${n}`;
  }
  return greet(name) + "!";
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Продвинутые паттерны
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 4.1 — lazy init через замыкание
 */
export function createLazyGetter<T>(initializer: () => T): () => T {
  let cached: T | undefined;
  let initialized = false;

  return () => {
    if (!initialized) {
      cached = initializer();
      initialized = true;
    }
    return cached as T;
  };
}

/**
 * Решение 4.2 — assertInitialized
 */
export function assertInitialized<T>(
  value: T | undefined,
  name: string
): asserts value is T {
  if (value === undefined) {
    throw new ReferenceError(`${name} is not initialized`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЗАПУСК — демонстрация всех решений
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const pause = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

  console.log("═══ 1.1 ═══════════════════════════════════════════");
  predict_1_1();

  console.log("\n═══ 1.2 ═══════════════════════════════════════════");
  predict_1_2();

  console.log("\n═══ 1.3  Ожидаем: undefined, 2, глобальный x: 1");
  predict_1_3();

  console.log("\n═══ 1.4 var (ожидаем 3,3,3) ═══════════════════════");
  predict_1_4_var();
  await pause(50);

  console.log("\n═══ 1.4 let (ожидаем 0,1,2) ═══════════════════════");
  predict_1_4_let();
  await pause(50);

  console.log("\n═══ 2.1 createIndexHandlers ═══════════════════════");
  console.log("var:");
  createIndexHandlers_var(3).forEach((h) => h());
  console.log("let:");
  createIndexHandlers_let(3).forEach((h) => h());

  console.log("\n═══ 2.2 tryAccess ════════════════════════════════");
  console.log(
    tryAccess("до let x", () => {
      // @ts-expect-error — демонстрация TDZ
      return x;
    })
  );
  {
    let x = 42;
    console.log(tryAccess("после let x", () => x));
  }

  console.log("\n═══ 2.3 runPipeline ════════════════════════════════");
  console.log(runPipeline("  hello  "));

  console.log("\n═══ 3.1 createButtons ════════════════════════════");
  createButtons_buggy((i) => console.log("buggy", i));
  await pause(50);
  createButtons_fixed((i) => console.log("fixed", i));
  await pause(50);

  console.log("\n═══ 3.2 initApp ═══════════════════════════════════");
  try {
    initApp_buggy();
  } catch (e) {
    console.log("buggy:", (e as Error).message);
  }
  console.log("fixed:", initApp_fixed());

  console.log("\n═══ 3.3 processUser ══════════════════════════════");
  try {
    processUser_buggy();
  } catch (e) {
    console.log("buggy:", (e as Error).message);
  }
  console.log("fixed:", processUser_fixed());

  console.log("\n═══ 3.4 greetUser ════════════════════════════════");
  console.log("fixed:", greetUser_fixed("Alice"));

  console.log("\n═══ 4.1 createLazyGetter ══════════════════════════");
  let calls = 0;
  const get = createLazyGetter(() => {
    calls++;
    return { v: 1 };
  });
  get();
  get();
  console.log("init calls:", calls);

  console.log("\n═══ 4.2 assertInitialized ═════════════════════════");
  let cfg: { x: number } | undefined;
  try {
    assertInitialized(cfg, "cfg");
  } catch (e) {
    console.log((e as Error).message);
  }
  cfg = { x: 1 };
  assertInitialized(cfg, "cfg");
  console.log("cfg ok:", cfg.x);
}

main().catch(console.error);
