# Контент курса — Раздел 7: Модули и TypeScript

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 7 — Темы 23–24 (ESM vs CommonJS · TypeScript: основы)

---

# Раздел 7 — Модули и TypeScript

*Модульная система определяет как код организован и связан между файлами. ESM стал стандартом современного JS — именно он обеспечивает tree shaking и статический анализ. TypeScript надстраивает над JavaScript систему типов, которая превращает runtime-ошибки в compile-time ошибки — критически важно для больших кодовых баз Next.js.*

🔗 **Связь с разделами:** Замыкания (Тема 3) лежат в основе модульного паттерна. Обработка ошибок (Раздел 8) интегрируется с TypeScript Result-паттерном.

---

## Содержание раздела

- [Тема 23 — ESM vs CommonJS](#тема-23--esm-vs-commonjs)
- [Тема 24 — TypeScript: основы](#тема-24--typescript-основы)

---

# Тема 23 — ESM vs CommonJS

← Предыдущая тема: [22 — Web APIs и Browser окружение]

---

## 1. Теория с аналогиями

### Аналогия: контракт vs договорённость на ходу

**ESM (ECMAScript Modules)** — это как подписанный контракт *до начала работы*: все зависимости прописаны заранее, до выполнения кода. Компилятор/бандлер видит весь граф зависимостей статически — ещё до запуска программы.

**CommonJS (CJS)** — это как договорённость *на ходу*: модули загружаются в момент вызова `require()`. Можно вызвать `require()` внутри условия, внутри функции, в любой момент выполнения.

```
ESM (статический — контракт):                CJS (динамический — на ходу):
─────────────────────────────                ─────────────────────────────
┌─────────────────────────┐                  ┌─────────────────────────┐
│  ФАЗА ПАРСИНГА (до run) │                  │  ФАЗА ВЫПОЛНЕНИЯ (run)  │
│                         │                  │                         │
│  import { fn } from     │                  │  if (condition) {       │
│    './utils'            │                  │    const fn =           │
│                         │                  │      require('./utils') │
│  Граф зависимостей      │                  │  }                      │
│  строится заранее       │                  │                         │
│  ↓                      │                  │  require() = синхронный │
│  Bundler знает всё      │                  │  блокирующий вызов      │
│  до старта              │                  │                         │
└─────────────────────────┘                  └─────────────────────────┘
```

---

### Таблица ключевых отличий

| Характеристика           | ESM                              | CommonJS                         |
|--------------------------|----------------------------------|----------------------------------|
| **Синтаксис**            | `import` / `export`              | `require()` / `module.exports`   |
| **Статичность**          | Статические — парсятся до выполнения | Динамические — выполняются в runtime |
| **Синхронность**         | Асинхронная загрузка (в браузере) | Синхронная загрузка (блокирует)  |
| **Live bindings**        | Да — читает актуальное значение  | Нет — копирует значение на момент `require` |
| **Top-level await**      | Поддерживается                   | Не поддерживается                |
| **Tree shaking**         | Работает (статический анализ)    | Не работает                      |
| **Circular deps**        | Частично решает через live bindings | Может вернуть пустой объект      |
| **Стандарт**             | ES2015+ (браузер + Node.js)      | Node.js (исторический)           |
| **Расширение файлов**    | `.mjs` или `"type": "module"`    | `.cjs` или без `"type": "module"` |
| **`__dirname`**          | Недоступен (нужен `import.meta`) | Доступен                         |

---

### Почему tree shaking работает только с ESM

Tree shaking — удаление мёртвого кода бандлером (Webpack, Rollup, Vite). Он работает только там, где граф зависимостей можно построить *статически*.

```javascript
// ✅ ESM — бандлер ЗНАЕТ в compile time, что именно импортируется
import { add, multiply } from './math';
// Бандлер видит: нужны только add и multiply
// Если где-то ещё не используется multiply — удалит его из бандла

// ❌ CJS — бандлер НЕ ЗНАЕТ, что будет запрошено
const math = require('./math');
// Нельзя знать заранее, будет ли вызвано math.multiply
// Бандлер вынужден включить ВСЮ библиотеку
```

**Почему статичность критична:**

```
ESM: граф известен ДО выполнения
─────────────────────────────────
app.js
  └── import { add } from './math'
        └── math.js (экспортирует: add, multiply, divide)
              ↓
        [Bundler Analysis]
              ↓
        Используется только: add
        Удалить: multiply, divide
        Итого: -30% размера бандла

CJS: граф НЕИЗВЕСТЕН до выполнения
────────────────────────────────────
app.js
  └── const math = require('./math')
        └── Возможно: math.add, math.multiply, math.anything
              ↓
        [Bundler Analysis]
              ↓
        Нельзя удалить ничего безопасно
        Итого: 100% библиотеки в бандл
```

**Реальный пример с lodash:**

```javascript
// ❌ CJS-стиль — тянет ВСЮ lodash (70 KB)
const _ = require('lodash');
_.debounce(fn, 300);

// ✅ ESM с named imports — tree shaking оставит только debounce (~2 KB)
import { debounce } from 'lodash-es';
debounce(fn, 300);
```

---

### Live Bindings — что это и почему важно

**Live binding** — ESM-экспорт не копирует значение, а создаёт *живую ссылку* на переменную в исходном модуле.

```javascript
// counter.mjs
export let count = 0;

export function increment() {
  count++; // изменяет ОРИГИНАЛЬНУЮ переменную
}
```

```javascript
// app.mjs — ESM: live binding
import { count, increment } from './counter.mjs';

console.log(count); // 0
increment();
console.log(count); // 1 ← видит АКТУАЛЬНОЕ значение (live binding!)

// Попытка перезаписать — TypeError (ESM-экспорты readonly снаружи)
// count = 5; // ❌ TypeError: Assignment to constant variable
```

```javascript
// app.cjs — CJS: копия значения
const { count, increment } = require('./counter.cjs');

console.log(count); // 0
increment();
console.log(count); // 0 ← всё ещё 0! (скопировали примитив при деструктуризации)
```

```
Live Bindings (ESM):
────────────────────
counter.mjs:     count = 0
                    │  (живая ссылка)
app.mjs:         count ──────► [память: count] ← increment() меняет здесь
                    └── читает актуальное значение всегда

Copy Semantics (CJS):
─────────────────────
counter.cjs:     count = 0
                    │  (копирование при require)
app.cjs:         count = 0  (своя копия)
                    └── не знает об изменениях в оригинале
```

---

### Top-level await

```javascript
// ✅ ESM — top-level await работает
// config.mjs
const config = await fetch('/api/config').then(r => r.json());
export { config };

// Этот модуль "приостановит" загрузку зависящих от него модулей
// пока await не завершится — но не заблокирует поток

// ❌ CJS — top-level await невозможен
// config.cjs
const config = await fetch('/api/config'); // SyntaxError!
// require() синхронный — не может ждать промис
```

---

### Ошибки при смешивании ESM и CJS

```javascript
// ❌ Ошибка 1: require() в ESM-контексте
// package.json: { "type": "module" }
const fs = require('fs'); // ReferenceError: require is not defined in ES module scope

// ❌ Ошибка 2: import в CJS-контексте
// package.json: без "type": "module"
import { readFile } from 'fs'; // SyntaxError: Cannot use import statement in a module

// ❌ Ошибка 3: require() для ESM-пакета
const esmPackage = require('pure-esm-package');
// ERR_REQUIRE_ESM: require() of ES Module not supported
```

**Решения:**

```javascript
// ✅ Вариант 1: динамический import() в CJS для загрузки ESM
async function loadESM() {
  const { default: esmModule } = await import('pure-esm-package');
  return esmModule;
}

// ✅ Вариант 2: __dirname в ESM (аналог CJS)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Вариант 3: createRequire в ESM для загрузки CJS
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsModule = require('./legacy.cjs');
```

---

### Dual Package: поддержка обоих форматов

Библиотека, которая должна работать и с ESM, и с CJS:

```
my-lib/
├── dist/
│   ├── esm/          ← ESM версия
│   │   ├── index.js
│   │   └── utils.js
│   └── cjs/          ← CJS версия
│       ├── index.cjs
│       └── utils.cjs
├── src/
│   ├── index.ts
│   └── utils.ts
└── package.json
```

```json
// package.json — поле exports для dual package
{
  "name": "my-lib",
  "version": "1.0.0",
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/esm/utils.js",
      "require": "./dist/cjs/utils.cjs",
      "types": "./dist/types/utils.d.ts"
    }
  },
  "types": "./dist/types/index.d.ts",
  "files": ["dist"]
}
```

---

## 2. Связь со стеком

### Next.js: клиент ESM, сервер CJS

```typescript
// Next.js App Router — Server Component (Node.js runtime)
// Может использовать CJS-совместимые пакеты через require (за кулисами)
// app/page.tsx — Server Component
import { db } from '@/lib/db'; // Next.js сам разрешает ESM/CJS

// Client Component — всегда ESM
'use client';
import { useState } from 'react'; // ESM
```

```typescript
// next.config.ts — настройки для работы с ESM пакетами
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Транспилировать ESM-only пакеты для совместимости с Node.js
  transpilePackages: ['pure-esm-package', 'another-esm-lib'],
  
  experimental: {
    // ESM внешние зависимости на сервере
    esmExternals: true,
  },
};

export default config;
```

### TypeScript: moduleResolution

```json
// tsconfig.json — важные настройки для модулей
{
  "compilerOptions": {
    // Для Next.js App Router — рекомендовано
    "module": "esnext",
    "moduleResolution": "bundler",  // понимает exports field в package.json
    
    // Для Node.js ESM проектов
    // "module": "node16",
    // "moduleResolution": "node16",
    
    // Старые проекты
    // "module": "commonjs",
    // "moduleResolution": "node",
    
    "esModuleInterop": true,        // позволяет: import React from 'react'
    "allowSyntheticDefaultImports": true
  }
}
```

**Разница moduleResolution:**

```
bundler  → понимает exports/imports fields, нет .js расширений обязательно
node16   → строгий ESM: нужны .js расширения в imports, поддерживает CJS и ESM
nodenext → то же что node16, но обновляется с Node.js
node     → старый алгоритм, не знает exports field
```

### Vite и Webpack: ESM-first

```typescript
// vite.config.ts — ESM нативно
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Vite использует Rollup для tree shaking через ESM
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

```javascript
// webpack.config.js — ESM оптимизации
module.exports = {
  optimization: {
    usedExports: true,    // включить tree shaking
    sideEffects: false,   // доверять полю sideEffects в package.json
  },
};

// package.json библиотеки
{
  "sideEffects": false,            // все файлы tree-shakeable
  // или список файлов с побочными эффектами:
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

---

## 3. Лучшие паттерны

### Паттерн 1: Всегда ESM в новых проектах

```javascript
// ❌ Антипаттерн — новый проект на CJS
// package.json без "type": "module"
const express = require('express');
const { readFile } = require('fs/promises');

module.exports = { createServer };

// ✅ Правильно — ESM с самого начала
// package.json: { "type": "module" }
import express from 'express';
import { readFile } from 'fs/promises';

export { createServer };
```

**Почему:** ESM — стандарт Web Platform и современного Node.js. Даёт tree shaking, top-level await, статический анализ. CJS остаётся только для легаси или библиотек, которые должны поддерживать старые окружения.

---

### Паттерн 2: Dynamic import() для code splitting

```javascript
// ❌ Антипаттерн — статический импорт тяжёлой библиотеки
import * as d3 from 'd3'; // тянет 500KB в начальный бандл
import { Chart } from './HeavyChart'; // загружается всегда, даже если не нужен

function Dashboard() {
  return <Chart data={data} />;
}

// ✅ Правильно — динамический импорт с lazy loading
import dynamic from 'next/dynamic';

// Next.js: автоматически создаёт отдельный чанк
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // не загружать на сервере
});

// Или нативный dynamic import
async function loadD3() {
  const d3 = await import('d3'); // загружается только при вызове
  return d3;
}

// React.lazy + Suspense
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

**Почему:** Начальный бандл меньше → быстрее TTI (Time to Interactive). Тяжёлый код загружается только когда реально нужен.

---

### Паттерн 3: Правильный package.json exports для dual package

```json
// ❌ Антипаттерн — только одна точка входа
{
  "main": "./dist/index.js"
}
// Не работает с tree shaking, нет поддержки ESM consumers

// ✅ Правильно — полный exports field
{
  "name": "my-lib",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "default": "./dist/esm/index.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false
}
```

**Почему:** `exports` field имеет приоритет над `main`. Поддерживает условные экспорты (import/require/types). `sideEffects: false` разрешает бандлерам делать tree shaking безопасно.

---

## 4. Вопросы интервью

**Q1: Каковы ключевые отличия ESM от CommonJS?**

ESM использует статические `import`/`export` директивы, которые парсятся до выполнения кода, что позволяет бандлерам строить граф зависимостей статически. CJS использует `require()`/`module.exports` — динамические вызовы, выполняемые в runtime. ESM поддерживает live bindings (экспорты — живые ссылки на переменные), тогда как CJS копирует значения при деструктуризации. ESM поддерживает top-level await, CJS — нет. ESM асинхронен в браузере, CJS синхронно блокирует поток. В Node.js ESM-файлы имеют расширение `.mjs` или `"type": "module"` в package.json.

---

**Q2: Почему tree shaking работает только с ESM?**

Tree shaking требует статического анализа — способности бандлера определить до выполнения, какие экспорты используются. В ESM `import { fn } from './module'` парсится на уровне синтаксиса: бандлер знает точно, что нужно `fn`, и может удалить всё остальное. В CJS `const { fn } = require('./module')` — это runtime-вызов: `require` может быть внутри условия, цикла, функции, и вернёт произвольный объект. Бандлер не может безопасно определить, что не используется. Поэтому с CJS в бандл всегда попадает весь модуль. Именно для этого у lodash есть `lodash-es` — ESM-версия с полным tree shaking.

---

**Q3: Что такое live bindings в ESM и почему это важно?**

Live binding означает, что именованный экспорт ESM — это не копия значения, а живая ссылка (binding) на переменную в исходном модуле. Когда экспортированная переменная изменяется в модуле-источнике, все импортеры видят актуальное значение. Это ключевое отличие от CJS, где `const { count } = require('./counter')` создаёт копию примитивного значения. Live bindings важны для паттернов с изменяемым состоянием (счётчики, конфигурация) и корректно работают с circular dependencies: модуль получит актуальное значение к моменту его реального использования. Попытка перезаписать именованный импорт в ESM — TypeError, что предотвращает случайные мутации.

---

**Q4: Что такое top-level await и где он работает?**

Top-level await позволяет использовать `await` на верхнем уровне модуля, вне async-функции. Работает только в ESM-модулях (в браузере и Node.js с `"type": "module"`). Модуль с top-level await "приостанавливает" загрузку зависящих от него модулей до завершения await, не блокируя основной поток. Типичные кейсы: загрузка конфигурации перед стартом, динамические импорты на основе условий, инициализация соединений с базой данных. В CJS это невозможно, так как `require()` синхронен. Next.js использует top-level await в Server Components для async/await прямо в теле компонента.

---

**Q5: Как настроить dual package для поддержки ESM и CJS?**

Нужно собрать две версии библиотеки и указать их в `exports` field package.json. Поле `exports` имеет приоритет над `main`. Условие `"import"` применяется для ESM-потребителей, `"require"` — для CJS. Обязательно добавить `"types"` для TypeScript. Поле `"sideEffects": false` сообщает бандлерам, что все файлы безопасны для tree shaking. Важная проблема dual package hazard: если пакет имеет состояние (singleton), оно может быть дублировано при одновременном использовании ESM и CJS версий. Решение — вынести состояние в CJS-обёртку и использовать её из обеих версий.

---

**Q6: Почему "require is not defined" в ESM-контексте?**

`require` — это переменная, которую Node.js автоматически инжектирует в каждый CJS-модуль через module wrapper function. В ESM-модулях (файл `.mjs` или `"type": "module"` в package.json) Node.js не оборачивает код и не добавляет `require`, `module`, `exports`, `__dirname`, `__filename`. Это намеренное решение: ESM и CJS используют разные системы загрузки модулей. Решение: использовать `createRequire` из встроенного модуля `module`: `import { createRequire } from 'module'; const require = createRequire(import.meta.url)`. Для `__dirname` используют `fileURLToPath(import.meta.url)`.

---

**Q7: Как dynamic import() отличается от static import?**

Static `import` — синтаксическая конструкция, обрабатывается до выполнения кода, всегда находится на верхнем уровне модуля, возвращает синхронно разрешённые привязки. Dynamic `import()` — функция, возвращает Promise, может быть вызвана в любом месте кода, в любое время, с любым динамическим путём. Dynamic import используется для: code splitting (lazy loading компонентов), условной загрузки полифилов, загрузки локализаций по требованию, импорта ESM из CJS. В Next.js `dynamic()` — обёртка над `React.lazy` + `import()` с дополнительными опциями (SSR, loading state). Dynamic import всегда загружает модуль целиком — tree shaking к нему не применяется в момент вызова.

---

**Q8: Что такое circular dependency и как ESM vs CJS справляются?**

Circular dependency — когда A импортирует B, а B импортирует A. В CJS это проблема: Node.js возвращает частично инициализированный объект `module.exports` для прерывания цикла. Если A требует B в процессе инициализации, а B требует A — B получит пустой или частичный объект, что приводит к `undefined` для экспортов. В ESM circular dependencies работают корректнее благодаря live bindings: ESM строит граф зависимостей заранее и "знает" о цикле до выполнения. Импорт будет `undefined` в момент инициализации, но станет корректным к моменту реального вызова функции. Лучшее решение — рефакторинг: вынести общий код в третий модуль C, от которого зависят оба A и B.

---

**Q9: Что такое `import.meta` в ESM?**

`import.meta` — объект, доступный в каждом ESM-модуле, содержащий метаданные о текущем модуле. Ключевые свойства: `import.meta.url` — полный URL текущего файла (в Node.js: `file:///path/to/file.mjs`), используется для определения `__dirname` и `__filename`. `import.meta.env` — в Vite/Next.js: переменные окружения (аналог `process.env`). `import.meta.resolve(specifier)` — разрешает спецификатор модуля относительно текущего файла. В Next.js `import.meta.env.NEXT_PUBLIC_*` — переменные, доступные на клиенте. `import.meta` расширяем: бандлеры и рантаймы добавляют свои свойства.

---

## 5. Практическое задание

**Задача:** Реализовать dual package и продемонстрировать tree shaking.

Создайте мини-библиотеку `math-utils` с функциями `add`, `multiply`, `formatCurrency`. Библиотека должна:
1. Поддерживать ESM и CJS через `exports` field
2. Иметь `sideEffects: false` для tree shaking
3. Показать разницу в размере бандла при импорте всей библиотеки vs named import

**Структура проекта:**
```
math-utils/
├── src/
│   ├── math.ts
│   ├── currency.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## 6. Решение с инсайтом

```typescript
// src/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
```

```typescript
// src/currency.ts — тяжёлая функция с зависимостью
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  // Intl.NumberFormat — встроенный, но реально тяжёлая логика
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Представим, что эта функция тянет тяжёлую зависимость
export function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}
```

```typescript
// src/index.ts — barrel export
export { add, multiply, subtract } from './math';
export { formatCurrency, parseAmount } from './currency';
```

```json
// package.json — правильная настройка dual package
{
  "name": "math-utils",
  "version": "1.0.0",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs"
    },
    "./math": {
      "types": "./dist/math.d.ts",
      "import": "./dist/esm/math.js",
      "require": "./dist/cjs/math.cjs"
    },
    "./currency": {
      "types": "./dist/currency.d.ts",
      "import": "./dist/esm/currency.js",
      "require": "./dist/cjs/currency.cjs"
    }
  },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false
}
```

```typescript
// consumer-esm.ts — использование с tree shaking
// ✅ Только add попадёт в бандл (formatCurrency будет удалён)
import { add } from 'math-utils';
console.log(add(2, 3)); // 5

// ✅ Ещё лучше — субпутевой импорт, гарантированный tree shaking
import { add } from 'math-utils/math';
console.log(add(2, 3));

// ❌ Весь barrel — tree shaking зависит от бандлера
import * as mathUtils from 'math-utils';
console.log(mathUtils.add(2, 3)); // formatCurrency МОЖЕТ попасть в бандл
```

```javascript
// consumer-cjs.js — CommonJS потребитель
const { add } = require('math-utils'); // получит CJS версию через exports.require
console.log(add(2, 3));
```

**Демонстрация tree shaking через анализ бандла:**

```typescript
// analyze-bundle.ts (для Rollup)
// rollup.config.js
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  input: 'consumer-esm.ts',
  output: { file: 'dist/bundle.js', format: 'esm' },
  plugins: [
    typescript(),
    visualizer({ filename: 'bundle-stats.html' }),
  ],
});

// Результат с named import { add }:    ~200 bytes (только add)
// Результат с import * as mathUtils:   ~600 bytes (весь модуль)
```

> **Ключевой инсайт:** Tree shaking — это не магия бандлера, а следствие *архитектурного решения*. ESM сделал импорты статическими контрактами, что позволило инструментам видеть "что используется" ещё до запуска кода. Когда пишете библиотеку, `sideEffects: false` + named exports + sub-path exports — это не опциональные оптимизации, а базовый контракт с потребителями вашего пакета.

---

→ Следующая тема: [24 — TypeScript: основы]

---

---

# Тема 24 — TypeScript: основы

← Предыдущая тема: [23 — ESM vs CommonJS]

🔗 Связь с темой 23: TypeScript компилируется в JavaScript (ESM или CJS) — настройка `module` в tsconfig.json напрямую связана с тем, что мы изучали.

---

## 1. Теория с аналогиями

### Аналогия: статический анализатор

TypeScript — как строгий технический инспектор на стройке: он проверяет чертежи *до* начала строительства. JavaScript — прораб, который обнаруживает проблемы уже когда стена упала (runtime). TypeScript не меняет поведение программы — он только добавляет проверки *до* выполнения.

```
JavaScript (runtime errors):          TypeScript (compile-time errors):
──────────────────────────────        ──────────────────────────────────
function greet(user) {                function greet(user: { name: string }) {
  return user.name.toUpperCase();       return user.name.toUpperCase();
}                                     }

greet(null);                          greet(null);
// Запускается нормально              // ❌ Ошибка ДО запуска:
// ↓                                  // Argument of type 'null' is not
// TypeError: Cannot read              //  assignable to parameter of
// properties of null                  //  type '{ name: string }'
// (runtime — поздно!)                // (compile-time — вовремя!)
```

---

### type vs interface — практическое правило

Оба `type` и `interface` описывают форму данных, но имеют важные различия:

```typescript
// interface — для объектов и классов, поддерживает Declaration Merging
interface User {
  id: number;
  name: string;
}

// Declaration Merging: можно расширить в другом месте кода
// (полезно для типизации глобальных объектов, библиотек)
interface User {
  email: string; // автоматически добавится к User
}
// Итого: User = { id, name, email }

// type — для всего остального: объединения, пересечения, примитивы, утилиты
type ID = string | number;                    // union type
type Status = 'active' | 'inactive' | 'pending'; // string literal union
type Nullable<T> = T | null;                  // generic alias
type UserWithRole = User & { role: string };  // intersection
type GetName = (user: User) => string;        // function type
```

**Практическое правило:**

```typescript
// ✅ interface — публичные API объектов, когда ожидается расширение
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// ✅ type — всё остальное: вычисляемые типы, unions, aliases
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

type UserRepository = Repository<User>;
type Optional<T> = T | undefined;
```

| Возможность                    | interface | type |
|-------------------------------|-----------|------|
| Объекты / классы               | ✅        | ✅   |
| Unions (`A \| B`)              | ❌        | ✅   |
| Пересечения (`A & B`)          | extends   | ✅   |
| Declaration Merging            | ✅        | ❌   |
| Mapped types                   | ❌        | ✅   |
| Conditional types              | ❌        | ✅   |
| Примитивы / кортежи            | ❌        | ✅   |

---

### Generics — зачем нужны и как читать

Generics — параметрический полиморфизм: функция/класс работает с *любым типом*, сохраняя типобезопасность.

```
Без generics:               С generics:
──────────────              ────────────────────────────────
function identity(x: any)   function identity<T>(x: T): T
  return x;                   return x;

identity("hello")           identity<string>("hello")  → "hello": string
// возвращает any           identity<number>(42)       → 42: number
// теряем тип!              // TypeScript ЗНАЕТ тип!
```

**Чтение сигнатур generics:**

```typescript
// <T> — произвольный тип (convention: T, U, V для типов; K для ключей; V для значений)
function first<T>(array: T[]): T | undefined {
  return array[0];
}
// first<string>(['a', 'b']) → string | undefined
// first([1, 2, 3])          → number | undefined (TypeScript inferит T = number)

// <T extends ...> — ограничение: T должен быть подтипом указанного
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
//         ↑                              ↑
//  T = { name: string, age: number }    K = 'name' | 'age'
//  Возвращает T[K] — конкретный тип для этого ключа
}

const user = { name: 'Alice', age: 30 };
getProperty(user, 'name');   // → string
getProperty(user, 'age');    // → number
getProperty(user, 'email');  // ❌ Argument '"email"' not assignable to keyof User

// <T = Default> — тип по умолчанию
interface Container<T = string> {
  value: T;
  label: string;
}
const c1: Container = { value: 'hello', label: 'text' }; // T = string (default)
const c2: Container<number> = { value: 42, label: 'count' }; // T = number
```

**Реальный паттерн — типобезопасный API-клиент:**

```typescript
// Типобезопасный fetch с generics
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  // as Promise<T> — type assertion, так как fetch().json() возвращает Promise<unknown>
  return res.json() as Promise<T>;
}

// TypeScript знает точный тип возвращаемого значения
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
}

const user = await apiFetch<User>('/api/user/1');
// user: User — TypeScript знает все поля!
user.name;   // ✅ string
user.phone;  // ❌ Property 'phone' does not exist on type 'User'

const posts = await apiFetch<Post[]>('/api/posts');
// posts: Post[]
posts[0].title; // ✅ string
```

---

### Utility Types — встроенные трансформации типов

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Partial<T> — все поля опциональны (для patch-запросов)
type UpdateUserDTO = Partial<User>;
// { id?: number; name?: string; email?: string; ... }

// Required<T> — все поля обязательны (обратное Partial)
type CompleteUser = Required<User>;

// Readonly<T> — все поля readonly (иммутабельность)
type FrozenUser = Readonly<User>;
// const u: FrozenUser = {...}; u.name = 'x'; // ❌ Cannot assign to 'name'

// Pick<T, K> — выбрать только указанные поля
type UserPublicProfile = Pick<User, 'id' | 'name' | 'role'>;
// { id: number; name: string; role: 'admin' | 'user' }

// Omit<T, K> — исключить указанные поля
type UserWithoutPassword = Omit<User, 'password'>;
// { id: number; name: string; email: string; role: ...; createdAt: Date }

// Record<K, V> — объект с ключами K и значениями V
type UserMap = Record<string, User>;
// { [key: string]: User }

type StatusMessages = Record<'success' | 'error' | 'loading', string>;
// { success: string; error: string; loading: string }

// Exclude<T, U> — из union T удалить типы, входящие в U
type NonAdmin = Exclude<'admin' | 'user' | 'guest', 'admin'>;
// 'user' | 'guest'

// Extract<T, U> — из union T оставить только типы, входящие в U
type AdminOnly = Extract<'admin' | 'user' | 'guest', 'admin' | 'superadmin'>;
// 'admin'

// ReturnType<T> — тип возвращаемого значения функции
function createUser(name: string, email: string): User {
  return { id: 1, name, email, password: '', role: 'user', createdAt: new Date() };
}
type CreatedUser = ReturnType<typeof createUser>; // User

// NonNullable<T> — убирает null и undefined
type SafeUser = NonNullable<User | null | undefined>; // User

// Parameters<T> — типы параметров функции
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, email: string]
```

---

### Type Narrowing — сужение типов

TypeScript сужает тип переменной внутри условных блоков:

```typescript
// typeof — для примитивов
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase(); // value: string здесь
  }
  return value.toFixed(2); // value: number здесь
}

// instanceof — для классов
function handleError(error: Error | string): void {
  if (error instanceof TypeError) {
    console.error('Type error:', error.message); // error: TypeError
  } else if (error instanceof Error) {
    console.error('Error:', error.message);      // error: Error
  } else {
    console.error('String error:', error);       // error: string
  }
}

// "key" in obj — проверка наличия поля
interface Dog { bark(): void; breed: string; }
interface Cat { meow(): void; color: string; }

function makeSound(animal: Dog | Cat): void {
  if ('bark' in animal) {
    animal.bark(); // animal: Dog
  } else {
    animal.meow(); // animal: Cat
  }
}

// Array.isArray()
function processItems(items: string | string[]): string[] {
  if (Array.isArray(items)) {
    return items; // items: string[]
  }
  return [items]; // items: string
}

// Discriminated Union (тегированное объединение) — самый мощный паттерн
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function handleState<T>(state: LoadingState<T>): string {
  switch (state.status) {
    case 'idle':    return 'Ожидание';
    case 'loading': return 'Загрузка...';
    case 'success': return `Данные: ${JSON.stringify(state.data)}`; // state.data доступен
    case 'error':   return `Ошибка: ${state.error.message}`;        // state.error доступен
    default:
      // Exhaustiveness check — TypeScript подскажет, если добавить новый статус
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

---

### unknown vs any vs never

```typescript
// any — отключает TypeScript полностью (избегать!)
let dangerous: any = 'hello';
dangerous.toUpperCase(); // ✅ TypeScript не проверяет
dangerous.foo.bar.baz;   // ✅ TypeScript не проверяет — но runtime error!

// unknown — безопасная альтернатива any
// Принимает любое значение, но нельзя использовать без narrowing
let safe: unknown = 'hello';
safe.toUpperCase();    // ❌ Object is of type 'unknown'
safe.foo;              // ❌ Object is of type 'unknown'

// ✅ Сначала нужно сузить тип
if (typeof safe === 'string') {
  safe.toUpperCase(); // ✅ Теперь safe: string
}

// Практика: используйте unknown для внешних данных
async function fetchData(): Promise<unknown> {
  return await fetch('/api').then(r => r.json());
}

const data = await fetchData(); // data: unknown
// Нужно валидировать перед использованием:
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log((data as { name: string }).name);
}

// never — тип для кода, который никогда не выполнится
// 1. Функция, которая всегда бросает исключение
function throwError(message: string): never {
  throw new Error(message);
}

// 2. Бесконечный цикл
function infiniteLoop(): never {
  while (true) { /* ... */ }
}

// 3. Exhaustiveness checking в discriminated union
type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'square': return shape.side ** 2;
    default:
      // Если добавить новый вид Shape и забыть обработать —
      // TypeScript выдаст ошибку здесь
      const _check: never = shape; // ❌ если shape не never — ошибка компиляции
      throw new Error(`Unknown shape: ${_check}`);
  }
}
```

```
        any                unknown              never
─────────────────    ─────────────────    ─────────────────
Принимает всё: ✅    Принимает всё: ✅    Не принимает: ❌
Даёт всё: ✅         Даёт всё: ❌         Не даёт ничего
Проверяет: ❌         (нужен narrowing)    (пустое множество)
                     Проверяет: ✅         Используется как
                                           маркер "невозможно"
```

---

## 2. Связь со стеком

### TypeScript в Next.js App Router

```typescript
// app/users/[id]/page.tsx — типизация страниц (Next.js 14+)
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;        // Next.js 15: params — Promise
  searchParams: Promise<{ tab?: string }>; // searchParams тоже Promise
}

export default async function UserPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  
  const user = await apiFetch<User>(`/api/users/${id}`);
  
  if (!user) notFound();
  
  return <UserProfile user={user} activeTab={tab ?? 'overview'} />;
}

// Типизация Server Actions
'use server';

interface CreateUserInput {
  name: string;
  email: string;
}

// FormData → типизированный объект
export async function createUser(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; user?: User }> {
  const input: CreateUserInput = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  };
  
  // Валидация...
  const user = await db.user.create({ data: input });
  return { user };
}
```

### Generics в React хуках

```typescript
// useState с generics
const [user, setUser] = useState<User | null>(null);
// user: User | null — TypeScript знает

const [items, setItems] = useState<string[]>([]);
// items: string[]

// useRef с generics
const inputRef = useRef<HTMLInputElement>(null);
// inputRef.current: HTMLInputElement | null

function focusInput() {
  inputRef.current?.focus(); // ✅ optional chaining — current может быть null
}

// useReducer с discriminated union
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean };

interface State {
  user: User | null;
  loading: boolean;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload }; // payload: User
    case 'CLEAR_USER':  return { ...state, user: null };
    case 'SET_LOADING': return { ...state, loading: action.payload }; // payload: boolean
  }
}

const [state, dispatch] = useReducer(reducer, { user: null, loading: false });
```

### TypeScript strict mode

```json
// tsconfig.json — что включает strict: true
{
  "compilerOptions": {
    "strict": true,
    // Эквивалентно включению всех этих флагов:
    // "noImplicitAny": true,          — нельзя использовать неявный any
    // "strictNullChecks": true,       — null/undefined не совместимы с другими типами
    // "strictFunctionTypes": true,    — строгая проверка типов функций
    // "strictBindCallApply": true,    — строгая проверка bind/call/apply
    // "strictPropertyInitialization": true, — все поля класса должны быть инициализированы
    // "noImplicitThis": true,         — this не может быть any
    // "alwaysStrict": true,           — добавляет "use strict" в каждый файл
    // "useUnknownInCatchVariables": true — catch(e) → e имеет тип unknown
  }
}
```

---

## 3. Лучшие паттерны

### Паттерн 1: interface для публичных API, type для остального

```typescript
// ❌ Антипаттерн — type для всего подряд
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

// Нельзя расширить через Declaration Merging
// Трудно расширять в других частях кодовой базы

// ✅ Правильно — interface для компонентных props (публичный API)
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// Легко расширить:
interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// ✅ type для вычисляемых/union типов
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonState = 'idle' | 'loading' | 'success' | 'error';

// Пересечение через type (не через extends)
type FullButtonProps = ButtonProps & {
  size: ButtonSize;
  state: ButtonState;
};
```

**Почему:** `interface` расширяем через Declaration Merging (критично для типизации глобальных объектов и библиотек). `type` необходим для unions, mapped types, conditional types.

---

### Паттерн 2: Generics вместо any

```typescript
// ❌ Антипаттерн — any убивает типобезопасность
function first(arr: any[]): any {
  return arr[0];
}
const result = first(['hello', 'world']);
result.toUpperCase(); // Работает, но TypeScript не поможет с ошибками
result.nonExistentMethod(); // ✅ TypeScript — но ❌ runtime error

// ✅ Правильно — generics сохраняют тип
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const str = first(['hello', 'world']); // str: string | undefined
str?.toUpperCase();          // ✅
str?.nonExistentMethod();    // ❌ Ошибка компиляции! (правильно)

const num = first([1, 2, 3]); // num: number | undefined
num?.toFixed(2);              // ✅

// ❌ Ещё хуже — any в API-клиентах
async function fetchUser(): Promise<any> {
  return fetch('/api/user').then(r => r.json());
}
const user = await fetchUser();
user.naem; // ✅ TypeScript, но ❌ typo! 'naem' вместо 'name'

// ✅ Generic с интерфейсом
async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
const user = await apiFetch<User>('/api/user');
user.naem; // ❌ Property 'naem' does not exist on type 'User' (поймано!)
```

**Почему:** `any` отключает TypeScript. Generics — способ писать гибкий код, не теряя типобезопасность.

---

### Паттерн 3: Utility Types вместо ручного дублирования

```typescript
// ❌ Антипаттерн — вручную копировать и изменять типы
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// Дублирование с изменениями:
interface UpdateUserDTO { // 6 раз повторяем поля!
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
}

interface PublicUser { // снова дублируем
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}
// При изменении User — нужно обновлять все копии вручную

// ✅ Правильно — derived types через Utility Types
type UpdateUserDTO = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
// Автоматически: { name?: string; email?: string; password?: string; role?: ... }

type PublicUser = Omit<User, 'password'>;
// Автоматически: { id, name, email, role, createdAt, updatedAt }

type UserSummary = Pick<User, 'id' | 'name' | 'role'>;
// { id: number; name: string; role: 'admin' | 'user' }

// При добавлении поля в User — UpdateUserDTO/PublicUser обновятся автоматически!
```

**Почему:** Derived types — Single Source of Truth. Изменение базового типа автоматически распространяется на все производные.

---

### Паттерн 4: Discriminated Union для состояний

```typescript
// ❌ Антипаттерн — отдельные флаги состояния
interface BadState {
  data: User | null;
  loading: boolean;
  error: string | null;
}
// Невалидные комбинации: loading=true И data=User одновременно
// TypeScript не защищает от этого

// ✅ Правильно — discriminated union
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Каждое состояние имеет только свои поля
// Невозможно создать противоречивое состояние

function UserCard({ state }: { state: FetchState<User> }) {
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') return <ErrorView error={state.error} />;
  // state.error — гарантированно существует здесь (TypeScript narrowing!)
  
  if (state.status === 'success') return <div>{state.data.name}</div>;
  // state.data — гарантированно существует здесь

  return null; // idle
}
```

**Почему:** Discriminated union делает невалидные состояния невыразимыми в системе типов. TypeScript narrowing по `status` даёт доступ только к полям этого состояния.

---

## 4. Вопросы интервью

**Q1: Чем отличается type от interface в TypeScript?**

Оба описывают форму объекта, но имеют принципиальные различия. `interface` поддерживает Declaration Merging — одноимённые интерфейсы в разных местах кода автоматически объединяются, что критично для типизации глобальных объектов и расширения сторонних библиотек. `type` поддерживает unions (`A | B`), mapped types, conditional types, aliases для примитивов — всё то, что невозможно через `interface`. Практическое правило: `interface` для публичных API объектов и компонентных пропсов (когда ожидается расширение), `type` для всего остального. В большинстве случаев взаимозаменяемы, но опытный разработчик выбирает осознанно.

---

**Q2: Что такое generics и зачем они нужны?**

Generics — параметрический полиморфизм: способность функции, класса или интерфейса работать с разными типами, сохраняя типобезопасность. Без generics приходится выбирать между `any` (теряем тип) и дублированием кода (отдельная функция для каждого типа). Generics решают это: `function first<T>(arr: T[]): T | undefined` — одна реализация, но TypeScript выводит конкретный тип при каждом вызове. `<T extends ...>` ограничивает допустимые типы (constraint). `<T = Default>` задаёт тип по умолчанию. В React generics повсюду: `useState<User | null>`, `useRef<HTMLDivElement>`, `Promise<T>`, `Array<T>`.

---

**Q3: Что такое Utility Types? Назовите пять примеров.**

Utility Types — встроенные трансформации типов, которые строят новые типы на основе существующих. Пять ключевых: `Partial<T>` — все поля становятся опциональными (для PATCH-запросов); `Required<T>` — все поля становятся обязательными; `Omit<T, K>` — исключает указанные поля (для удаления `password` из публичного типа User); `Pick<T, K>` — оставляет только указанные поля; `Record<K, V>` — создаёт объект с ключами типа K и значениями V. Также важны: `Readonly<T>`, `ReturnType<T>`, `Parameters<T>`, `Exclude<T, U>`, `Extract<T, U>`, `NonNullable<T>`. Utility Types — Single Source of Truth: производные типы обновляются автоматически при изменении базового.

---

**Q4: Что такое type narrowing?**

Type narrowing — процесс уточнения типа переменной в определённом блоке кода на основе условных проверок. TypeScript анализирует control flow и "сужает" тип. Механизмы narrowing: `typeof` (для примитивов), `instanceof` (для классов), `in` (проверка поля в объекте), `Array.isArray()`, equality checks (`=== null`), type guards (функции, возвращающие `x is Type`). Самый мощный паттерн — discriminated union: поле-дискриминатор (обычно `status` или `type`) с литеральными типами позволяет TypeScript автоматически сужать тип в switch/if блоках. Exhaustiveness check через `never` гарантирует обработку всех вариантов.

---

**Q5: В чём разница unknown vs any?**

Оба принимают значение любого типа, но `any` отключает систему типов — TypeScript позволяет любые операции с `any` без проверок. `unknown` — "безопасный any": значение можно присвоить, но нельзя использовать без предварительного narrowing. С `unknown` TypeScript требует явной проверки типа перед любой операцией. Правило: используйте `unknown` для значений из внешних источников (JSON.parse, fetch, catch блоки), для параметров обобщённых функций, для значений, тип которых вы не знаете заранее. `any` оправдан только для постепенной миграции JS→TS или при работе с динамически типизированными legacy API.

---

**Q6: Что такое discriminated union?**

Discriminated union (тегированное объединение) — паттерн, где объединение типов имеет общее поле-дискриминатор с литеральным типом. TypeScript использует это поле для narrowing. Паттерн решает проблему "невалидных состояний": вместо `{ data: T | null, loading: boolean, error: string | null }` (где возможны противоречивые комбинации) используют `{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }`. Ключевое преимущество — TypeScript автоматически даёт доступ только к полям конкретного варианта. В switch/case с полным покрытием TypeScript проверяет exhaustiveness через `never`. Активно используется в Redux actions, Result types, состояниях загрузки данных.

---

**Q7: Разница type assertion (as) и type guard?**

`as` (type assertion) — говорит TypeScript "я знаю лучше, считай этот тип T", без runtime-проверки. Это обман компилятора: `const user = data as User` — TypeScript поверит, даже если `data` — строка. Опасно, может привести к runtime-ошибкам. Type guard — функция с предикатом `x is T` в сигнатуре, которая выполняет runtime-проверку и сужает тип. `function isUser(x: unknown): x is User { return typeof x === 'object' && x !== null && 'id' in x }` — TypeScript сузит тип внутри `if (isUser(data))`. Type guard безопасен: проверка реально происходит. Правило: предпочитайте type guards для данных из внешних источников, `as` используйте только когда уверены в типе и нет возможности использовать guard.

---

**Q8: Что такое infer и как использовать?**

`infer` — ключевое слово для "захвата" типа внутри conditional type. Позволяет TypeScript вывести и именовать часть типа. Классические примеры из стандартной библиотеки: `type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never` — захватывает тип возвращаемого значения функции в переменную R. `type UnwrapPromise<T> = T extends Promise<infer U> ? U : T` — извлекает тип из Promise. `infer` работает только в extends клаузе conditional type. Практика: `infer` нужен когда хотите "достать" часть типа — тип элемента массива, тип параметра, тип значения в объекте. Без `infer` пришлось бы писать отдельную функцию-обёртку для каждого случая.

---

**Q9: Что делает strict mode в TypeScript?**

`strict: true` в tsconfig — зонтичный флаг, включающий набор строгих проверок. Главные: `noImplicitAny` — запрещает неявный `any` (нужно явно аннотировать или TypeScript выведет), `strictNullChecks` — `null` и `undefined` не являются подтипами других типов (нужна явная проверка), `strictFunctionTypes` — контравариантная проверка типов параметров функций, `noImplicitThis` — `this` не может быть `any`, `useUnknownInCatchVariables` — переменная в `catch(e)` имеет тип `unknown` вместо `any`. `strictNullChecks` — самый важный: без него TypeScript не замечает большинство NullPointerException. В Next.js и modern React проектах `strict: true` — стандарт. Включение строгого режима на существующем проекте обычно выявляет сотни скрытых ошибок.

---

## 5. Практическое задание

**Задача:** Реализовать типобезопасный API-клиент с generics и React хук `useFetch<T>`.

Требования:
1. Функция `apiFetch<T>` с обработкой ошибок
2. Тип `LoadingState<T>` как discriminated union
3. React хук `useFetch<T>` возвращающий `LoadingState<T>`
4. React компонент `UserCard` с type narrowing
5. Exhaustiveness check в switch-case

**Типы данных:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}
```

---

## 6. Решение с инсайтом

```typescript
// types.ts — базовые типы
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

// LoadingState — discriminated union для состояний загрузки
export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

```typescript
// api.ts — типобезопасный API-клиент
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch — T определяется при вызове
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}: ${res.statusText}`, res.status);
  }

  // res.json() → unknown в строгом TypeScript
  // as Promise<T> — assertion, так как мы контролируем API
  return res.json() as Promise<T>;
}

// POST helper с типизированным body
export async function apiPost<TBody, TResponse>(
  url: string,
  body: TBody
): Promise<TResponse> {
  return apiFetch<TResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

```typescript
// hooks/useFetch.ts — React хук с generics
import { useState, useEffect, useCallback } from 'react';
import { LoadingState } from '../types';
import { apiFetch } from '../api';

interface UseFetchOptions {
  immediate?: boolean; // загружать сразу или по требованию
}

interface UseFetchResult<T> {
  state: LoadingState<T>;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = { immediate: true }
): UseFetchResult<T> {
  // useState с generic — TypeScript знает точный тип
  const [state, setState] = useState<LoadingState<T>>({ status: 'idle' });

  const fetch = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      // T "протекает" через всю цепочку вызовов
      const data = await apiFetch<T>(url);
      setState({ status: 'success', data });
    } catch (err) {
      // useUnknownInCatchVariables: err имеет тип unknown
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: 'error', error });
    }
  }, [url]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  useEffect(() => {
    if (options.immediate) {
      fetch();
    }
  }, [fetch, options.immediate]);

  return { state, refetch: fetch, reset };
}
```

```tsx
// components/UserCard.tsx — type narrowing в React компоненте
import React from 'react';
import { useFetch } from '../hooks/useFetch';
import { User, LoadingState } from '../types';

// Вспомогательные компоненты для наглядности
function Spinner() { return <div className="spinner">Loading...</div>; }
function ErrorView({ error }: { error: Error }) {
  return <div className="error">Error: {error.message}</div>;
}

// Функция рендеринга с полным exhaustiveness check
function renderState<T>(
  state: LoadingState<T>,
  renderSuccess: (data: T) => React.ReactNode
): React.ReactNode {
  switch (state.status) {
    case 'idle':
      return <div className="idle">Ожидание запроса...</div>;
    
    case 'loading':
      return <Spinner />;
    
    case 'success':
      // TypeScript знает: state.data существует и имеет тип T
      return renderSuccess(state.data);
    
    case 'error':
      // TypeScript знает: state.error существует и имеет тип Error
      return <ErrorView error={state.error} />;
    
    default:
      // Exhaustiveness check — если добавить новый статус и забыть обработать,
      // TypeScript выдаст ошибку: Type 'NewStatus' is not assignable to type 'never'
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${JSON.stringify(_exhaustive)}`);
  }
}

// Компонент с type narrowing
export function UserCard({ userId }: { userId: number }) {
  const { state, refetch } = useFetch<User>(
    `/api/users/${userId}`
  );

  return (
    <div className="user-card">
      {renderState(state, (user) => (
        // Здесь user: User — TypeScript гарантирует все поля
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className={`badge ${user.role}`}>{user.role}</span>
        </div>
      ))}
      
      <button onClick={refetch}>Обновить</button>
    </div>
  );
}

// Пример использования с разными типами — generics в действии
export function PostList({ userId }: { userId: number }) {
  // useFetch<Post[]> — тот же хук, другой тип
  const { state } = useFetch<{ posts: Post[]; total: number }>(
    `/api/posts?userId=${userId}`
  );

  return (
    <div>
      {renderState(state, ({ posts, total }) => (
        // posts: Post[], total: number — TypeScript знает!
        <div>
          <h3>Постов: {total}</h3>
          {posts.map(post => (
            <article key={post.id}>
              <h4>{post.title}</h4>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
```

```typescript
// Бонус: продвинутые паттерны с infer и conditional types
// -------------------------------------------------------

// Извлечение типа данных из LoadingState
type ExtractData<S> = S extends { status: 'success'; data: infer T } ? T : never;

type UserData = ExtractData<LoadingState<User>>; // User
type PostData = ExtractData<LoadingState<Post>>; // Post
type IdleData = ExtractData<{ status: 'idle' }>; // never

// Type-safe event handlers
type EventHandler<T extends HTMLElement = HTMLElement> = 
  React.EventHandler<React.SyntheticEvent<T>>;

type ChangeHandler = EventHandler<HTMLInputElement>;
// React.EventHandler<React.SyntheticEvent<HTMLInputElement>>

// Рекурсивный тип для DeepPartial
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type PartialUser = DeepPartial<User>;
// Все вложенные поля опциональны рекурсивно
```

> **Ключевой инсайт:** TypeScript не делает код "длиннее" — он делает его *самодокументирующимся и безопасным*. `useFetch<T>` — один хук для любого API-эндпоинта. `LoadingState<T>` — паттерн, который физически невозможно использовать неправильно: невалидные состояния не компилируются. Discriminated union + exhaustiveness check — это не просто типизация, это архитектурный паттерн, который заставляет разработчика обрабатывать все случаи. Когда TypeScript ругается — это не помеха, это инструмент думать о коде правильнее.

---

→ Следующая тема: [25 — Паттерны проектирования] (Раздел 8: Паттерны)

---

*Конец Раздела 7 — Модули и TypeScript*
