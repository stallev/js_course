/**
 * Тема 2 — Hoisting и TDZ
 * Решения практических заданий | React / Next.js контекст
 *
 * Компоненты можно подключить на странице:
 *   src/app/lessons/topic_2/page.tsx
 */

"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 1 — Предсказание
// ─────────────────────────────────────────────────────────────────────────────

export function predict_1_1(): void {
  // @ts-expect-error var hoisted
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

export function predict_1_2(): void {
  var x = 1;
  function test() {
    // @ts-expect-error var shadowing
    console.log("внутри 1:", x);
    var x = 2;
    console.log("внутри 2:", x);
  }
  test();
}

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
// РАЗДЕЛ 2 — Tab handlers и pagination
// ─────────────────────────────────────────────────────────────────────────────

export interface TabHandler {
  label: string;
  onSelect: () => number;
}

export function createTabHandlers_var(count: number): TabHandler[] {
  const tabs: TabHandler[] = [];
  for (var i = 0; i < count; i++) {
    tabs.push({ label: `Tab ${i}`, onSelect: () => i });
  }
  return tabs;
}

/**
 * Решение 2.1 — let создаёт отдельный binding на каждой итерации
 */
export function createTabHandlers_let(count: number): TabHandler[] {
  const tabs: TabHandler[] = [];
  for (let i = 0; i < count; i++) {
    tabs.push({ label: `Tab ${i}`, onSelect: () => i });
  }
  return tabs;
}

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

/**
 * Решение 2.2 — currentPage до цикла, let i для отдельных bindings
 */
export function buildPageList_fixed(
  totalPages: number,
  pageParam: string | undefined
): { pageValues: number[]; current: number } {
  const currentPage = Number(pageParam) || 1;
  const getPageValue: Array<() => number> = [];

  for (let i = 0; i < totalPages; i++) {
    getPageValue.push(() => i + 1);
  }

  return {
    current: currentPage,
    pageValues: getPageValue.map((fn) => fn()),
  };
}

/**
 * React-компонент: вкладки с var vs let
 */
export function TabHandlersDemo() {
  const [activeVar, setActiveVar] = useState<number | null>(null);
  const [activeLet, setActiveLet] = useState<number | null>(null);

  const tabsVar = createTabHandlers_var(5);
  const tabsLet = createTabHandlers_let(5);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-bold text-lg">Tab Handlers: var vs let</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-red-50 rounded space-y-2">
          <p className="text-sm text-red-700 font-medium">BUG: var в цикле</p>
          <div className="flex flex-wrap gap-1">
            {tabsVar.map((tab, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveVar(tab.onSelect())}
                className="px-2 py-1 text-xs bg-white border rounded hover:bg-red-100"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-mono">
            active: {activeVar ?? "—"} (всегда 5)
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded space-y-2">
          <p className="text-sm text-green-700 font-medium">FIX: let в цикле</p>
          <div className="flex flex-wrap gap-1">
            {tabsLet.map((tab, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveLet(tab.onSelect())}
                className="px-2 py-1 text-xs bg-white border rounded hover:bg-green-100"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-mono">
            active: {activeLet ?? "—"} (0–4 ✓)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 3 — Config и block scope
// ─────────────────────────────────────────────────────────────────────────────

export interface AppConfig {
  apiUrl: string;
  defaultLocale: string;
}

export function getAppConfig_buggy(): AppConfig {
  return readConfig();

  function readConfig(): AppConfig {
    // @ts-expect-error CONFIG объявлен ниже в buggy-версии
    return CONFIG;
  }

  var CONFIG: AppConfig = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    defaultLocale: "ru",
  };
}

/**
 * Решение 3.1 — CONFIG объявлен до readConfig
 */
export function getAppConfig_fixed(): AppConfig {
  const CONFIG: AppConfig = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    defaultLocale: "ru",
  };

  return readConfig();

  function readConfig(): AppConfig {
    return CONFIG;
  }
}

export function extractSessionIds_buggy(): {
  userId: string;
  sessionId: string;
} {
  if (true) {
    var userId = "user-1";
    let sessionId = "sess-abc";
  }
  // @ts-expect-error sessionId block-scoped
  return { userId, sessionId };
}

export function extractSessionIds_fixed(): {
  userId: string;
  sessionId: string;
} {
  let userId: string;
  let sessionId: string;
  if (true) {
    userId = "user-1";
    sessionId = "sess-abc";
  }
  return { userId, sessionId };
}

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
  for (let i = 0; i < 5; i++) {
    setTimeout(() => onClick(i), 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// РАЗДЕЛ 4 — Function hoisting и lazy config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Решение 4.1 — helpers ниже main (function declaration hoisting)
 */
export function normalizeSearchQuery(raw: string | undefined): string {
  return toLowerSafe(trimQuery(raw));
}

function trimQuery(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function toLowerSafe(value: string): string {
  return value.toLowerCase();
}

/**
 * Решение 4.2 — lazy singleton config
 */
export function createConfigGetter(): () => AppConfig {
  let cached: AppConfig | undefined;

  return () => {
    if (!cached) {
      cached = {
        apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
        defaultLocale: "ru",
      };
    }
    return cached;
  };
}

/**
 * React-компонент: демо lazy config getter
 */
export function LazyConfigDemo() {
  const [log, setLog] = useState<string[]>([]);
  const getConfig = createConfigGetter();

  const handleLoad = () => {
    const a = getConfig();
    const b = getConfig();
    setLog((prev) => [
      ...prev,
      `apiUrl: ${a.apiUrl}`,
      `same reference: ${a === b ? "yes ✓" : "no"}`,
    ]);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-bold text-lg">Lazy Config Getter</h3>
      <button
        type="button"
        onClick={handleLoad}
        className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
      >
        Загрузить конфиг дважды
      </button>
      <ul className="text-xs font-mono space-y-1">
        {log.map((entry, i) => (
          <li key={i} className="p-1 bg-gray-50 rounded">
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}
