# Контент курса — Раздел 5: Асинхронность

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 5 — Темы 15–18 (Promise · async/await · Promise.all/race/any · Callbacks)

---

# Раздел 5 — Асинхронность

*Асинхронность — сердце современного JavaScript. В этом разделе мы идём от исторических основ (callbacks) к Promise и async/await — двум уровням абстракции, которые делают async-код читаемым. Понимание Event Loop (Тема 1, Раздел 1) критично для этого раздела: именно он объясняет, ПОЧЕМУ async/await работает так, а не иначе.*

🔗 **Связь с разделами:** Event Loop (Тема 1) — фундамент для понимания всего раздела. Обработка ошибок (Раздел 8) применяет паттерны из этого раздела.

---

## Тема 15: Promise

← Предыдущая тема: [14 — Замыкания и область видимости]

---

### 1. Теория с аналогиями

#### Аналогия: Заказ в ресторане с номерком

Вы пришли в ресторан, сделали заказ и получили **номерок** — это и есть Promise. Вы не стоите у кассы в ожидании (блокирующий код). Вы идёте за столик, общаетесь, читаете меню — жизнь продолжается. Когда блюдо готово — вас позовут (колбэк `.then`). Если на кухне случился пожар — вас оповестят об ошибке (`.catch`). Неважно что произошло — вы всё равно уйдёте (`.finally`).

Ключевое: **номерок не превратится обратно в "ещё не заказано"** — это необратимость состояния.

---

#### Три состояния Promise

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        PROMISE                              │
  │                                                             │
  │   ┌──────────┐                                             │
  │   │ pending  │ ← начальное состояние (номерок выдан)       │
  │   └────┬─────┘                                             │
  │        │                                                    │
  │    ┌───┴────────────────────┐                              │
  │    ▼                        ▼                              │
  │ ┌──────────┐          ┌──────────┐                         │
  │ │fulfilled │          │ rejected │                         │
  │ │(resolved)│          │          │                         │
  │ └──────────┘          └──────────┘                         │
  │  блюдо готово          пожар на кухне                      │
  │                                                             │
  │  ⚠️  Переход НЕОБРАТИМ — fulfilled не станет rejected       │
  └─────────────────────────────────────────────────────────────┘
```

```typescript
const promise = new Promise<string>((resolve, reject) => {
  // executor запускается синхронно
  const success = Math.random() > 0.5;

  if (success) {
    resolve("Ваш заказ готов!"); // fulfilled
  } else {
    reject(new Error("Кухня закрыта")); // rejected
  }
});

// После resolve/reject — состояние заморожено навсегда
// Повторный вызов resolve/reject игнорируется
```

---

#### Цепочка .then(): каждый вызов возвращает НОВЫЙ Promise

```
  promise
     │
     ▼
  .then(a → b)   ← принимает значение, возвращает новый Promise
     │
     ▼
  .then(b → c)   ← принимает b, возвращает новый Promise
     │
     ▼
  .then(c → d)
     │
     ▼
  .catch(err)    ← ловит ошибку из ЛЮБОГО шага выше
```

```typescript
fetch("/api/user")
  .then((response) => {
    // response.json() сам возвращает Promise
    // .then автоматически "разворачивает" вложенный Promise
    return response.json();
  })
  .then((user: { id: number; name: string }) => {
    // получаем уже распарсенный объект, не Promise
    return fetch(`/api/posts?userId=${user.id}`);
  })
  .then((response) => response.json())
  .then((posts) => {
    console.log(posts);
  })
  .catch((error) => {
    // ловит ошибку из ЛЮБОГО .then() выше
    console.error("Что-то пошло не так:", error);
  })
  .finally(() => {
    // выполнится в любом случае — скрыть лоадер
    hideLoadingSpinner();
  });
```

---

#### Механизм распространения ошибок

```typescript
Promise.resolve(1)
  .then((v) => {
    throw new Error("ошибка на шаге 2"); // бросаем ошибку
  })
  .then((v) => {
    // ЭТО НЕ ВЫПОЛНИТСЯ — Promise уже rejected
    console.log("шаг 3");
    return v * 2;
  })
  .then((v) => {
    // И ЭТО НЕ ВЫПОЛНИТСЯ
    return v + 1;
  })
  .catch((err) => {
    // Ловим здесь — err.message === "ошибка на шаге 2"
    console.error(err.message);
    return "восстановились!"; // возвращаем значение — цепочка продолжается
  })
  .then((v) => {
    // Выполнится: v === "восстановились!"
    console.log(v);
  });
```

---

#### Разница .catch() и второго аргумента .then()

```typescript
// Вариант A: второй аргумент .then() — ловит только ЭТОТ шаг
promise.then(
  (value) => processValue(value),
  (error) => handleError(error) // НЕ поймает ошибку из processValue!
);

// Вариант B: .catch() в конце — ловит ошибки из ВСЕЙ цепочки
promise
  .then((value) => processValue(value)) // если здесь throw — .catch поймает
  .catch((error) => handleError(error));

// ✅ Рекомендация: всегда использовать .catch() в конце цепочки
```

---

### 2. Связь со стеком

#### Next.js: Server Actions возвращают Promise

```typescript
// app/actions.ts
"use server";

export async function createUser(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.create({
      data: { name: formData.get("name") as string },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Не удалось создать пользователя" };
  }
}

// app/components/CreateUserForm.tsx — клиентский компонент
"use client";
import { createUser } from "@/app/actions";

function CreateUserForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createUser(formData); // Server Action — Promise
    if (!result.success) {
      showError(result.error);
    }
  };
  // ...
}
```

#### React 19: use() hook и Promise

```typescript
// React 19 — use() разворачивает Promise прямо в компоненте
// Работает вместе с Suspense

import { use, Suspense } from "react";

// Создаём promise за пределами компонента (важно!)
const userPromise = fetch("/api/user").then((r) => r.json());

function UserProfile() {
  // use() приостанавливает рендер до разрешения promise
  // Suspense выше покажет fallback в это время
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile />
    </Suspense>
  );
}
```

#### Promise.allSettled для параллельных виджетов

```typescript
// app/dashboard/page.tsx — Next.js App Router
export default async function DashboardPage() {
  // Загружаем все данные параллельно
  // allSettled: если один упадёт — остальные всё равно отобразятся
  const [usersResult, statsResult, notificationsResult] =
    await Promise.allSettled([
      fetchUsers(),
      fetchStats(),
      fetchNotifications(),
    ]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <UsersWidget
        data={usersResult.status === "fulfilled" ? usersResult.value : null}
        error={usersResult.status === "rejected" ? usersResult.reason : null}
      />
      <StatsWidget
        data={statsResult.status === "fulfilled" ? statsResult.value : null}
        error={statsResult.status === "rejected" ? statsResult.reason : null}
      />
      <NotificationsWidget
        data={
          notificationsResult.status === "fulfilled"
            ? notificationsResult.value
            : null
        }
        error={
          notificationsResult.status === "rejected"
            ? notificationsResult.reason
            : null
        }
      />
    </div>
  );
}
```

---

### 3. Лучшие паттерны

#### Паттерн 1: Всегда обрабатывать ошибки

```typescript
// ❌ Антипаттерн — неотловленный rejected promise
fetch("/api/data")
  .then((r) => r.json())
  .then((data) => processData(data));
// UnhandledPromiseRejection: упадёт при сетевой ошибке или 404

// ✅ Правильно — обработка ошибок обязательна
fetch("/api/data")
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((data) => processData(data))
  .catch((error) => {
    logger.error("Fetch failed:", error);
    return getDefaultData(); // graceful degradation
  });

// Объяснение: Node.js (и браузер) выбрасывают предупреждение/завершают процесс
// при unhandled rejection. В production это критическая ошибка.
```

#### Паттерн 2: Promise.allSettled для независимых операций

```typescript
// ❌ Антипаттерн — Promise.all прерывает всё при одной ошибке
const [users, stats, logs] = await Promise.all([
  fetchUsers(), // если упадёт...
  fetchStats(), // ...stats и logs тоже не получим
  fetchLogs(),
]);

// ✅ Правильно — каждая операция независима
const results = await Promise.allSettled([
  fetchUsers(),
  fetchStats(),
  fetchLogs(),
]);

const [usersResult, statsResult, logsResult] = results;

// Обрабатываем каждый результат индивидуально
const users =
  usersResult.status === "fulfilled" ? usersResult.value : [];
const stats =
  statsResult.status === "fulfilled" ? statsResult.value : defaultStats;
const logs =
  logsResult.status === "fulfilled" ? logsResult.value : [];

// Объяснение: allSettled гарантирует получение всех результатов,
// даже если часть запросов упала. Идеально для дашбордов и независимых виджетов.
```

#### Паттерн 3: Промисификация callback-based API

```typescript
// ❌ Антипаттерн — смешивать Promise и callback в одном флоу
function readConfig(callback: (err: Error | null, data?: string) => void) {
  fs.readFile("config.json", "utf8", (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, data);
  });
}

// Использование: приходится вкладывать в цепочку через awkward wrapper
new Promise((resolve, reject) => {
  readConfig((err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
}).then(/* ... */);

// ✅ Правильно — промисификация один раз, использовать везде
import { promisify } from "util";
import fs from "fs";

const readFile = promisify(fs.readFile);

// Или вручную — для понимания механизма
function readFileAsync(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Теперь интегрируется в любую async/await цепочку
const config = await readFileAsync("config.json");

// Объяснение: промисификация — мост между legacy callback API
// и современным Promise/async-await миром.
```

---

### 4. Вопросы интервью

**Q1: Что такое Promise и зачем он нужен?**

Promise — объект, представляющий результат асинхронной операции, который будет доступен в будущем. До Promise асинхронность реализовывалась через callbacks, что порождало "callback hell" и проблему инверсии управления. Promise решает обе проблемы: цепочки `.then()` читаются линейно, а контроль над кодом остаётся у вас. Promise может находиться в трёх состояниях: pending, fulfilled, rejected. После перехода в fulfilled или rejected состояние заморожено навсегда. Это делает поведение предсказуемым и устраняет гонки состояний.

**Q2: Что такое три состояния Promise и почему они необратимы?**

Pending (ожидание) — начальное состояние после создания. Fulfilled (выполнен) — операция успешно завершена, значение доступно. Rejected (отклонён) — операция завершилась ошибкой, причина доступна. Необратимость — фундаментальное свойство: once settled, always settled. Это гарантирует, что колбэк `.then()` вызовется ровно один раз. Если бы состояния менялись, это сломало бы логику обработки — нельзя было бы полагаться на то, что успешный результат останется успешным.

**Q3: Как работает цепочка .then() и почему каждый .then возвращает новый Promise?**

Каждый вызов `.then(handler)` создаёт и возвращает новый Promise. Если handler возвращает значение — новый Promise разрешается этим значением. Если handler возвращает Promise — новый Promise "принимает" его состояние (flattening). Если handler бросает ошибку — новый Promise отклоняется. Это позволяет строить линейные цепочки вместо вложенных колбэков. Важно: `.then()` всегда возвращает новый Promise, а не тот же самый — это делает цепочки composable.

**Q4: В чём разница Promise.all и Promise.allSettled?**

`Promise.all` разрешается когда ВСЕ промисы выполнились, но **отклоняется немедленно** при первой же ошибке — остальные промисы продолжают выполняться, но их результаты игнорируются. `Promise.allSettled` всегда ждёт завершения ВСЕХ промисов и возвращает массив объектов `{status, value/reason}` для каждого. Правило выбора: если все операции зависят друг от друга — `Promise.all`; если операции независимы и нужны все результаты даже при частичных ошибках — `Promise.allSettled`.

**Q5: Что такое Promise.race и когда его использовать?**

`Promise.race` разрешается или отклоняется результатом первого завершившегося промиса — победитель определяет итог, остальные игнорируются. Классические применения: таймаут для fetch (race с `new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))`), показ первого загрузившегося результата из нескольких источников. Важно: проигравшие промисы не отменяются — они продолжают выполняться, просто их результаты уже никто не ждёт. Для настоящей отмены используйте AbortController.

**Q6: В чём разница между .catch() в конце и вторым аргументом .then()?**

Второй аргумент `.then(onFulfilled, onRejected)` — `onRejected` ловит только ошибки из предыдущего Promise, но НЕ ловит ошибки, выброшенные в `onFulfilled`. `.catch(handler)` в конце цепочки ловит ошибки из ЛЮБОГО предшествующего шага, включая ошибки внутри `.then()`. На практике почти всегда предпочтительнее `.catch()` — он покрывает весь путь и явно выражает намерение "если что-то пошло не так на любом шаге".

**Q7: Что делает .finally() и чем отличается от .then(fn, fn)?**

`.finally(handler)` выполняется независимо от исхода — и при fulfilled, и при rejected. В отличие от `.then()`, handler не получает значения/ошибки и не может их изменить: `.finally` прозрачно пропускает значение дальше по цепочке. Идеальное место для cleanup-логики: скрыть лоадер, закрыть соединение, освободить ресурс. Нельзя путать с `.then(fn, fn)` — второй вариант требует дублирования кода в обоих колбэках, `.finally` устраняет это.

**Q8: Что такое Promise chaining и как избежать "Promise hell"?**

Promise hell — вложенные цепочки Promise вместо линейных, антипаттерн аналогичный callback hell. Возникает когда забывают `return` внутри `.then()` или создают ненужные вложения. Решение: всегда возвращать Promise из `.then()`, использовать плоские цепочки, переходить на `async/await` для сложной логики. Правило: если вы видите `.then()` внутри `.then()` — это обычно ошибка архитектуры.

**Q9: Что произойдёт, если вызвать resolve() несколько раз?**

Повторные вызовы `resolve()` или `reject()` после первого игнорируются без ошибок. Promise — state machine с одноразовым переходом: как только состояние установлено, оно заморожено. Это принципиально важно для корректности: гарантирует, что `.then()` колбэк вызовется ровно один раз. Тот же принцип применяется к resolve после reject и наоборот — первый вызов выигрывает, остальные молча игнорируются.

**Q10: Как работает промисификация и зачем она нужна?**

Промисификация — обёртывание callback-based функции в Promise. `util.promisify` в Node.js делает это автоматически для функций с соглашением `(err, result)`. Зачем: старые API (fs, crypto, dns) используют колбэки, а современный код строится на async/await. Промисификация — мост между мирами. Принцип: новый Promise создаётся, resolve вызывается при успехе, reject — при ошибке. После промисификации функцию можно использовать с await как нативный async метод.

---

### 5. Практическое задание

**Задание:** Реализуйте упрощённый класс `MyPromise` с поддержкой `.then()`, `.catch()` и `.finally()`.

Требования:
- Три состояния: pending, fulfilled, rejected
- Цепочки `.then()` — каждый возвращает новый `MyPromise`
- Обработка как синхронных значений, так и вложенных `MyPromise`
- `.catch(fn)` как алиас для `.then(undefined, fn)`
- `.finally(fn)` — прозрачно пропускает значение

---

### 6. Решение с инсайтом

```typescript
type State = "pending" | "fulfilled" | "rejected";
type Handler<T> = {
  onFulfilled?: (value: T) => any;
  onRejected?: (reason: any) => any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

class MyPromise<T> {
  private state: State = "pending";
  private value: T | undefined;
  private reason: any;
  private handlers: Handler<T>[] = [];

  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    const resolve = (value: T) => {
      if (this.state !== "pending") return; // необратимость
      this.state = "fulfilled";
      this.value = value;
      this.handlers.forEach(this.handle.bind(this));
    };

    const reject = (reason: any) => {
      if (this.state !== "pending") return; // необратимость
      this.state = "rejected";
      this.reason = reason;
      this.handlers.forEach(this.handle.bind(this));
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error); // синхронный throw в executor = rejected
    }
  }

  private handle(handler: Handler<T>) {
    if (this.state === "pending") {
      // Ещё не решён — складываем в очередь
      this.handlers.push(handler);
      return;
    }

    if (this.state === "fulfilled") {
      if (typeof handler.onFulfilled === "function") {
        try {
          const result = handler.onFulfilled(this.value as T);
          // Проверяем: вернули ли вложенный Promise?
          if (result instanceof MyPromise) {
            result.then(handler.resolve, handler.reject);
          } else {
            handler.resolve(result);
          }
        } catch (error) {
          handler.reject(error);
        }
      } else {
        // Нет обработчика — прокидываем значение дальше (pass-through)
        handler.resolve(this.value);
      }
    }

    if (this.state === "rejected") {
      if (typeof handler.onRejected === "function") {
        try {
          const result = handler.onRejected(this.reason);
          handler.resolve(result); // восстановились — цепочка продолжается
        } catch (error) {
          handler.reject(error);
        }
      } else {
        // Нет обработчика ошибки — прокидываем ошибку дальше
        handler.reject(this.reason);
      }
    }
  }

  then<U>(
    onFulfilled?: (value: T) => U | MyPromise<U>,
    onRejected?: (reason: any) => U | MyPromise<U>
  ): MyPromise<U> {
    return new MyPromise<U>((resolve, reject) => {
      this.handle({
        onFulfilled,
        onRejected,
        resolve,
        reject,
      });
    });
  }

  catch<U>(onRejected: (reason: any) => U): MyPromise<U> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: () => void): MyPromise<T> {
    return this.then(
      (value) => {
        onFinally();
        return value; // прозрачно пропускаем значение
      },
      (reason) => {
        onFinally();
        throw reason; // прозрачно прокидываем ошибку
      }
    );
  }

  // Статический метод resolve
  static resolve<T>(value: T): MyPromise<T> {
    return new MyPromise<T>((resolve) => resolve(value));
  }

  // Статический метод reject
  static reject(reason: any): MyPromise<never> {
    return new MyPromise<never>((_, reject) => reject(reason));
  }
}

// --- Демонстрация ---

MyPromise.resolve(42)
  .then((v) => v * 2)
  .then((v) => {
    if (v > 50) throw new Error("слишком большое");
    return v;
  })
  .catch((err) => {
    console.log("Поймали:", err.message); // "слишком большое"
    return 0;
  })
  .finally(() => console.log("Завершено"))
  .then((v) => console.log("Результат:", v)); // 0
```

> **Ключевой инсайт:** Promise — это, по сути, state machine с очередью обработчиков. Понимание того, что `.then()` складывает обработчики в массив (если Promise ещё pending) или немедленно их вызывает (если уже settled) — это и есть вся магия. Вся цепочка — просто серия взаимосвязанных state machines, где результат одной запускает следующую.

→ Следующая тема: [16 — async / await]

---

## Тема 16: async / await

← Предыдущая тема: [15 — Promise]

---

### 1. Теория с аналогиями

#### Аналогия: Инструкция по сборке мебели

**Promise-стиль** — как инструкция в виде блок-схемы со стрелками и ветвлениями: "возьми деталь A, после её готовности возьми деталь B, если что-то пошло не так — перейди к шагу обработки ошибок". Технически правильно, но утомительно читать.

**async/await-стиль** — та же инструкция, написанная линейным текстом: "1. Возьми деталь A. 2. Возьми деталь B. 3. Собери вместе." Те же шаги, тот же механизм — но читается как обычный синхронный код.

**Важно:** `async/await` — это **синтаксический сахар** над Promise. Под капотом работают те же самые Promise. `await` не блокирует весь JavaScript — он приостанавливает только текущую async-функцию и возвращает управление в Event Loop. 🔗 **Связь с темой 1 (Event Loop)**.

---

#### async-функция всегда возвращает Promise

```typescript
async function greet(): Promise<string> {
  return "Hello"; // автоматически оборачивается в Promise.resolve("Hello")
}

// Эквивалентно:
function greet(): Promise<string> {
  return Promise.resolve("Hello");
}

// Проверка:
const result = greet();
console.log(result instanceof Promise); // true
result.then(console.log); // "Hello"

// Если внутри throw — Promise rejected
async function fail(): Promise<never> {
  throw new Error("упал");
  // эквивалентно: return Promise.reject(new Error("упал"))
}
```

---

#### await приостанавливает функцию, не весь JS

```
  Главный поток:
  ──────────────────────────────────────────────────►
  
  asyncFunction():
  │
  ├── синхронный код до await
  │
  await fetch(...)  ←─ функция "ставится на паузу"
  │                    управление возвращается вызывающему
  │
  ┌────────────────────────────────────────────────┐
  │  Event Loop продолжает работу:                  │
  │  • обрабатывает другие Promise                  │
  │  • выполняет другие задачи                     │
  │  • рендерит UI (в браузере)                    │
  └────────────────────────────────────────────────┘
  │
  ← Promise разрешился → функция возобновляется
  │
  ├── код после await
  │
  └── возвращает значение
```

---

#### Параллелизм: последовательные await vs Promise.all

```typescript
// ❌ Медленно: последовательное выполнение — 3 секунды
async function loadDataSequential() {
  const users = await fetchUsers();     // ждём 1 сек
  const posts = await fetchPosts();     // ждём ещё 1 сек
  const comments = await fetchComments(); // ждём ещё 1 сек
  // Итого: ~3 секунды. Каждый запрос ждёт предыдущего БЕЗ ПРИЧИНЫ
  return { users, posts, comments };
}

// ✅ Быстро: параллельное выполнение — ~1 секунда
async function loadDataParallel() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),     // все три запускаются одновременно
    fetchPosts(),
    fetchComments(),
  ]);
  // Итого: ~1 секунда (время самого долгого запроса)
  return { users, posts, comments };
}

// ✅ Альтернатива: запустить промисы заранее, await позже
async function loadDataParallelAlt() {
  const usersPromise = fetchUsers();   // запускается немедленно
  const postsPromise = fetchPosts();   // запускается немедленно
  
  // Делаем что-то другое пока они выполняются...
  const config = await loadConfig();
  
  // Теперь ждём результаты
  const users = await usersPromise;
  const posts = await postsPromise;
  
  return { users, posts, config };
}
```

---

#### Ловушка async/forEach — и правильные альтернативы

```typescript
const userIds = [1, 2, 3, 4, 5];

// ❌ Ловушка: forEach игнорирует возвращаемые Promise
async function processUsersWrong() {
  userIds.forEach(async (id) => {
    const user = await fetchUser(id); // Promise создаётся, но forEach не ждёт его
    await saveUser(user);
  });
  // функция возвращается ДО завершения всех операций!
  console.log("Готово?"); // выведется сразу, не дождавшись завершения
}

// ✅ Параллельно: Promise.all + map
async function processUsersParallel() {
  await Promise.all(
    userIds.map(async (id) => {
      const user = await fetchUser(id);
      await saveUser(user);
    })
  );
  console.log("Готово!"); // выведется после всех операций
}

// ✅ Последовательно: for...of
async function processUsersSequential() {
  for (const id of userIds) {
    const user = await fetchUser(id); // await работает в for...of
    await saveUser(user);
  }
  console.log("Готово!");
}

// ✅ С ограничением параллелизма: батчами по N
async function processUsersBatched(batchSize = 2) {
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    await Promise.all(batch.map(async (id) => {
      const user = await fetchUser(id);
      await saveUser(user);
    }));
  }
}
```

---

### 2. Связь со стеком

#### Next.js App Router: async Server Components

```typescript
// app/users/[id]/page.tsx — Server Component может быть async
// Это возможно только в Server Components, не в Client Components

interface PageProps {
  params: { id: string };
}

export default async function UserPage({ params }: PageProps) {
  // Прямой await в Server Component — нет нужды в useEffect!
  const user = await db.user.findUnique({
    where: { id: parseInt(params.id) },
    include: { posts: true },
  });

  if (!user) {
    notFound(); // Next.js 13+ built-in
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={user.posts} />
    </div>
  );
}

// Генерация метаданных — тоже async
export async function generateMetadata({ params }: PageProps) {
  const user = await db.user.findUnique({
    where: { id: parseInt(params.id) },
  });
  return { title: user?.name ?? "Пользователь не найден" };
}
```

#### Паттерн safeAsync: предсказуемые ошибки

```typescript
// Утилита для Go-style обработки ошибок
type Result<T, E = Error> =
  | { data: T; error: null }
  | { data: null; error: E };

async function safeAsync<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

// Использование — явная обработка без try/catch везде
async function loadUserProfile(id: string) {
  const { data: user, error: userError } = await safeAsync(fetchUser(id));

  if (userError) {
    logger.error("Не удалось загрузить пользователя:", userError);
    return null;
  }

  const { data: posts, error: postsError } = await safeAsync(
    fetchPosts(user.id)
  );

  // posts может быть null, но мы продолжаем работу
  return { user, posts: posts ?? [] };
}
```

#### Server Actions: async функции на сервере

```typescript
// app/actions/user.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateUserAction(
  prevState: { message: string },
  formData: FormData
) {
  const name = formData.get("name") as string;

  if (!name || name.length < 2) {
    return { message: "Имя слишком короткое" };
  }

  const { data, error } = await safeAsync(
    db.user.update({
      where: { id: getCurrentUserId() },
      data: { name },
    })
  );

  if (error) {
    return { message: "Ошибка обновления" };
  }

  revalidatePath("/profile"); // инвалидируем кеш
  redirect("/profile");        // перенаправляем
}
```

---

### 3. Лучшие паттерны

#### Паттерн 1: Retry с экспоненциальным backoff

```typescript
// ❌ Антипаттерн — retry без задержки
async function fetchWithRetryBad<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      // Следующая попытка немедленно — DDos по ошибочному серверу
    }
  }
  throw new Error("Unreachable");
}

// ✅ Правильно — экспоненциальный backoff с jitter
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { retries = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;

      // Экспоненциальная задержка: 1s, 2s, 4s, 8s...
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      // Jitter: добавляем случайность чтобы избежать thundering herd
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(`Попытка ${attempt + 1} не удалась, ждём ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

// Использование
const data = await fetchWithRetry(
  () => fetch("/api/fragile-endpoint").then((r) => r.json()),
  { retries: 4, baseDelay: 500 }
);

// Объяснение: exponential backoff уменьшает нагрузку на восстанавливающийся сервис.
// Jitter предотвращает "thundering herd" — ситуацию когда тысячи клиентов
// делают retry одновременно через одинаковый промежуток.
```

#### Паттерн 2: Timeout через AbortController

```typescript
// ❌ Антипаттерн — timeout через Promise.race не отменяет запрос
async function fetchWithTimeoutBad<T>(
  url: string,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fetch(url).then((r) => r.json()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    ),
    // ⚠️ fetch() продолжает работать в фоне! Тратит ресурсы браузера.
  ]);
}

// ✅ Правильно — AbortController реально отменяет запрос
async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal, // передаём сигнал отмены
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Запрос превысил таймаут ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId); // важно: очищаем таймер при успехе
  }
}

// Объяснение: AbortController посылает сигнал отмены в сеть —
// браузер реально прерывает TCP-соединение. Promise.race лишь
// игнорирует результат, не освобождая ресурсы.
```

#### Паттерн 3: Результирующий паттерн для предсказуемых ошибок

```typescript
// ❌ Антипаттерн — try/catch везде, неясно что может упасть
async function processOrder(orderId: string) {
  try {
    const order = await fetchOrder(orderId);
    try {
      const payment = await processPayment(order);
      try {
        await sendConfirmationEmail(payment);
      } catch (emailError) {
        // Email не критичен, но как отличить от других ошибок?
        console.error("email failed");
      }
    } catch (paymentError) {
      throw paymentError;
    }
  } catch (orderError) {
    throw orderError;
  }
}

// ✅ Правильно — явные типы результата
type OrderResult =
  | { status: "success"; orderId: string; emailSent: boolean }
  | { status: "order_not_found" }
  | { status: "payment_failed"; reason: string }
  | { status: "error"; error: Error };

async function processOrderSafe(orderId: string): Promise<OrderResult> {
  const { data: order, error: orderError } = await safeAsync(
    fetchOrder(orderId)
  );
  if (!order) {
    return orderError?.message?.includes("404")
      ? { status: "order_not_found" }
      : { status: "error", error: orderError! };
  }

  const { data: payment, error: paymentError } = await safeAsync(
    processPayment(order)
  );
  if (!payment) {
    return { status: "payment_failed", reason: paymentError!.message };
  }

  // Email некритичен — пробуем, но не падаем
  const { error: emailError } = await safeAsync(
    sendConfirmationEmail(payment)
  );
  if (emailError) {
    logger.warn("Email не отправлен:", emailError);
  }

  return { status: "success", orderId, emailSent: !emailError };
}

// Объяснение: явные типы ошибок делают API честным — вызывающий код
// точно знает что может пойти не так и как на это реагировать.
// Это называется "making errors explicit" или "railway-oriented programming".
```

---

### 4. Вопросы интервью

**Q1: Что делает ключевое слово `async` перед функцией?**

Ключевое слово `async` делает функцию асинхронной и заставляет её **всегда возвращать Promise**. Если функция возвращает не-Promise значение — оно автоматически оборачивается в `Promise.resolve()`. Если функция бросает исключение — возвращается `Promise.reject()` с этим исключением. Это означает, что вызывающий код всегда получает Promise, независимо от того, использует ли функция `await` внутри. `async` также включает возможность использования `await` внутри функции — без `async` ключевое слово `await` является синтаксической ошибкой.

**Q2: Что делает `await` и как он работает под капотом?**

`await` приостанавливает выполнение текущей async-функции до разрешения Promise и возвращает управление в Event Loop. Под капотом `await` — это синтаксический сахар над `.then()`: `const x = await promise` эквивалентно `promise.then(x => ...)`. При встрече `await` движок JS сохраняет контекст выполнения функции (локальные переменные, позицию в коде), регистрирует продолжение как микротаску и возвращает управление вызывающему. Когда Promise разрешается — продолжение ставится в очередь микротасок и выполняется при следующей итерации Event Loop. Ключевое: остальной JS не блокируется — блокируется только конкретная async-функция.

**Q3: Как обрабатывать ошибки с `async/await`?**

Основной способ — `try/catch/finally`: `try` содержит await-выражения, `catch(error)` перехватывает любой rejected Promise или синхронный throw, `finally` — cleanup. Альтернатива — паттерн `safeAsync`: оборачиваем Promise в утилиту, возвращающую `{data, error}` — это позволяет избежать вложенных try/catch и делает обработку ошибок явной в сигнатуре. Важно: если в async-функции нет try/catch и await выражение упало — функция вернёт rejected Promise, который нужно поймать снаружи. Необработанный rejection в Node.js завершает процесс, в браузере — выводит предупреждение.

**Q4: Почему `await` в `forEach` не работает?**

`forEach` не является async-aware — он не ждёт Promise, возвращаемые async-колбэком. Каждая итерация запускается, возвращает Promise, который `forEach` игнорирует, и продолжает следующую итерацию не дожидаясь завершения. В результате: все итерации запускаются одновременно (не последовательно), и основной код продолжает выполнение не дожидаясь их завершения. Решения: `for...of` для последовательного выполнения, `Promise.all(array.map(async fn))` для параллельного, `for await...of` для async итераторов. `reduce` с Promise тоже работает, но менее читабельно.

**Q5: В чём разница `await Promise.all([...])` и последовательных `await`?**

Последовательные `await` — каждый следующий запрос начинается только после завершения предыдущего. Если каждый занимает 1с и их 3 — итого 3с. Подходит когда результат предыдущего нужен для следующего. `await Promise.all([...])` — все Promise запускаются одновременно, `await` ждёт завершения самого долгого. Те же 3 запроса по 1с — итого ~1с. Подходит когда запросы независимы. Промежуточный вариант: запустить Promise заранее (`const p1 = fetch(...)`, `const p2 = fetch(...)`), а потом `await` их — даёт параллелизм без `Promise.all`. На практике для параллельных независимых операций `Promise.all` предпочтительнее — явно выражает намерение.

**Q6: Что такое top-level `await` и где он работает?**

Top-level `await` — использование `await` вне async-функции, на верхнем уровне модуля. Работает только в ES Modules (`type: "module"` в package.json или файлы `.mjs`). Блокирует выполнение импортирующих модулей до завершения await. Применение: инициализация соединений с БД, загрузка конфигурации, dynamic import с условиями. В Node.js поддерживается с версии 14.8+. Важно: top-level await в модуле превращает весь модуль в "async" — другие модули, импортирующие его, будут ждать его инициализации. Это мощный инструмент, но требует осознанного использования.

**Q7: Что происходит при необработанном rejected Promise?**

В браузере: запускается событие `unhandledrejection` на `window`, в консоль выводится предупреждение, но процесс не падает. Можно слушать: `window.addEventListener('unhandledrejection', handler)`. В Node.js: до версии 15 — предупреждение в stderr. Начиная с Node.js 15 — процесс завершается с ненулевым exit code (как при unhandled throw). Это критически важно для production: необработанный rejection в request handler может уронить сервер. Решение: глобальный обработчик `process.on('unhandledRejection', ...)` для логирования + exit, и правильная обработка ошибок в коде.

**Q8: Можно ли использовать `await` в стрелочных функциях?**

Да, если стрелочная функция объявлена с `async`: `const fn = async () => await somePromise()`. `async` работает с любым типом функций: function declaration, function expression, arrow function, method в классе. Единственное ограничение — `await` нельзя использовать в generator-функции и в обычных callback без `async`. Top-level `await` работает только в модулях. В конструкторе класса `await` недоступен — конструктор не может быть async. Обходное решение: статический async factory method `static async create()`.

**Q9: Как `async/await` работает с `Promise.allSettled`?**

```typescript
const results = await Promise.allSettled([p1, p2, p3]);
```
`await` ждёт когда `allSettled` разрешится (он всегда fulfilled — никогда не rejected). Результат — массив объектов с дискриминирующим полем `status: "fulfilled" | "rejected"`. TypeScript корректно типизирует каждый элемент через union type. Деструктуризация с проверкой статуса — стандартный паттерн. Отличие от `Promise.all` с `await`: `all` с `await` может бросить исключение (нужен try/catch), `allSettled` с `await` — никогда не бросает, всегда возвращает массив.

**Q10: Как реализовать последовательное выполнение async-операций с накоплением результатов?**

```typescript
// Через for...of — самый читаемый способ
async function processSequentially<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await fn(items[i], i));
  }
  return results;
}

// Через reduce — функциональный стиль
async function processWithReduce<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  return items.reduce(async (accPromise, item) => {
    const acc = await accPromise; // ждём предыдущий
    const result = await fn(item);
    return [...acc, result];
  }, Promise.resolve([] as R[]));
}
```
Оба подхода корректны. `for...of` — понятнее и легче отлаживать. `reduce` — элегантен, но труднее читается. В TypeScript `for...of` предпочтительнее из-за лучшей читаемости и поддержки отладчиком.

---

### 5. Практическое задание

**Задание:** Реализуйте функцию `fetchWithRetry`, которая:
1. Выполняет HTTP-запрос с помощью `fetch`
2. При ошибке повторяет попытку до N раз
3. Между попытками использует экспоненциальный backoff с jitter
4. Поддерживает таймаут на каждую попытку через `AbortController`
5. Различает ретраябельные ошибки (5xx, сетевые) и нет (4xx кроме 429)

---

### 6. Решение с инсайтом

```typescript
interface RetryOptions {
  retries?: number;        // максимум попыток после первой
  baseDelay?: number;      // базовая задержка в мс
  maxDelay?: number;       // максимальная задержка
  timeoutMs?: number;      // таймаут каждой попытки
  onRetry?: (error: Error, attempt: number) => void; // хук
}

class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "FetchError";
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof FetchError) {
    // 4xx (кроме 429 Too Many Requests) — не ретраим
    // 5xx — ретраим, сетевые ошибки — ретраим
    if (error.status && error.status >= 400 && error.status < 500) {
      return error.status === 429; // только Rate Limit ретраим
    }
    return true; // 5xx и сетевые
  }
  // AbortError (таймаут) — ретраим
  if (error instanceof Error && error.name === "AbortError") return true;
  return true; // всё остальное — ретраим
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnce(
  url: string,
  options: RequestInit,
  timeoutMs?: number
): Promise<Response> {
  if (!timeoutMs) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId); // очищаем в любом случае
  }
}

async function fetchWithRetry<T = unknown>(
  url: string,
  fetchOptions: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    timeoutMs = 10000,
    onRetry,
  } = retryOptions;

  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchOnce(url, fetchOptions, timeoutMs);

      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isLastAttempt = attempt === retries;
      const shouldRetry = !isLastAttempt && isRetryable(error);

      if (!shouldRetry) {
        throw lastError;
      }

      // Экспоненциальный backoff: 1s → 2s → 4s → 8s
      const exponential = baseDelay * Math.pow(2, attempt);
      // Jitter ±25% чтобы разбить "thundering herd"
      const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
      const delay = Math.min(Math.round(exponential + jitter), maxDelay);

      onRetry?.(lastError, attempt + 1);
      console.log(`Попытка ${attempt + 1}/${retries} не удалась. Ждём ${delay}ms`);

      await sleep(delay);
    }
  }

  throw lastError;
}

// --- Использование ---

interface UserData {
  id: number;
  name: string;
  email: string;
}

async function main() {
  try {
    const user = await fetchWithRetry<UserData>(
      "https://api.example.com/users/1",
      { headers: { Authorization: "Bearer token123" } },
      {
        retries: 3,
        baseDelay: 500,
        timeoutMs: 5000,
        onRetry: (error, attempt) => {
          console.warn(`Retry ${attempt}: ${error.message}`);
        },
      }
    );
    console.log("Пользователь:", user);
  } catch (error) {
    console.error("Все попытки исчерпаны:", error);
  }
}
```

> **Ключевой инсайт:** `async/await` не добавляет магии — это синтаксический сахар над Promise. Но он меняет форму кода с "вложенной" на "линейную", что принципиально снижает когнитивную нагрузку. Понимание того, что `await` — это точка приостановки конкретной функции (не блокировка всего JS), объясняет почему `forEach` с `await` не работает, почему параллельные `await` нужно запускать через `Promise.all`, и почему top-level `await` блокирует импортирующие модули.

→ Следующая тема: [17 — Promise.all / race / any]

---

## Тема 17: Promise.all / race / any

← Предыдущая тема: [16 — async / await]

---

### 1. Теория с аналогиями

#### 4 аналогии из жизни

**Promise.all — Совместный отчёт**  
Руководитель собирает отчёты от трёх отделов. Итоговый документ отправляется в штаб только когда ВСЕ отделы сдали свои части. Если один отдел не сдал — документ не отправляется вообще (fail-fast).

**Promise.allSettled — Результаты выборов**  
Подсчёт голосов идёт по всем участкам одновременно. Итоговый протокол составляется когда ВСЕ участки отчитались — неважно, были ли там нарушения. Каждый участок имеет статус и результат.

**Promise.race — Олимпийская гонка**  
Побеждает первый финишировавший. Остальные продолжают бежать, но медаль уже вручена. Результат определяется первым — будь то победа или дисквалификация.

**Promise.any — CDN-запрос**  
Запрос уходит на три CDN-сервера одновременно. Вы получаете данные от первого ответившего успешно. Если все три упали — только тогда ошибка. Один успех — итог положительный.

---

#### Таблица сравнения

```
┌─────────────────┬──────────────────────────┬─────────────────────────┐
│  Метод           │  При первом reject        │  Когда resolve          │
├─────────────────┼──────────────────────────┼─────────────────────────┤
│ Promise.all     │  Немедленно reject всего  │  Все fulfilled          │
│                 │  (остальные игнорируются) │                         │
├─────────────────┼──────────────────────────┼─────────────────────────┤
│ Promise.allSett │  Ждём остальных,          │  Все завершились        │
│                 │  статус "rejected"        │  (fulfilled или reject) │
├─────────────────┼──────────────────────────┼─────────────────────────┤
│ Promise.race    │  Reject если первый был   │  Fulfilled если первый  │
│                 │  rejected                 │  был fulfilled          │
├─────────────────┼──────────────────────────┼─────────────────────────┤
│ Promise.any     │  Ждём остальных           │  Первый fulfilled       │
│                 │  (ищем успех)             │  (любой)                │
│                 │  AggregateError если все  │                         │
│                 │  rejected                 │                         │
└─────────────────┴──────────────────────────┴─────────────────────────┘
```

---

#### Продолжают ли работать другие Promise после reject в `Promise.all`?

```typescript
// Критически важный факт: Promise.all НЕ отменяет другие промисы
// Они продолжают выполняться — JS нет механизма отмены без AbortController

function loggedFetch(id: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const delay = id * 1000;
    setTimeout(() => {
      if (id === 2) {
        console.log(`Promise ${id} — reject`);
        reject(new Error(`Ошибка в Promise ${id}`));
      } else {
        console.log(`Promise ${id} — resolve`);
        resolve(id);
      }
    }, delay);
  });
}

try {
  const result = await Promise.all([
    loggedFetch(1), // разрешится через 1 сек
    loggedFetch(2), // отклонится через 2 сек
    loggedFetch(3), // разрешится через 3 сек — НО МЫ УЖЕ В CATCH
  ]);
} catch (error) {
  console.error("Promise.all упал:", error.message);
  // Вывод в консоль:
  // "Promise 1 — resolve"      (через 1 сек)
  // "Promise 2 — reject"       (через 2 сек) → Promise.all падает
  // "Promise 3 — resolve"      (через 3 сек) — ВСЁРАВНО ВЫПОЛНИТСЯ
  // "Promise.all упал: Ошибка в Promise 2"
}
```

---

#### Поведение с пустым массивом

```typescript
// Promise.all([]) — немедленно resolves с пустым массивом
const all = await Promise.all([]);
console.log(all); // []

// Promise.allSettled([]) — немедленно resolves с пустым массивом
const settled = await Promise.allSettled([]);
console.log(settled); // []

// Promise.race([]) — НИКОГДА не разрешается! Навсегда pending!
// Это редкий edge case, который может создать утечку памяти
const race = await Promise.race([]); // ← зависнет навсегда
// ⚠️ Всегда проверяйте: if (promises.length === 0) return defaultValue

// Promise.any([]) — немедленно rejects с AggregateError
try {
  await Promise.any([]);
} catch (error) {
  // error instanceof AggregateError
  console.log(error.message); // "All promises were rejected"
  console.log(error.errors);  // []
}
```

---

### 2. Связь со стеком

#### Dashboard loading: allSettled для параллельных виджетов

```typescript
// app/dashboard/page.tsx
type WidgetData<T> = { data: T | null; error: string | null };

async function loadDashboard(): Promise<{
  users: WidgetData<User[]>;
  revenue: WidgetData<RevenueStats>;
  activity: WidgetData<ActivityLog[]>;
}> {
  const [usersResult, revenueResult, activityResult] =
    await Promise.allSettled([
      fetchUsers(),
      fetchRevenue(),
      fetchActivity(),
    ]);

  // Трансформируем результаты в единый формат
  const toWidgetData = <T>(
    result: PromiseSettledResult<T>
  ): WidgetData<T> => ({
    data: result.status === "fulfilled" ? result.value : null,
    error:
      result.status === "rejected"
        ? result.reason?.message ?? "Неизвестная ошибка"
        : null,
  });

  return {
    users: toWidgetData(usersResult),
    revenue: toWidgetData(revenueResult),
    activity: toWidgetData(activityResult),
  };
}
```

#### Ограничение параллелизма для rate-limited API

```typescript
// pooledAll: выполняем N промисов за раз, но не больше
async function pooledAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < tasks.length; i++) {
    const idx = i;
    const p: Promise<void> = tasks[idx]().then((result) => {
      results[idx] = result;
      executing.delete(p);
    });
    executing.add(p);

    // Если достигли лимита — ждём завершения одного
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Ждём оставшиеся
  await Promise.all(executing);
  return results;
}

// Использование: GitHub API лимит ~10 req/sec
const userIds = Array.from({ length: 100 }, (_, i) => i + 1);
const users = await pooledAll(
  userIds.map((id) => () => fetchUser(id)),
  5 // максимум 5 одновременных запросов
);
```

---

### 3. Лучшие паттерны

#### Паттерн 1: Promise.allSettled с graceful degradation

```typescript
// ❌ Антипаттерн — Promise.all для независимых данных
async function loadPageBad() {
  // Если fetchRecommendations упадёт — вся страница сломается
  const [user, recommendations, ads] = await Promise.all([
    fetchUser(),
    fetchRecommendations(), // некритичный сервис
    fetchAds(),             // некритичный сервис
  ]);
  return { user, recommendations, ads };
}

// ✅ Правильно — независимые сервисы не должны ломать страницу
async function loadPageGood() {
  const [userResult, recsResult, adsResult] = await Promise.allSettled([
    fetchUser(),
    fetchRecommendations(),
    fetchAds(),
  ]);

  // Критичный контент — user. Если упал — бросаем ошибку
  if (userResult.status === "rejected") {
    throw userResult.reason;
  }

  return {
    user: userResult.value,
    // Некритичные — возвращаем дефолт при ошибке
    recommendations:
      recsResult.status === "fulfilled" ? recsResult.value : [],
    ads: adsResult.status === "fulfilled" ? adsResult.value : [],
    // Логируем упавшие некритичные сервисы
    _errors: [recsResult, adsResult]
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason),
  };
}

// Объяснение: graceful degradation — страница работает с частичными данными.
// Пользователь видит страницу без рекламы/рекомендаций,
// а не "500 Internal Server Error".
```

#### Паттерн 2: Promise.any для CDN fallback

```typescript
// ❌ Антипаттерн — последовательные запросы к fallback серверам
async function fetchFromCDNBad(path: string): Promise<ArrayBuffer> {
  const cdns = [
    `https://cdn1.example.com${path}`,
    `https://cdn2.example.com${path}`,
    `https://cdn3.example.com${path}`,
  ];

  for (const url of cdns) {
    try {
      return await fetch(url).then((r) => r.arrayBuffer());
      // Если первый CDN недоступен — ждём таймаут, потом пробуем второй
      // Итого: N * timeout = 30+ секунд в худшем случае
    } catch {
      continue;
    }
  }
  throw new Error("Все CDN недоступны");
}

// ✅ Правильно — гонка между CDN, первый ответивший побеждает
async function fetchFromCDN(path: string): Promise<ArrayBuffer> {
  const cdns = [
    `https://cdn1.example.com${path}`,
    `https://cdn2.example.com${path}`,
    `https://cdn3.example.com${path}`,
  ];

  try {
    // Promise.any: первый успешный ответ побеждает
    // Если CDN1 недоступен — всё равно получим ответ от CDN2/CDN3 быстро
    return await Promise.any(
      cdns.map((url) =>
        fetch(url).then((r) => {
          if (!r.ok) throw new Error(`CDN ${url} вернул ${r.status}`);
          return r.arrayBuffer();
        })
      )
    );
  } catch (error) {
    // AggregateError — все CDN упали
    if (error instanceof AggregateError) {
      throw new Error(`Все CDN недоступны. Ошибки: ${error.errors.join(", ")}`);
    }
    throw error;
  }
}

// Объяснение: параллельные запросы к N серверам дают время ответа
// лучшего из них, а не сумму всех. 3 CDN × 5s timeout = 5s (не 15s).
```

#### Паттерн 3: Реализация pooled concurrency

```typescript
// ❌ Антипаттерн — все запросы одновременно
async function processAllAtOnceBad<T>(
  items: T[],
  processor: (item: T) => Promise<void>
) {
  // 1000 элементов = 1000 одновременных запросов
  // DDoS собственного API / исчерпание сокетов
  await Promise.all(items.map(processor));
}

// ✅ Правильно — контролируемый параллелизм
async function processWithConcurrency<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  concurrency: number = 5
): Promise<void> {
  const queue = [...items.entries()]; // [index, item] пары

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      const [index, item] = next;
      await processor(item, index);
    }
  }

  // Запускаем N воркеров параллельно
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
}

// Использование: отправка email 200 пользователям с лимитом 10 параллельных
await processWithConcurrency(
  users,
  async (user) => {
    await sendEmail(user.email, "Привет!");
  },
  10 // максимум 10 одновременных отправок
);

// Объяснение: worker-based concurrency позволяет точно контролировать
// нагрузку на внешние сервисы и соблюдать rate limits API.
```

---

### 4. Вопросы интервью

**Q1: В чём разница `Promise.all` и `Promise.allSettled`?**

`Promise.all` использует fail-fast стратегию: при первом rejected Promise немедленно отклоняется со значением этой ошибки, остальные Promise продолжают работу но их результаты игнорируются. Возвращает массив значений при успехе. `Promise.allSettled` всегда ждёт завершения ВСЕХ промисов и возвращает массив объектов `{status: "fulfilled", value} | {status: "rejected", reason}`. Никогда не отклоняется. Правило: `Promise.all` для взаимозависимых операций (всё или ничего), `Promise.allSettled` для независимых с частичным успехом.

**Q2: Что такое `Promise.race` и когда использовать?**

`Promise.race` возвращает Promise, который разрешается/отклоняется результатом первого завершившегося промиса — победитель определяет итог. Классические применения: (1) таймаут для операции — гонка между fetch и `new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))`; (2) показ первого загрузившегося из нескольких источников; (3) дедлайн выполнения. Важно: `Promise.race([])` никогда не разрешается — пустой массив создаёт вечно pending Promise. Проигравшие не отменяются — для реальной отмены нужен `AbortController`.

**Q3: Что такое `Promise.any` и чем отличается от `Promise.race`?**

`Promise.any` разрешается первым **успешным** (fulfilled) Promise, игнорируя rejected. Отклоняется только если **все** Promise отклонились — тогда бросает `AggregateError` с массивом всех ошибок. `Promise.race` реагирует на первый завершившийся — будь то fulfilled или rejected. Разница критична: если первый быстрый Promise упадёт, `race` упадёт тоже, а `any` продолжит ждать успешного. `Promise.any` — для стратегий "попробовать несколько источников": CDN fallback, поиск по нескольким сервисам, резервные API.

**Q4: Продолжают ли работать остальные Promise после reject в `Promise.all`?**

Да, все запущенные промисы продолжают выполняться — JS не имеет механизма принудительной отмены Promise. `Promise.all` лишь перестаёт ждать остальных и немедленно разрешает возвращаемый Promise в rejected. Это может приводить к "ghost requests" — запросы продолжают работу, потребляют ресурсы, а их результаты никем не используются. Для реальной отмены: передавать `AbortSignal` в каждую операцию, слушать `controller.abort()` и прерывать работу. `AbortController` + `Promise.all` — правильная комбинация для отменяемых параллельных операций.

**Q5: Как реализовать `Promise.all` с нуля?**

```typescript
function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([]);
      return;
    }

    const results: T[] = new Array(promises.length);
    let remaining = promises.length;

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then((value) => {
        results[index] = value;
        remaining--;
        if (remaining === 0) resolve(results);
      }, reject); // первый reject — сразу reject всего
    });
  });
}
```
Ключевые детали: `Promise.resolve(promise)` обрабатывает не-Promise значения; результаты сохраняются по индексу (не по порядку завершения); счётчик `remaining` определяет момент resolve; `reject` передаётся напрямую в onRejected каждого промиса.

**Q6: Какой метод для страницы с независимыми виджетами?**

`Promise.allSettled` — однозначно. Логика: если три виджета загружают данные независимо (пользователь, статистика, рекомендации) и один сервис упал, страница всё равно должна отображать данные двух работающих. `Promise.all` при падении одного сервиса покажет пустую страницу или ошибку. `Promise.allSettled` даёт возможность отобразить частичные данные и показать заглушку только для упавшего виджета. Это паттерн "graceful degradation" — основа UX для data-intensive dashboards.

**Q7: Что произойдёт при `Promise.race([])` с пустым массивом?**

Создаётся Promise, который никогда не разрешится — вечно pending. Это потенциальная утечка памяти: колбэки `.then()`/`.catch()` никогда не вызовутся, обработчики не освободятся. В отличие от `Promise.all([])` (немедленно resolve `[]`) и `Promise.any([])` (немедленно reject `AggregateError`). Практическое правило: перед `Promise.race(arr)` всегда проверять `if (arr.length === 0) return defaultValue`. Или добавить защитный промис: `Promise.race([...arr, new Promise((_, r) => setTimeout(() => r(new Error('empty race')), 0))])`.

**Q8: В чём разница `AggregateError` и обычного `Error`?**

`AggregateError` — специальный тип ошибки для случая когда несколько операций завершились с ошибками. Содержит поле `errors: Error[]` — массив всех собранных ошибок. `Promise.any` бросает `AggregateError` когда все промисы отклонились, с массивом всех причин. Это позволяет проанализировать каждую причину отдельно: `catch (e) { if (e instanceof AggregateError) e.errors.forEach(logError) }`. Появился в ES2021. Аналог существует в некоторых других языках (Java `MultiException`, Python `ExceptionGroup`).

**Q9: Как обеспечить порядок результатов в `Promise.all`?**

`Promise.all` гарантирует порядок результатов соответствующий порядку входного массива — независимо от порядка завершения промисов. Если `[p1, p2, p3]` переданы в `Promise.all`, то результат всегда `[result1, result2, result3]` даже если p3 завершился первым. Это реализуется через сохранение по индексу (как в примере реализации выше). `Promise.race` и `Promise.any` — не про порядок, а про первого победителя.

**Q10: Когда предпочесть `Promise.all` над `async/await` в цикле?**

`Promise.all` предпочтительнее когда: (1) все операции независимы и можно запустить параллельно; (2) нужен единый результат — либо всё успешно, либо ошибка; (3) производительность критична. Последовательные `await` в цикле — когда: (1) следующая операция зависит от результата предыдущей; (2) нужно строгое упорядочивание для side effects (запись в БД по порядку); (3) rate limiting требует ограничения. Правило: если операции независимы — `Promise.all`, зависимы или с side effects — `for...of` с `await`.

---

### 5. Практическое задание

**Задание:** Реализуйте с нуля `Promise.all`, `Promise.race` и `Promise.any`.

Требования:
- Корректная обработка пустых массивов
- Сохранение порядка результатов в `all`
- `AggregateError` в `any` при всех rejected
- Все функции принимают `Iterable<Promise<T>>`

---

### 6. Решение с инсайтом

```typescript
// --- Promise.all ---
function myPromiseAll<T>(
  iterable: Iterable<Promise<T>>
): Promise<T[]> {
  const promises = Array.from(iterable);

  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([]); // немедленно resolve с пустым массивом
      return;
    }

    const results: T[] = new Array(promises.length);
    let remaining = promises.length;

    promises.forEach((promise, index) => {
      // Promise.resolve оборачивает не-Promise значения
      Promise.resolve(promise).then(
        (value) => {
          results[index] = value; // сохраняем по индексу — гарантируем порядок
          if (--remaining === 0) resolve(results);
        },
        (reason) => reject(reason) // первый reject — сразу reject всего
      );
    });
  });
}

// --- Promise.race ---
function myPromiseRace<T>(
  iterable: Iterable<Promise<T>>
): Promise<T> {
  const promises = Array.from(iterable);

  return new Promise((resolve, reject) => {
    // Пустой массив — никогда не разрешается (это стандартное поведение)
    promises.forEach((promise) => {
      Promise.resolve(promise).then(resolve, reject);
      // Первый вызов resolve/reject победит, остальные проигнорируются
      // благодаря необратимости состояния Promise
    });
  });
}

// --- Promise.any ---
function myPromiseAny<T>(
  iterable: Iterable<Promise<T>>
): Promise<T> {
  const promises = Array.from(iterable);

  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      // Сразу reject с пустым AggregateError
      reject(new AggregateError([], "All promises were rejected"));
      return;
    }

    const errors: unknown[] = new Array(promises.length);
    let rejectedCount = 0;

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => resolve(value), // первый успешный — победил
        (reason) => {
          errors[index] = reason; // сохраняем ошибку по индексу
          if (++rejectedCount === promises.length) {
            // Все отклонились — AggregateError со всеми причинами
            reject(
              new AggregateError(errors, "All promises were rejected")
            );
          }
        }
      );
    });
  });
}

// --- Тесты ---
async function runTests() {
  console.log("=== myPromiseAll ===");
  const all = await myPromiseAll([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ]);
  console.log(all); // [1, 2, 3]

  try {
    await myPromiseAll([
      Promise.resolve(1),
      Promise.reject(new Error("упал")),
      Promise.resolve(3),
    ]);
  } catch (e) {
    console.log("all catch:", (e as Error).message); // "упал"
  }

  console.log("\n=== myPromiseRace ===");
  const race = await myPromiseRace([
    new Promise((r) => setTimeout(() => r("медленный"), 200)),
    new Promise((r) => setTimeout(() => r("быстрый"), 100)),
  ]);
  console.log(race); // "быстрый"

  console.log("\n=== myPromiseAny ===");
  const any = await myPromiseAny([
    Promise.reject(new Error("1 упал")),
    Promise.reject(new Error("2 упал")),
    Promise.resolve("3 успех"),
  ]);
  console.log(any); // "3 успех"

  try {
    await myPromiseAny([
      Promise.reject(new Error("1")),
      Promise.reject(new Error("2")),
    ]);
  } catch (e) {
    console.log("any AggregateError:", e instanceof AggregateError); // true
    console.log("errors:", (e as AggregateError).errors.map((err: Error) => err.message));
  }
}

runTests();
```

> **Ключевой инсайт:** Все четыре метода строятся на одном фундаменте — необратимости состояния Promise. В `all` первый reject вызывает outer reject, но повторные вызовы reject игнорируются благодаря этому свойству. В `race` первый resolve/reject победит по той же причине. В `any` нужен счётчик отклонённых, потому что нас интересует не первый, а первый *успешный*. Разница между методами — лишь в том, *какое* событие мы ждём как триггер.

→ Следующая тема: [18 — Callbacks]

---

## Тема 18: Callbacks

← Предыдущая тема: [17 — Promise.all / race / any]

---

### 1. Теория с аналогиями

#### Аналогия: Аптека с оповещением

Вы пришли в аптеку, нужного лекарства нет в наличии. Есть два варианта:
1. **Blocking**: Стоите в очереди и ждёте — никуда не идёте, ничего не делаете
2. **Callback**: Оставляете свой номер телефона — "позвоните мне, когда лекарство появится"

Callback — это и есть ваш номер телефона. Вы уходите, живёте дальше, а когда лекарство появится — аптека сама вам перезвонит и выполнит ваши инструкции.

**Фундаментальная суть:** вы передаёте управление другой стороне — "вот что нужно сделать, когда будешь готов". Это и порождает главную проблему — инверсию управления.

---

#### Node.js-style: соглашение (err, result)

```typescript
import fs from "fs";

// Стандартное соглашение Node.js callbacks:
// - первый аргумент ВСЕГДА ошибка (или null если успех)
// - второй аргумент — результат (или undefined если ошибка)
fs.readFile("config.json", "utf8", (err, data) => {
  //                                 ^^^  ^^^^
  //                                 err  result (error-first callback)
  
  if (err) {
    // Важно: обработать ошибку ПЕРВЫМ ДЕЛОМ
    console.error("Ошибка чтения:", err.message);
    return; // <-- return обязателен! Без него код продолжится
  }
  
  // data гарантированно доступна здесь
  const config = JSON.parse(data);
  console.log("Конфиг:", config);
});

// Почему error-first? Принуждает разработчика думать об ошибках.
// Если второй аргумент будет первым — легко случайно пропустить ошибку.
```

---

#### Callback Hell: пирамида смерти

```typescript
// ❌ Реальный пример из эпохи до Promise
function loadUserDashboard(userId: string) {
  fs.readFile("db.json", "utf8", (err, dbData) => {
    if (err) return console.error(err);
    
    const db = JSON.parse(dbData);
    
    getUser(db, userId, (err, user) => {
      if (err) return console.error(err);
      
      getPosts(user.id, (err, posts) => {
        if (err) return console.error(err);
        
        getComments(posts[0].id, (err, comments) => {
          if (err) return console.error(err);
          
          getReactions(comments[0].id, (err, reactions) => {
            if (err) return console.error(err);
            
            // Наконец-то делаем что-то полезное на 6-м уровне вложенности
            renderDashboard({ user, posts, comments, reactions });
            //   ↑ Почему это плохо:
            //   1. Каждый уровень — новый отступ (пирамида)
            //   2. Обработка ошибок дублируется N раз
            //   3. Невозможно использовать try/catch
            //   4. Переменные из внешних scope — неявные зависимости
            //   5. Сложно тестировать отдельные шаги
          });
        });
      });
    });
  });
}
// Визуально код уходит вправо → "Pyramid of Doom"
```

---

#### Inversion of Control: фундаментальная проблема

```typescript
// Обычный вызов функции — ВЫ управляете:
const result = processData(data);
// Вы знаете: вызвалась ровно один раз, синхронно, результат в result

// Callback — ВЫ ТЕРЯЕТЕ управление:
thirdPartyLibrary.processData(data, (result) => {
  // Библиотека решает:
  // - Сколько раз вызвать колбэк? (может быть 0, 1, N раз)
  // - Когда вызвать? (сейчас? через секунду? никогда?)
  // - В каком контексте? (this?)
  // - Синхронно или асинхронно? (это ОЧЕНЬ важно!)
  doSomethingWith(result);
});

// Пример проблемы с доверием:
let counter = 0;
suspiciousLib.doWork(data, (result) => {
  counter++;
  // Если библиотека вызовет колбэк 5 раз — counter будет 5
  // Нет гарантий без чтения исходников библиотеки
});
```

---

#### Почему try/catch не работает с async callbacks

```typescript
// ❌ Не работает — try/catch и callback в разных стеках вызовов
try {
  setTimeout(() => {
    throw new Error("Ошибка в setTimeout"); // выбрасывается в НОВОМ стеке
    //                                         try/catch уже завершился!
  }, 1000);
} catch (error) {
  // Это НЕ выполнится — ошибка выше вне этого try/catch
  console.error("Поймали:", error);
}

// Наглядно:
// Стек 1: try { setTimeout(...) }  ← try/catch здесь
// Стек 2: callback()               ← throw здесь, ДРУГОЙ стек
//         throw new Error(...)

// ✅ Правильно — обрабатывать ошибку ВНУТРИ колбэка
setTimeout(() => {
  try {
    const result = riskyOperation();
    processResult(result);
  } catch (error) {
    handleError(error);
  }
}, 1000);

// ✅ Или использовать error-first соглашение Node.js
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    handleError(err); // ошибка передана явно, не через throw
    return;
  }
  processData(data);
});
```

---

### 2. Связь со стеком

#### setTimeout / requestAnimationFrame в браузерном коде

```typescript
// setTimeout — классический callback в браузере
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    // Callback передаётся в setTimeout — браузер вызовет его через delay мс
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// requestAnimationFrame — callback перед каждым рендером
function animateElement(element: HTMLElement, duration: number) {
  const start = performance.now();

  function frame(timestamp: number) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);

    element.style.opacity = String(progress);

    if (progress < 1) {
      requestAnimationFrame(frame); // регистрируем следующий callback
    }
  }

  requestAnimationFrame(frame);
}
```

#### Node.js fs API — callback-based

```typescript
import fs from "fs";
import path from "path";

// Классический Node.js callback API
function readJsonFile<T>(
  filePath: string,
  callback: (err: Error | null, data?: T) => void
): void {
  fs.readFile(path.resolve(filePath), "utf8", (err, rawData) => {
    if (err) {
      callback(err);
      return;
    }

    try {
      const data = JSON.parse(rawData) as T;
      callback(null, data);
    } catch (parseError) {
      callback(parseError instanceof Error ? parseError : new Error(String(parseError)));
    }
  });
}

// Использование
readJsonFile<{ port: number }>("server.config.json", (err, config) => {
  if (err) {
    console.error("Не удалось прочитать конфиг:", err.message);
    process.exit(1);
  }
  startServer(config!.port);
});
```

#### Промисификация как мост к современному коду

```typescript
import { promisify } from "util";
import fs from "fs";
import crypto from "crypto";

// util.promisify — стандартный инструмент Node.js
const readFile = promisify(fs.readFile);
const randomBytes = promisify(crypto.randomBytes);

// Теперь можно использовать с async/await
async function generateSessionToken(): Promise<string> {
  const bytes = await randomBytes(32);
  return bytes.toString("hex");
}

async function loadConfig(path: string): Promise<object> {
  const data = await readFile(path, "utf8");
  return JSON.parse(data as string);
}
```

---

### 3. Лучшие паттерны

#### Паттерн 1: Именованные функции вместо inline

```typescript
// ❌ Антипаттерн — inline анонимные функции везде
server.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    rows.forEach((row) => {
      if (row.active) {
        sendEmail(row.email, (err) => {
          if (err) console.error("Email failed:", row.email);
        });
      }
    });
    res.json(rows);
  });
});

// ✅ Правильно — именованные функции улучшают читаемость и трассировку
function handleEmailError(email: string) {
  return (err: Error | null) => {
    if (err) console.error(`Email failed for ${email}:`, err.message);
  };
}

function processUsers(
  err: Error | null,
  rows: User[],
  res: Response
) {
  if (err) {
    res.status(500).json({ error: err.message });
    return;
  }

  rows
    .filter((row) => row.active)
    .forEach((row) => sendEmail(row.email, handleEmailError(row.email)));

  res.json(rows);
}

server.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, rows) =>
    processUsers(err, rows as User[], res)
  );
});

// Объяснение: именованные функции — лучше в stack traces при ошибках,
// легче тестировать изолированно, код самодокументируется именами.
```

#### Паттерн 2: Всегда `return` после обработки ошибки

```typescript
// ❌ Антипаттерн — продолжение после ошибки
function processData(
  data: string | null,
  callback: (err: Error | null, result?: string) => void
) {
  if (!data) {
    callback(new Error("data is required"));
    // Нет return! Код продолжится:
  }

  // ⚠️ Выполнится даже при ошибке если data === null
  const result = data!.toUpperCase(); // TypeError: Cannot read...
  callback(null, result);
  // Колбэк вызван ДВАЖДЫ — явный баг
}

// ✅ Правильно — return после каждого вызова колбэка при ошибке
function processDataSafe(
  data: string | null,
  callback: (err: Error | null, result?: string) => void
) {
  if (!data) {
    callback(new Error("data is required"));
    return; // ← принципиально важно
  }

  const result = data.toUpperCase();
  callback(null, result);
  // Один вызов — один результат
}

// Дополнительная защита: guard против двойного вызова
function once<T extends (...args: unknown[]) => void>(fn: T): T {
  let called = false;
  return function (this: unknown, ...args: Parameters<T>) {
    if (called) return;
    called = true;
    fn.apply(this, args);
  } as T;
}

// Объяснение: callback должен вызываться ровно один раз.
// Двойной вызов — классический баг, очень сложный в отладке.
```

#### Паттерн 3: Промисификация через `util.promisify` или вручную

```typescript
// ❌ Антипаттерн — смешивать стили в одном коде
function loadUserLegacy(
  id: string,
  callback: (err: Error | null, user?: User) => void
) {
  db.query(`SELECT * FROM users WHERE id = ?`, [id], (err, rows) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, rows[0]);
  });
}

// Потребитель вынужден использовать callbacks
loadUserLegacy("123", (err, user) => {
  // снова callbacks, снова проблемы
});

// ✅ Правильно — промисифицировать один раз на входе в кодовую базу
import { promisify } from "util";

// Вариант 1: util.promisify для Node.js-style функций
const loadUserAsync = promisify(loadUserLegacy);

// Вариант 2: ручная промисификация (когда соглашение нестандартное)
function loadUserPromise(id: string): Promise<User> {
  return new Promise((resolve, reject) => {
    loadUserLegacy(id, (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      if (!user) {
        reject(new Error(`User ${id} not found`));
        return;
      }
      resolve(user);
    });
  });
}

// Вариант 3: универсальный promisify
function promisifyFn<T>(
  fn: (...args: [...unknown[], (err: Error | null, result?: T) => void]) => void
): (...args: unknown[]) => Promise<T> {
  return (...args: unknown[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result?: T) => {
        if (err) reject(err);
        else resolve(result as T);
      });
    });
  };
}

// Теперь везде async/await
const user = await loadUserAsync("123");
const user2 = await loadUserPromise("456");

// Объяснение: промисификация на "границе" legacy кода позволяет
// изолировать callbacks-стиль и работать с ним как с Promise везде.
```

---

### 4. Вопросы интервью

**Q1: Что такое callback и зачем он нужен?**

Callback — функция, переданная как аргумент другой функции, которая будет вызвана в какой-то момент в будущем. Нужен для асинхронных операций в однопоточном JavaScript: пока операция (I/O, сеть, таймер) выполняется, Event Loop обрабатывает другие задачи. Когда операция завершается — callback ставится в очередь и вызывается. Это фундаментальный паттерн, на котором построен весь асинхронный JS: и Promise, и async/await под капотом тоже используют callbacks, просто более высокоуровневые. 🔗 **Связь с темой 1 (Event Loop)**.

**Q2: Что такое Inversion of Control (IoC) и почему это проблема в callbacks?**

Инверсия управления — когда вы передаёте функцию стороннему коду и теряете контроль над её вызовом. Проблемы: неизвестно сколько раз вызовется callback (0, 1 или много), когда именно, синхронно или асинхронно. Вы вынуждены доверять библиотеке. Promise решает IoC: вы сами вызываете `.then()` и контролируете обработку. С Promise гарантированно: ровно один вызов, после разрешения/отклонения, асинхронно (всегда через микротаск-очередь). Promise "забирает" контроль обратно — это главная причина их создания, не просто "красивый синтаксис".

**Q3: Почему `try/catch` не работает с async callbacks?**

`try/catch` ловит ошибки, выброшенные синхронно в текущем стеке вызовов. Async callback выполняется в новом стеке — когда Event Loop доходит до обработки задачи из очереди. К этому моменту `try/catch` уже завершён и "выгружен" из стека. Ошибка, брошенная внутри `setTimeout`, `fs.readFile`, обработчика события — вне досягаемости `try/catch` снаружи. Правило: обрабатывать ошибки нужно внутри колбэка. В Node.js — через error-first соглашение. В Promise — через `reject`. Глобальные необработанные ошибки — через `process.on('uncaughtException')` (но это крайняя мера).

**Q4: Что такое Callback Hell и как его избежать?**

Callback hell — глубокая вложенность колбэков при нескольких последовательных асинхронных операциях, создающая "пирамиду" отступов вправо. Проблемы: трудно читать и понимать поток выполнения, обработка ошибок дублируется на каждом уровне, сложно рефакторить и тестировать. Методы решения: (1) именованные функции вместо inline; (2) промисификация и цепочки `.then()`; (3) async/await для линейного кода; (4) библиотеки управления async-потоком (исторически: async.js). Современный подход: промисифицировать legacy API и переходить на async/await.

**Q5: Как работает `promisify`?**

`util.promisify` принимает функцию с error-first колбэком и возвращает её Promise-версию. Реализация: создаёт обёртку, которая при вызове возвращает новый Promise; внутри вызывает оригинальную функцию с добавленным колбэком `(err, result) => err ? reject(err) : resolve(result)`. Если у функции есть `util.promisify.custom` символ — использует его (для функций с нестандартным соглашением). Работает только для функций с одним значением результата; для функций с несколькими аргументами в колбэке нужна ручная промисификация с деструктуризацией.

**Q6: Что такое callbackify и когда он нужен?**

`util.callbackify` — обратная операция: превращает async-функцию (возвращающую Promise) в функцию с error-first колбэком. Нужен для интеграции современного async-кода со старыми системами, ожидающими callback API. Принцип: `callbackify(asyncFn)` возвращает функцию, которая вызывает `asyncFn`, при fulfilled вызывает `callback(null, result)`, при rejected вызывает `callback(error)`. Важный edge case: если Promise разрешается с `null` или `undefined` — в callback передаётся `false` (для отличия от ошибки `null`). Используется редко — в основном при работе с legacy Node.js кодом.

**Q7: Гарантирован ли порядок вызова нескольких callbacks?**

Нет единой гарантии — зависит от контекста. Синхронные callbacks (например, в `Array.prototype.forEach`) вызываются в детерминированном порядке. Async callbacks из таймеров — примерно в порядке их создания при одинаковых задержках, но с неточностью. I/O callbacks в Node.js — порядок зависит от ОС и не гарантирован. `process.nextTick` и микротаски (Promise) — вызываются перед следующими макротасками. Если важен порядок — нужно явно управлять им: последовательные вызовы, Promise chain, async/await. Никогда не полагайтесь на "случайный" порядок async callbacks.

**Q8: Что такое "синхронный" vs "асинхронный" callback?**

Синхронный callback — вызывается в том же стеке вызовов, немедленно: `[1,2,3].forEach(cb)` — `cb` вызывается синхронно для каждого элемента. Асинхронный — вызывается позже, в отдельном "обороте" Event Loop: `setTimeout(cb, 0)` — даже с нулевой задержкой `cb` будет вызван после текущего synchronous кода. Проблема смешения: если функция иногда вызывает callback синхронно, иногда асинхронно — это "Zalgo", крайне опасный антипаттерн. Правило Node.js: callback должен быть ВСЕГДА асинхронным или ВСЕГДА синхронным — никогда то/другое в зависимости от условий.

**Q9: Как протестировать код с callbacks?**

В Jest/Vitest: использовать параметр `done` в тестовой функции или обернуть в Promise. Рекомендуемый современный подход — промисифицировать тестируемую функцию и использовать `async/await` в тестах. Для Node.js-style callbacks: `util.promisify` в начале теста. Для сложных callback chains — mock стоблей с `jest.fn()`, проверять вызов через `expect(callback).toHaveBeenCalledWith(null, expectedResult)`. Тестирование ошибок: `expect(callback).toHaveBeenCalledWith(expect.any(Error))`. Изоляция: тестировать callback-функции отдельно (именованные функции), не через всю цепочку.

**Q10: Почему `callback(null, result)` — плохая замена для Promise?**

Error-first callbacks работают только при правильном соглашении — их легко нарушить: забыть `return`, вызвать дважды, обработать ошибку после кода. Promise предоставляет машину состояний: разрешённый однажды — никогда не изменится, гарантированно одноразовый вызов. Callbacks не поддерживают композицию без сложного кода — Promise chains читаются линейно. Обработка ошибок в callbacks дублируется на каждом уровне — Promise передаёт ошибку вниз по цепочке автоматически. С введением async/await в ES2017 callbacks как основной механизм асинхронности устарели. Оставлять callbacks только там где это требуется (Event Emitter API, старые библиотеки).

---

### 5. Практическое задание

**Задание:** Реализуйте функции `promisify` и `callbackify`.

Требования для `promisify`:
- Принимает функцию с error-first колбэком
- Возвращает её Promise-версию
- Поддерживает `[util.promisify.custom]` символ
- Сохраняет контекст (`this`)

Требования для `callbackify`:
- Принимает async-функцию (возвращающую Promise)
- Возвращает функцию с error-first колбэком
- Обрабатывает edge case с `null`/`undefined` результатом
- Callback вызывается асинхронно (через `process.nextTick`)

---

### 6. Решение с инсайтом

```typescript
// --- promisify ---

const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");

type NodeCallback<T> = (err: Error | null, result?: T) => void;
type NodeCallbackFn<T> = (
  ...args: [...unknown[], NodeCallback<T>]
) => void;

function myPromisify<T>(fn: NodeCallbackFn<T> & {
  [kCustomPromisifiedSymbol]?: (...args: unknown[]) => Promise<T>;
}): (...args: unknown[]) => Promise<T> {
  // Поддержка custom promisified версии (например, fs.readFile имеет свою)
  if (typeof fn[kCustomPromisifiedSymbol] === "function") {
    return fn[kCustomPromisifiedSymbol]!;
  }

  function promisified(this: unknown, ...args: unknown[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Добавляем наш callback в конец аргументов
      const callback: NodeCallback<T> = (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as T);
        }
      };

      // Вызываем оригинальную функцию с сохранённым this
      fn.call(this, ...args, callback);
    });
  }

  // Маркируем промисифицированную версию
  Object.defineProperty(promisified, kCustomPromisifiedSymbol, {
    value: promisified,
    enumerable: false,
    writable: false,
    configurable: true,
  });

  return promisified;
}

// --- callbackify ---

type AsyncFn<T> = (...args: unknown[]) => Promise<T>;

function myCallbackify<T>(fn: AsyncFn<T>): (
  ...args: [...unknown[], NodeCallback<T>]
) => void {
  return function (this: unknown, ...args: unknown[]): void {
    // Последний аргумент — callback
    const callback = args.pop() as NodeCallback<T>;

    if (typeof callback !== "function") {
      throw new TypeError("Последний аргумент должен быть функцией (callback)");
    }

    fn.apply(this, args)
      .then((result: T) => {
        // Edge case из документации Node.js:
        // если result === null, callback получит false чтобы null
        // не спутали с отсутствием ошибки
        const callbackResult = result == null ? (false as unknown as T) : result;
        
        // Callback вызывается асинхронно — предсказуемое поведение
        process.nextTick(callback, null, callbackResult);
      })
      .catch((err: unknown) => {
        // Убеждаемся что err — это Error
        const error =
          err instanceof Error
            ? err
            : new Error(String(err));

        process.nextTick(callback, error);
      });
  };
}

// --- Демонстрация ---

// Промисифицируем функцию с Node.js-style callback
function readFileLegacy(
  path: string,
  encoding: string,
  callback: NodeCallback<string>
): void {
  setTimeout(() => {
    if (path === "error.txt") {
      callback(new Error(`Файл ${path} не найден`));
      return;
    }
    callback(null, `Содержимое файла: ${path}`);
  }, 100);
}

const readFileAsync = myPromisify(readFileLegacy);

// Callbackify-ируем async-функцию
async function fetchUserAsync(id: string): Promise<{ id: string; name: string }> {
  await new Promise((r) => setTimeout(r, 100));
  if (!id) throw new Error("ID обязателен");
  return { id, name: `User ${id}` };
}

const fetchUserCallback = myCallbackify(fetchUserAsync);

// --- Тесты ---
async function runTests() {
  console.log("=== promisify ===");

  const data = await readFileAsync("data.txt", "utf8");
  console.log(data); // "Содержимое файла: data.txt"

  try {
    await readFileAsync("error.txt", "utf8");
  } catch (err) {
    console.log("promisify error:", (err as Error).message); // "Файл error.txt не найден"
  }

  console.log("\n=== callbackify ===");

  fetchUserCallback("42", (err, user) => {
    if (err) {
      console.error("Ошибка:", err.message);
      return;
    }
    console.log("Пользователь:", user); // { id: "42", name: "User 42" }
  });

  fetchUserCallback("", (err, user) => {
    if (err) {
      console.log("callbackify error:", err.message); // "ID обязателен"
      return;
    }
  });
}

runTests();
```

> **Ключевой инсайт:** Callbacks — не устаревший антипаттерн, а фундамент, на котором построен весь async JS. Promise и async/await — это слои абстракции над callbacks, решающие конкретные проблемы (IoC, pyramid of doom, неявная обработка ошибок). Понимание callbacks объясняет, ПОЧЕМУ Promise был создан именно таким, а не иным. `promisify` и `callbackify` — не просто утилиты: они показывают что Promise и callbacks — два способа описать одно и то же — передачу результата async-операции. Зная оба, вы можете легко перемещаться между ними.

← Предыдущая тема: [17 — Promise.all / race / any]

---

## Итог Раздела 5

| Тема | Ключевая концепция | Паттерн для интервью |
|------|-------------------|---------------------|
| 15 — Promise | Необратимость состояний, цепочки `.then()` | Промисификация, `.allSettled` для виджетов |
| 16 — async/await | Синтаксический сахар над Promise, не блокирует JS | `fetchWithRetry`, `safeAsync`, параллелизм |
| 17 — Promise.all/race/any | 4 метода для координации промисов | `pooledAll`, CDN fallback, graceful degradation |
| 18 — Callbacks | Фундамент async JS, Inversion of Control | `promisify`, `callbackify`, error-first |

🔗 **Связь с другими разделами:**
- **Тема 1 (Event Loop)** — понимание Event Loop объясняет, почему callbacks/Promise/await работают именно так
- **Раздел 8 (Обработка ошибок)** — паттерны из этого раздела применяются к async операциям
- **Раздел 6 (Модули)** — top-level await работает только в ES Modules

---

*Конец Раздела 5*
