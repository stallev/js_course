# Контент курса — Раздел 8: Паттерны и архитектура

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 8 — Темы 25–28 (Обработка ошибок · Observer/Factory · Иммутабельность · SOLID/DRY/KISS)

---

# Раздел 8 — Паттерны и архитектура

*Завершающий раздел курса объединяет всё изученное в архитектурные паттерны. Здесь нет новых языковых механизмов — здесь применение всего предыдущего: замыканий (Тема 3), классов (Тема 13), иммутабельности (связь с Темой 5), TypeScript (Тема 24). Это то, что отличает Middle-разработчика от Junior: умение видеть код как систему.*

🔗 **Связь с разделами:** Обработка ошибок использует async/await (Раздел 5). Observer реализуется через замыкания (Тема 3) или классы (Тема 13). Иммутабельность связана с Значение vs Ссылка (Тема 5) и Array API (Тема 20). SOLID применяется ко всему написанному ранее.

---

## Темы раздела

| Тема | Название | Ключевая концепция |
|------|----------|--------------------|
| 25 | Обработка ошибок | Custom Error · Result pattern · Error hierarchy |
| 26 | Паттерны: Observer, Factory | Реактивность · Фабрики · Strategy |
| 27 | Иммутабельность | Structural sharing · Immer · ES2023 |
| 28 | SOLID / DRY / KISS | Принципы · Рефакторинг · Архитектура |

---

---

# Тема 25 — Обработка ошибок

← Предыдущая тема: [24 — TypeScript на практике]

---

## 1. Теория с аналогиями

### Аналогия: страховка в альпинизме

Опытный альпинист не надеется на одну верёвку. У него система страховки: основная верёвка → промежуточные точки страховки → страховочный партнёр → спасательная служба. Каждый уровень — отдельная ответственность. Если что-то пошло не так на первом уровне — система не рушится, а передаёт управление следующему уровню.

Обработка ошибок в приложении — то же самое:

```
Пользователь нажал кнопку
        │
        ▼
  ┌─────────────┐
  │  UI Layer   │  ◄── Error Boundary (React), catch в обработчике события
  └──────┬──────┘
         │ throw AppError
         ▼
  ┌─────────────┐
  │ Service Layer│ ◄── try/catch в бизнес-логике, Result pattern
  └──────┬──────┘
         │ throw NetworkError / ValidationError
         ▼
  ┌─────────────┐
  │  API Layer  │  ◄── HTTP статус коды, centralized error handler
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Logger     │  ◄── Sentry / console.error / structured logging
  └─────────────┘
```

Каждый уровень знает о своей ответственности и не пытается решить чужие проблемы.

---

### "Глотание" ошибок — тихая смерть приложения

```typescript
// Типичная катастрофа в продакшне
async function getUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  } catch (e) {
    // Пустой catch = ошибка исчезла, как будто её не было.
    // Пользователь видит зависший UI, в консоли — тишина.
  }
}
```

Ошибка «проглочена»: fetch провалился, но функция вернёт `undefined`, а вызывающий код не узнает почему.

---

### Кастомные классы ошибок — иерархия страховки

Вместо `throw new Error('что-то пошло не так')` создаём иерархию ошибок с понятной структурой:

```typescript
// Базовый класс для всего приложения
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,     // машиночитаемый код: 'USER_NOT_FOUND'
    public readonly statusCode: number // HTTP статус для API: 404, 422, 500
  ) {
    super(message);
    this.name = this.constructor.name; // имя класса вместо 'Error'
    
    // Фикс для instanceof в TypeScript при компиляции в ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Специализированные ошибки наследуют базовый класс
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 'NOT_FOUND', 404);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string> // конкретные поля с ошибками
  ) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

class NetworkError extends AppError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

// Использование: точный тип ошибки → точная обработка
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  
  if (response.status === 404) throw new NotFoundError('User', id);
  if (!response.ok) throw new NetworkError(`HTTP ${response.status}`);
  
  return response.json();
}

// Вызывающий код знает, что именно пошло не так
try {
  const user = await fetchUser('123');
} catch (e) {
  if (e instanceof NotFoundError) {
    // показываем 404 страницу
  } else if (e instanceof ValidationError) {
    // показываем ошибки формы: e.fields
  } else if (e instanceof AppError) {
    // общая обработка всех бизнес-ошибок
  } else {
    // непредвиденная ошибка — логируем и показываем generic message
    console.error('Unexpected error:', e);
  }
}
```

---

### Result паттерн — явная обработка без исключений

Go и Rust используют этот подход. Вместо `throw` возвращаем `[data, error]` — вызывающий код обязан проверить оба варианта.

```typescript
// Тип Result: либо успех с данными, либо ошибка — и ничего посередине
type Result<T, E = Error> =
  | { ok: true;  data: T; error: null }
  | { ok: false; data: null; error: E };

// Хелперы для создания результата
const ok = <T>(data: T): Result<T> => ({ ok: true, data, error: null });
const err = <E extends Error>(error: E): Result<never, E> =>
  ({ ok: false, data: null, error });

// Обёртка для async функций — автоматически ловит исключения
async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Теперь fetch возвращает явный результат, а не бросает исключения
async function getUser(id: string): Promise<Result<User, AppError>> {
  const response = await fetch(`/api/users/${id}`);

  if (response.status === 404) return err(new NotFoundError('User', id));
  if (!response.ok) return err(new NetworkError(`HTTP ${response.status}`));

  const data = await response.json();
  return ok(data as User);
}

// Вызывающий код — TypeScript заставит проверить ok перед использованием data
const result = await getUser('123');

if (!result.ok) {
  console.error(result.error.message);
  return; // data здесь типизирован как null — нельзя использовать
}

// Здесь data — User, не null, TypeScript это знает
console.log(result.data.name);
```

---

### Когда `throw`, когда `return error`

| Ситуация | Рекомендация |
|----------|-------------|
| Программная ошибка (баг в коде) | `throw` — пусть упадёт громко |
| Предсказуемая бизнес-ошибка | `return err(...)` — Result паттерн |
| Ошибка во внешнем слое (API, UI boundary) | `throw` — перехватит boundary/middleware |
| Library code (SDK, утилиты) | `throw` с кастомным классом ошибки |
| Server Action в Next.js | `return { error: '...' }` — не throw |

---

## 2. Связь со стеком

### Next.js App Router — специализированные файлы ошибок

```tsx
// app/users/[id]/error.tsx — перехватывает ошибки внутри роута
'use client'; // Error Boundary — всегда клиентский компонент

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string }; // digest — серверный идентификатор ошибки
  reset: () => void;
}

export default function UserError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Логируем в Sentry / аналитику
    console.error('Route error:', error);
  }, [error]);

  return (
    <div>
      <h2>Не удалось загрузить пользователя</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  );
}

// app/users/[id]/not-found.tsx — специально для notFound()
export default function UserNotFound() {
  return <h2>Пользователь не найден</h2>;
}

// app/users/[id]/page.tsx — использование notFound()
import { notFound } from 'next/navigation';

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id);
  
  if (!user) notFound(); // перенаправит на not-found.tsx
  
  return <UserProfile user={user} />;
}
```

---

### Server Actions — безопасный возврат ошибок клиенту

```typescript
// actions/user.ts
'use server';

// НЕ бросаем ошибки из Server Action — они не дойдут до клиента правильно
// Возвращаем discriminated union
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string> };

export async function updateUserAction(
  formData: FormData
): Promise<ActionResult<User>> {
  const name = formData.get('name') as string;
  
  if (!name || name.length < 2) {
    return {
      success: false,
      error: 'Validation failed',
      fields: { name: 'Минимум 2 символа' }
    };
  }

  try {
    const user = await db.user.update({ where: { id: '...' }, data: { name } });
    return { success: true, data: user };
  } catch {
    // Не пробрасываем оригинальную ошибку клиенту — безопасность
    return { success: false, error: 'Ошибка сервера, попробуйте позже' };
  }
}
```

---

### React Error Boundary — последняя линия обороны UI

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Отправляем в Sentry или другой инструмент мониторинга
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}

// Использование
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Что-то пошло не так: {error.message}</p>
      <button onClick={reset}>Сбросить</button>
    </div>
  )}
>
  <UserDashboard />
</ErrorBoundary>
```

---

### TypeScript — типизация ошибок через discriminated union

```typescript
// 🔗 Связь с темой 24 (TypeScript)
// TypeScript не имеет типа для catch — e всегда unknown
// Discriminated union решает это элегантно

type ApiError =
  | { type: 'not_found'; id: string }
  | { type: 'validation'; fields: Record<string, string> }
  | { type: 'network'; statusCode: number }
  | { type: 'unknown'; originalError: unknown };

function handleApiError(error: ApiError): string {
  // TypeScript сужает тип в каждой ветке — exhaustive check
  switch (error.type) {
    case 'not_found':     return `Ресурс ${error.id} не найден`;
    case 'validation':    return Object.values(error.fields).join(', ');
    case 'network':       return `Ошибка сети: HTTP ${error.statusCode}`;
    case 'unknown':       return 'Непредвиденная ошибка';
  }
  // TypeScript знает, что все случаи покрыты — нет необходимости в default
}
```

---

## 3. Лучшие паттерны

### Паттерн 1: Кастомные классы ошибок

❌ **Антипаттерн:**
```typescript
// Throw строки или plain Error — нет структуры, нет типизации
throw 'user not found';
throw new Error('validation failed');

// В catch нельзя понять что произошло
try {
  await updateUser(data);
} catch (e) {
  // e — строка? Error? Непонятно. Приходится парсить message.
  if (e.message.includes('not found')) { /* хрупкая проверка */ }
}
```

✅ **Правильно:**
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public readonly fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

// В catch — чёткая проверка через instanceof
try {
  await updateUser(data);
} catch (e) {
  if (e instanceof ValidationError) {
    // e.fields — типизировано, никакого парсинга строк
    setErrors(e.fields);
  }
}
```

**Объяснение:** `instanceof` работает благодаря `Object.setPrototypeOf` — без него TypeScript при компиляции в ES5 ломает прототипную цепочку. `code` — для машиночитаемой обработки, `statusCode` — для HTTP API.

---

### Паттерн 2: Result паттерн для предсказуемых ошибок

❌ **Антипаттерн:**
```typescript
// Исключения для ожидаемых сценариев — дорого и неявно
async function parseUserInput(input: string): Promise<User> {
  if (!input) throw new Error('empty input'); // ожидаемая ситуация
  // ...
}

// Каждый вызов нужно оборачивать в try/catch
const user = await parseUserInput(raw); // может бросить — вызывающий должен помнить
```

✅ **Правильно:**
```typescript
// Result паттерн — явный контракт: всегда возвращает, никогда не бросает
async function parseUserInput(input: string): Promise<Result<User, ValidationError>> {
  if (!input) return err(new ValidationError('Empty input', { input: 'Required' }));
  if (input.length > 100) return err(new ValidationError('Too long', { input: 'Max 100 chars' }));
  
  return ok({ name: input.trim() } as User);
}

// TypeScript заставляет проверить результат
const result = await parseUserInput(raw);
if (!result.ok) {
  showFieldErrors(result.error.fields); // data = null здесь, TypeScript это знает
  return;
}
// data гарантированно User, не null
displayUser(result.data);
```

**Объяснение:** Result паттерн делает контракт функции явным: вызывающий код видит в сигнатуре, что ошибки возможны, и TypeScript не даст использовать `data` без проверки.

---

### Паттерн 3: Централизованный обработчик

❌ **Антипаттерн:**
```typescript
// Логирование разбросано по всему приложению
async function fetchUser(id: string) {
  try {
    // ...
  } catch (e) {
    console.log('fetchUser error:', e); // дублирование логики
    // каждая функция логирует по-своему
  }
}

async function fetchPosts(userId: string) {
  try {
    // ...
  } catch (e) {
    console.error('posts error', e); // другой формат
  }
}
```

✅ **Правильно:**
```typescript
// Один обработчик — одна ответственность
interface ErrorReport {
  error: Error;
  context: string;
  userId?: string;
  timestamp: string;
}

function reportError(error: unknown, context: string): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  
  const report: ErrorReport = {
    error: normalized,
    context,
    timestamp: new Date().toISOString(),
  };

  // Один канал логирования
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(normalized, { extra: { context } });
  } else {
    console.error(`[${context}]`, normalized);
  }
}

// Все вызывающие используют единый API
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    return ok(await res.json());
  } catch (e) {
    reportError(e, 'fetchUser'); // единообразно
    return err(new NetworkError('Failed to fetch user', e));
  }
}
```

**Объяснение:** Централизованный обработчик позволяет переключить с `console.error` на Sentry в одном месте. Контекст помогает в дебаггинге: сразу видно, откуда пришла ошибка.

---

## 4. Вопросы интервью

**Q1: Что такое "глотание" ошибки и почему это плохо?**

"Глотание" — это когда блок `catch` перехватывает исключение, но ничего с ним не делает (пустой блок или только `console.log`). Плохо это потому, что функция возвращает `undefined` вместо данных, а вызывающий код не знает, что что-то пошло не так. В продакшне это проявляется как "зависший" UI без каких-либо сообщений об ошибке. Кроме того, потеря ошибки делает дебаг крайне сложным. Минимум — залогировать ошибку и вернуть безопасное значение или перебросить.

**Q2: Как создать кастомный класс ошибки в TypeScript?**

Нужно унаследоваться от `Error`, вызвать `super(message)` в конструкторе, установить `this.name = this.constructor.name` и обязательно добавить `Object.setPrototypeOf(this, new.target.prototype)`. Последняя строка критична при компиляции в ES5 — без неё `instanceof` не работает, потому что TypeScript разрывает прототипную цепочку при трансформации `class extends`. Дополнительные поля (`code`, `statusCode`) добавляются как публичные readonly свойства конструктора.

**Q3: Что такое Result паттерн и когда его применять?**

Result паттерн — это явный способ обработки ошибок без исключений. Функция возвращает `{ ok: true, data: T } | { ok: false, error: E }` вместо того, чтобы бросать исключение. Вызывающий код обязан проверить `ok` перед использованием `data`. Применяется для предсказуемых бизнес-ошибок (валидация, not found), особенно в Server Actions Next.js. Исключения (`throw`) остаются для непредвиденных программных ошибок или внешних библиотечных границ.

**Q4: Как обрабатывать ошибки в async/await vs Promise chains?**

В async/await — через `try/catch`, который ловит и `await`-промисы, и синхронные исключения. В Promise chains — через `.catch()` в конце цепочки. Основное различие: `try/catch` в async-функции ловит только внутри блока, при параллельном `Promise.all` нужен общий `try/catch` снаружи. В обоих случаях ошибка из `reject` или `throw` превращается в rejected promise, который нужно поймать. Предпочтительнее `async/await` — код линейный и понятный.

**Q5: Что такое Error Boundary в React и чем он ограничен?**

Error Boundary — это классовый компонент с `componentDidCatch` и `getDerivedStateFromError`, который перехватывает ошибки в дереве дочерних компонентов и отображает fallback UI вместо крэша. Ограничения: не перехватывает ошибки в обработчиках событий (там нужен `try/catch`), асинхронных операциях (не в рендере), самом Error Boundary и серверном рендеринге. Начиная с React 19 появился хук `useErrorBoundary`, но классовый подход остаётся для основного сценария.

**Q6: Как Next.js App Router обрабатывает ошибки на уровне роута?**

В App Router для каждого сегмента роута можно создать специальные файлы: `error.tsx` — перехватывает ошибки, брошенные внутри `page.tsx` и вложенных Server Components (автоматически является Error Boundary), `not-found.tsx` — отображается при вызове `notFound()` из Next.js или при 404. Ошибки "всплывают" до ближайшего `error.tsx` в иерархии. Глобальный `global-error.tsx` в корне перехватывает ошибки в корневом layout.

**Q7: Когда использовать `throw`, а когда `return error`?**

`throw` — для непредвиденных программных ошибок, когда нет смысла продолжать выполнение, и для ошибок, которые должны прерваться на уровне выше (middleware, Error Boundary). `return error` (Result паттерн) — для предсказуемых бизнес-ошибок: валидации, not found, rate limiting. В Server Actions Next.js — всегда `return`, не `throw`, потому что брошенные ошибки не передаются клиенту безопасно. В утилитах и SDK — лучше `throw` с кастомным классом, так как вызывающий код выбирает стратегию.

**Q8: Чем кастомный `Error` отличается от `throw 'string'`?**

`throw 'string'` бросает примитив, а не объект `Error`. У него нет `stack trace`, нет `instanceof` проверки, нет структуры. В блоке `catch` `e` — просто строка, нет `e.message`, `e.stack`. TypeScript будет недоволен (e имеет тип `unknown`). Кастомный `class MyError extends Error` сохраняет полный стек вызовов, поддерживает `instanceof`, позволяет добавить поля (`code`, `statusCode`) и хорошо интегрируется с системами мониторинга типа Sentry.

**Q9: Как типизировать ошибки в TypeScript?**

В блоке `catch` переменная имеет тип `unknown` (TypeScript 4+). Для безопасной работы нужно либо проверить `instanceof Error`, либо использовать type guard. Discriminated union (`{ type: 'not_found' } | { type: 'network' }`) — лучший способ типизировать разные виды ошибок: TypeScript сужает тип в каждой ветке switch/if. Result паттерн делает ошибки частью возвращаемого типа функции. Для утилиты можно написать `isError(e: unknown): e is Error` — проверка через type guard.

---

## 5. Практическое задание

Реализовать систему обработки ошибок для API клиента:

1. Создать иерархию ошибок: `AppError` → `NotFoundError`, `ValidationError`, `NetworkError`, `AuthError`
2. Реализовать Result паттерн с хелперами `ok()` и `err()`
3. Написать `safeFetch<T>(url, options)` — возвращает `Promise<Result<T, AppError>>` вместо бросания исключений
4. Хелпер для разбора ошибок: `parseHttpError(status: number): AppError`

Требования: TypeScript, без внешних зависимостей, все типы должны быть явными.

---

## 6. Решение с инсайтом

```typescript
// === Иерархия ошибок ===

class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} "${id}" не найден` : `${resource} не найден`;
    super(msg, 'NOT_FOUND', 404);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

class NetworkError extends AppError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

class AuthError extends AppError {
  constructor(message = 'Необходима аутентификация') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

// === Result паттерн ===

type Result<T, E extends Error = AppError> =
  | { ok: true;  data: T;    error: null }
  | { ok: false; data: null; error: E };

const ok  = <T>(data: T): Result<T>    => ({ ok: true,  data, error: null });
const err = <E extends Error>(e: E): Result<never, E> =>
  ({ ok: false, data: null, error: e });

// === Парсинг HTTP статусов ===

function parseHttpError(status: number, resource?: string): AppError {
  switch (status) {
    case 400: return new ValidationError('Неверный запрос');
    case 401: return new AuthError();
    case 404: return new NotFoundError(resource ?? 'Ресурс');
    case 422: return new ValidationError('Ошибка валидации');
    default:  return new NetworkError(`HTTP ошибка ${status}`);
  }
}

// === safeFetch — никогда не бросает исключений ===

async function safeFetch<T>(
  url: string,
  options?: RequestInit & { resource?: string }
): Promise<Result<T, AppError>> {
  try {
    const response = await fetch(url, options);

    // HTTP ошибки — превращаем в типизированные AppError
    if (!response.ok) {
      return err(parseHttpError(response.status, options?.resource));
    }

    // Безопасный парсинг JSON
    const data = await response.json() as T;
    return ok(data);

  } catch (e) {
    // Сетевая ошибка (нет соединения, таймаут, CORS)
    if (e instanceof TypeError) {
      return err(new NetworkError('Нет соединения с сервером', e));
    }
    return err(new NetworkError('Неизвестная ошибка сети', e));
  }
}

// === Использование ===

interface User {
  id: string;
  name: string;
  email: string;
}

async function loadUser(id: string): Promise<void> {
  const result = await safeFetch<User>(`/api/users/${id}`, {
    resource: 'User'
  });

  if (!result.ok) {
    // TypeScript знает: data = null, error = AppError
    const { error } = result;

    if (error instanceof AuthError) {
      console.log('Редирект на страницу входа');
      return;
    }
    if (error instanceof NotFoundError) {
      console.log('Пользователь не найден:', error.message);
      return;
    }
    // Общий случай AppError
    console.error(`[${error.code}]`, error.message);
    return;
  }

  // TypeScript знает: data = User, error = null
  console.log('Загружен пользователь:', result.data.name);
}
```

**Ключевой инсайт:** Иерархия ошибок + Result паттерн = два уровня явности. Иерархия делает тип ошибки машиночитаемым (`instanceof`). Result паттерн делает само наличие ошибки частью типа функции. Вместе они устраняют главную проблему обработки ошибок в JS — неявность: теперь и TypeScript, и разработчик, читающий код, сразу видят, что может пойти не так.

---

---

# Тема 26 — Паттерны: Observer, Factory

← Предыдущая тема: [25 — Обработка ошибок]

---

## 1. Теория с аналогиями

### Observer: аналогия — YouTube-подписка

Когда ты подписываешься на YouTube-канал, между тобой и каналом возникает связь: канал не знает о тебе конкретно — он просто "вещает". Ты (подписчик, Observer) получаешь уведомления. Можешь отписаться в любой момент. Новый подписчик не меняет поведение канала.

```
 Subject (YouTube канал)        Observers (подписчики)
 ┌──────────────────┐           ┌──────────┐
 │  subscribers: [] │──notify──►│ Alice    │
 │  subscribe()     │──notify──►│ Bob      │
 │  unsubscribe()   │──notify──►│ Charlie  │
 │  notify()        │           └──────────┘
 └──────────────────┘
        ▲
   новый контент
   (setState, event, emit)
```

**Три роли:**
- **Subject** — хранит список подписчиков, уведомляет их при изменении
- **Observer** — объект/функция, которую нужно вызвать при изменении
- **Subscription** — ссылка для отписки (важно для предотвращения утечек памяти)

---

### Observer в JavaScript-экосистеме

```
DOM Events           addEventListener / removeEventListener
Node.js EventEmitter  emitter.on('event', handler)
React useState        компонент = observer, state = subject
RxJS Observable       мощный Observer с операторами
Zustand / Redux       store = subject, useSelector = подписка
```

---

### Базовая реализация Observer

```typescript
// Observer — функция-обработчик события
type Observer<T> = (value: T) => void;

// Subscription — возвращается из subscribe для отписки
interface Subscription {
  unsubscribe: () => void;
}

class Observable<T> {
  // Множество вместо массива: O(1) для add/delete
  private observers = new Set<Observer<T>>();

  subscribe(observer: Observer<T>): Subscription {
    this.observers.add(observer);

    // Возвращаем объект с методом отписки — паттерн Disposable
    return {
      unsubscribe: () => this.observers.delete(observer)
    };
  }

  // Уведомляем всех текущих подписчиков
  protected notify(value: T): void {
    // Копируем перед итерацией — подписчик может отписаться во время notify
    for (const observer of [...this.observers]) {
      observer(value);
    }
  }
}

// Subject расширяет Observable — может вызывать notify снаружи
class Subject<T> extends Observable<T> {
  next(value: T): void {
    this.notify(value);
  }
}

// === Использование ===

const counter = new Subject<number>();

const sub1 = counter.subscribe(v => console.log('Observer A:', v));
const sub2 = counter.subscribe(v => console.log('Observer B:', v));

counter.next(1); // Observer A: 1 | Observer B: 1
counter.next(2); // Observer A: 2 | Observer B: 2

sub1.unsubscribe(); // Alice отписалась

counter.next(3); // Observer B: 3 (только B)
```

---

### Factory: аналогия — конструктор LEGO

В LEGO есть фабрика деталей: ты говоришь "дай мне деталь типа 'колесо' размера 'большое'" — и получаешь нужную деталь. Ты не знаешь, как именно она создаётся (форма, материал). Фабрика скрывает детали создания и предоставляет единую точку входа.

```
Без Factory:                      С Factory:
                                  
const btn = new Button(...)       const btn = createButton('primary', 'lg')
const btn = new PrimaryButton()   
const btn = new LargeButton()     // Фабрика знает, какой класс/объект создать
// Вызывающий знает про все классы // Вызывающий знает только конфигурацию
```

---

### Function Factory vs Class Factory

```typescript
// ❌ Class Factory — излишний ceremony, требует new
class ButtonFactory {
  create(type: 'primary' | 'secondary', size: 'sm' | 'md' | 'lg') {
    return { type, size, variant: type === 'primary' ? 'solid' : 'outline' };
  }
}
const factory = new ButtonFactory();
const btn = factory.create('primary', 'md');

// ✅ Function Factory — проще, тот же результат
function createButton(type: 'primary' | 'secondary', size: 'sm' | 'md' | 'lg') {
  return { type, size, variant: type === 'primary' ? 'solid' : 'outline' };
}
const btn = createButton('primary', 'md');

// ✅✅ Factory с замыканием — конфигурируемая фабрика
// 🔗 Связь с темой 3 (Замыкания)
function createApiClient(baseUrl: string, token: string) {
  const headers = { Authorization: `Bearer ${token}` };

  return {
    get:    <T>(path: string) => safeFetch<T>(`${baseUrl}${path}`, { headers }),
    post:   <T>(path: string, body: unknown) =>
      safeFetch<T>(`${baseUrl}${path}`, { method: 'POST', headers,
        body: JSON.stringify(body) }),
    delete: <T>(path: string) =>
      safeFetch<T>(`${baseUrl}${path}`, { method: 'DELETE', headers }),
  };
}

// Создаём клиент один раз — передаём в компоненты
const apiClient = createApiClient('/api/v1', process.env.API_TOKEN!);
const result = await apiClient.get<User[]>('/users');
```

---

### Strategy паттерн через Factory — полиморфизм без if/else

```typescript
// Strategy — объект, определяющий "алгоритм" для конкретного случая
interface SortStrategy<T> {
  sort(items: T[]): T[];
  label: string;
}

// Factory создаёт нужную стратегию по ключу
function createSortStrategy<T>(
  type: 'asc' | 'desc' | 'shuffle',
  key: keyof T
): SortStrategy<T> {
  switch (type) {
    case 'asc':
      return {
        label: 'По возрастанию',
        sort: items => [...items].sort((a, b) =>
          String(a[key]) < String(b[key]) ? -1 : 1
        )
      };
    case 'desc':
      return {
        label: 'По убыванию',
        sort: items => [...items].sort((a, b) =>
          String(a[key]) > String(b[key]) ? -1 : 1
        )
      };
    case 'shuffle':
      return {
        label: 'Случайно',
        sort: items => [...items].sort(() => Math.random() - 0.5)
      };
  }
}

// Вызывающий код не знает про детали сортировки
const strategy = createSortStrategy<User>('asc', 'name');
const sorted = strategy.sort(users);
// Добавить новый тип сортировки = добавить case в фабрику, не менять код выше
```

---

## 2. Связь со стеком

### React: useState — это Observer паттерн внутри

```typescript
// 🔗 Связь с темой 12 (React хуки)
// Упрощённая модель того, что делает React под капотом

const reactInternals = {
  subscribers: new Map<string, Set<() => void>>(),
  
  // useState регистрирует компонент как "observer" стейта
  useState<T>(key: string, initial: T) {
    let value = initial;
    
    return [
      // getter
      () => value,
      // setter = Subject.next() — уведомляет React, что нужен ре-рендер
      (newValue: T) => {
        value = newValue;
        // React планирует ре-рендер всех компонентов, использующих этот стейт
        this.subscribers.get(key)?.forEach(rerender => rerender());
      }
    ] as const;
  }
};

// Реальный React: компонент = Observer, setState = Subject.next()
function Counter() {
  const [count, setCount] = useState(0); // подписываемся на обновления

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  // При каждом setCount React вызывает функцию компонента заново = observer.update()
}
```

---

### React Context — Observer с широковещанием

```tsx
// Context Provider = Subject (вещает)
// useContext = subscribe (подписка Observer)

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Subject.next() — каждый потребитель Context перерендерится
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Observer — подписывается на изменения темы
function Header() {
  const { theme, toggle } = useContext(ThemeContext)!;
  // Перерендерится при каждом изменении Theme — Observer pattern
  return <button onClick={toggle}>Тема: {theme}</button>;
}
```

---

### Factory для конфигурируемых хуков

```typescript
// Хук-фабрика — создаёт кастомизированный хук под конкретный ресурс
function createResourceHook<T>(endpoint: string) {
  return function useResource(id: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLoading(true);
      fetch(`${endpoint}/${id}`)
        .then(r => r.json())
        .then(d => setData(d))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }, [id]);

    return { data, loading, error };
  };
}

// Создаём специализированные хуки один раз
const useUser  = createResourceHook<User>('/api/users');
const usePost  = createResourceHook<Post>('/api/posts');
const useOrder = createResourceHook<Order>('/api/orders');

// Используем как обычные хуки
function UserCard({ userId }: { userId: string }) {
  const { data: user, loading } = useUser(userId);
  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

---

## 3. Лучшие паттерны

### Паттерн 1: Типобезопасный Observable с generics

❌ **Антипаттерн:**
```typescript
// Нет типизации — подписчики получают unknown
class EventBus {
  private handlers: Record<string, Function[]> = {};

  on(event: string, handler: Function) {
    this.handlers[event] = [...(this.handlers[event] ?? []), handler];
  }
  emit(event: string, data: any) {
    this.handlers[event]?.forEach(h => h(data)); // any = потеря типов
  }
}

bus.on('userCreated', (data) => {
  data.nme; // опечатка — TypeScript не поймает, data = any
});
```

✅ **Правильно:**
```typescript
// TypeScript generics обеспечивают типобезопасность
type EventMap = Record<string, unknown>;

class TypedEventEmitter<Events extends EventMap> {
  private handlers = new Map<
    keyof Events,
    Set<(payload: Events[keyof Events]) => void>
  >();

  on<K extends keyof Events>(
    event: K,
    handler: (payload: Events[K]) => void
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as (payload: Events[keyof Events]) => void);

    return () => set.delete(handler as (payload: Events[keyof Events]) => void);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach(h => h(payload as Events[keyof Events]));
  }
}

// TypeScript знает типы для каждого события
interface AppEvents {
  userCreated: { id: string; name: string };
  orderPlaced: { orderId: string; total: number };
}

const emitter = new TypedEventEmitter<AppEvents>();

emitter.on('userCreated', (user) => {
  console.log(user.name); // TypeScript: user.id и user.name — правильно
  // user.nme — TypeScript ошибка: Property 'nme' does not exist
});

emitter.emit('userCreated', { id: '1', name: 'Alice' }); // типы проверяются
```

**Объяснение:** Generics с `keyof Events` связывают имя события и тип данных в compile-time — нельзя передать неправильные данные в `emit` или обратиться к несуществующему полю в обработчике.

---

### Паттерн 2: Function Factory вместо Class Factory

❌ **Антипаттерн:**
```typescript
// Class Factory — избыточная сложность для простого создания объектов
class NotificationFactory {
  private defaultOptions = { duration: 3000 };

  createSuccess(message: string) {
    return { type: 'success' as const, message, ...this.defaultOptions };
  }
  createError(message: string) {
    return { type: 'error' as const, message, ...this.defaultOptions };
  }
}

// Нужно создать экземпляр, хотя нет состояния
const factory = new NotificationFactory();
const n = factory.createSuccess('Сохранено!');
```

✅ **Правильно:**
```typescript
interface Notification {
  id:       string;
  type:     'success' | 'error' | 'warning' | 'info';
  message:  string;
  duration: number;
}

// Фабрика — просто функция, возвращающая объект
function createNotification(
  type: Notification['type'],
  message: string,
  duration = 3000
): Notification {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    duration,
  };
}

// Специализированные фабрики как частичное применение
const success = (msg: string) => createNotification('success', msg);
const error   = (msg: string) => createNotification('error', msg, 5000);
const warning = (msg: string) => createNotification('warning', msg, 4000);

// Использование — читаемо и просто
const n = success('Данные сохранены!');
```

**Объяснение:** Class Factory оправдан только если нужно состояние или наследование. В остальных случаях чистые функции проще, тестируемее и не требуют `this`.

---

### Паттерн 3: Strategy через Factory для устранения if/else

❌ **Антипаттерн:**
```typescript
// Добавление нового типа = редактирование всей функции
function formatValue(value: unknown, type: string): string {
  if (type === 'currency') return `$${Number(value).toFixed(2)}`;
  if (type === 'date') return new Date(String(value)).toLocaleDateString();
  if (type === 'percent') return `${Number(value) * 100}%`;
  // Добавить новый формат — нужно открыть эту функцию (нарушение OCP)
  return String(value);
}
```

✅ **Правильно:**
```typescript
// Стратегия — функция форматирования
type Formatter = (value: unknown) => string;

// Реестр стратегий — легко расширяется без изменения существующего кода
const formatters: Record<string, Formatter> = {
  currency: v => `$${Number(v).toFixed(2)}`,
  date:     v => new Date(String(v)).toLocaleDateString('ru-RU'),
  percent:  v => `${(Number(v) * 100).toFixed(1)}%`,
  default:  v => String(v),
};

// Factory выбирает стратегию — 1 строка
function createFormatter(type: string): Formatter {
  return formatters[type] ?? formatters.default;
}

// Использование — вызывающий код не знает о деталях форматирования
const formatCurrency = createFormatter('currency');
console.log(formatCurrency(19.99)); // "$19.99"

// Расширение: добавить новый тип = добавить запись в объект, не трогать функцию
formatters.phone = v => String(v).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
```

**Объяснение:** 🔗 Связь с темой 28 (OCP). Реестр стратегий + Factory = открыты для расширения, закрыты для модификации. Новый тип форматирования — одна строка в реестре, нулевой риск сломать существующие форматтеры.

---

## 4. Вопросы интервью

**Q1: Что такое Observer паттерн?**

Observer — это поведенческий паттерн, в котором объект (Subject/Observable) хранит список зависимых объектов (Observer) и автоматически уведомляет их при изменении своего состояния. Subject не знает конкретику Observers — только то, что у них есть метод обновления. Это обеспечивает слабую связанность (loose coupling): добавить или удалить Observer можно без изменения Subject. Паттерн лежит в основе всей реактивной программирования — DOM events, EventEmitter, RxJS, React state.

**Q2: Где Observer используется в JS-экосистеме?**

Везде, где есть подписка и уведомление: `addEventListener/removeEventListener` в DOM, `EventEmitter` в Node.js, `useState`/`useReducer` в React (компонент = Observer, state = Subject), React Context (Provider = Subject, useContext = subscribe), Zustand и Redux stores (store = Subject, useSelector = Observer), RxJS Observable — расширенная версия с операторами трансформации потока. Понимание Observer помогает объяснить, почему `setCount(prev => prev + 1)` вызывает ре-рендер.

**Q3: Что такое Factory паттерн и зачем он нужен?**

Factory — это паттерн создания объектов, который инкапсулирует логику создания за единой точкой входа. Клиентский код не знает, какой конкретно класс или структура создаётся — он просто передаёт параметры фабрике. Зачем: убирает жёсткую связь между создателем и конкретными типами, централизует логику инициализации, позволяет менять создаваемый тип без изменения вызывающего кода. В JS реализуется через функции (function factory), не обязательно через классы.

**Q4: Разница между function factory и class Factory?**

Function factory — это функция, которая создаёт и возвращает объект/функцию, используя замыкание для хранения состояния. Class Factory — это класс с методом `create()` или похожим. В JavaScript function factory предпочтительна: нет `this`, нет `new`, проще тестировать, лучше работает с TypeScript type inference, поддерживает частичное применение. Class Factory оправдана, когда нужно наследование или когда фабрика сама имеет состояние (кэш, счётчик).

**Q5: Что такое Strategy паттерн?**

Strategy — это поведенческий паттерн, который определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми. Вместо if/else по типу — реестр стратегий (объект или Map), где ключ = тип, значение = функция алгоритма. Новый алгоритм = новая запись в реестре, не модификация существующей логики. Хорошо сочетается с Factory: фабрика выбирает стратегию, вызывающий код использует единый интерфейс.

**Q6: Как Observer связан с реактивностью в React?**

React использует Observer паттерн для отслеживания изменений состояния. `useState` — это Subject с подписчиком: React регистрирует компонент как "Observer" состояния. Когда вызывается `setState`, React уведомляет компонент о необходимости ре-рендера, как `Subject.notify()` уведомляет Observers. React Context делает то же самое в масштабе дерева компонентов: `Provider` = Subject, все компоненты с `useContext` = Observers. Разница с чистым Observer: React батчит уведомления для производительности.

**Q7: Когда паттерны НЕ нужны (over-engineering)?**

Паттерн нужен, когда проблема реально существует, а не для "красивого кода". Observer не нужен для одного компонента с одним обработчиком события — там достаточно колбека. Factory не нужна для создания одного типа объекта без вариаций. Признаки over-engineering: паттерн добавляет слой абстракции без реальной выгоды, код сложнее читается, чем без паттерна, проблема, которую решает паттерн, не существует в реальности. Правило: сначала пишем прямой код, потом извлекаем паттерн при появлении реальной необходимости.

**Q8: Чем Observer отличается от Pub/Sub?**

В Observer паттерне Subject и Observer знают друг о друге — Subject хранит ссылки на Observers напрямую. В Pub/Sub (Publisher/Subscriber) есть посредник (Event Bus / Message Broker): Publisher публикует событие в Bus, не зная о Subscribers. Bus доставляет событие всем подписчикам на этот тип события. Pub/Sub обеспечивает большую развязку: Publisher и Subscriber не связаны напрямую, могут находиться в разных модулях или даже процессах. В браузере `CustomEvent` — Pub/Sub, `useState` React — Observer.

**Q9: Что такое Factory Method vs Abstract Factory?**

Factory Method — это метод в базовом классе/объекте, который создаёт объект определённого типа. Подклассы переопределяют этот метод для создания конкретных типов. Abstract Factory — это интерфейс для создания семейств связанных объектов без указания конкретных классов. Пример: Factory Method создаёт кнопку, Abstract Factory создаёт всю UI-тему (кнопка + инпут + модал) для конкретного варианта (light/dark). В JavaScript оба паттерна чаще реализуются через функции или объекты с методами, без классов.

---

## 5. Практическое задание

Реализовать систему уведомлений:

1. `Observable<T>` — типобезопасный observable с `subscribe` / `unsubscribe` через generics
2. `NotificationService` — Subject, который управляет очередью уведомлений
3. Factory функции для создания уведомлений разных типов (`success`, `error`, `warning`)
4. Продемонстрировать: подписку нескольких Observers, отписку одного, что другие продолжают получать события

---

## 6. Решение с инсайтом

```typescript
// === Типобезопасный Observable ===

type Observer<T> = (value: T) => void;

interface Subscription {
  unsubscribe(): void;
}

class Observable<T> {
  private observers = new Set<Observer<T>>();

  subscribe(observer: Observer<T>): Subscription {
    this.observers.add(observer);
    return { unsubscribe: () => this.observers.delete(observer) };
  }

  protected notify(value: T): void {
    // Копия для безопасной итерации при отписке внутри обработчика
    for (const observer of [...this.observers]) {
      observer(value);
    }
  }

  get subscriberCount(): number {
    return this.observers.size;
  }
}

// === Типы уведомлений ===

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id:        string;
  type:      NotificationType;
  message:   string;
  duration:  number;
  createdAt: Date;
}

// === Factory функции ===

function createNotification(
  type: NotificationType,
  message: string,
  duration: number
): Notification {
  return { id: crypto.randomUUID(), type, message, duration, createdAt: new Date() };
}

// Частичное применение factory — специализированные функции
const notificationFactories = {
  success: (msg: string) => createNotification('success', msg, 3000),
  error:   (msg: string) => createNotification('error', msg, 5000),
  warning: (msg: string) => createNotification('warning', msg, 4000),
  info:    (msg: string) => createNotification('info', msg, 3000),
} satisfies Record<NotificationType, (msg: string) => Notification>;

// === NotificationService — Subject ===

class NotificationService extends Observable<Notification> {
  private queue: Notification[] = [];

  push(notification: Notification): void {
    this.queue.push(notification);
    this.notify(notification); // уведомляем всех подписчиков

    // Авто-удаление через duration
    setTimeout(() => this.dismiss(notification.id), notification.duration);
  }

  dismiss(id: string): void {
    this.queue = this.queue.filter(n => n.id !== id);
  }

  getQueue(): readonly Notification[] {
    return this.queue;
  }
}

// === Демонстрация ===

const service = new NotificationService();

// Observer 1 — логирует в консоль
const logSub = service.subscribe(n => {
  console.log(`[LOG] ${n.type.toUpperCase()}: ${n.message}`);
});

// Observer 2 — собирает статистику
const stats = { success: 0, error: 0, warning: 0, info: 0 };
const statsSub = service.subscribe(n => {
  stats[n.type]++;
  console.log(`[STATS] Всего ошибок: ${stats.error}`);
});

// Observer 3 — отправляет в аналитику
const analyticsSub = service.subscribe(n => {
  if (n.type === 'error') {
    console.log(`[ANALYTICS] Отправляем ошибку: ${n.id}`);
  }
});

// Публикуем уведомления
service.push(notificationFactories.success('Данные сохранены'));
service.push(notificationFactories.error('Ошибка сети'));
service.push(notificationFactories.warning('Сессия истекает'));

console.log('\nОтписываем ANALYTICS observer...');
analyticsSub.unsubscribe();

service.push(notificationFactories.error('Ещё одна ошибка'));
// LOG и STATS получат событие, ANALYTICS — нет

console.log('Подписчиков:', service.subscriberCount); // 2
```

**Ключевой инсайт:** Observer — это не просто паттерн, это фундамент реактивного программирования. Когда ты понимаешь Observer, ты понимаешь React state, Context, Zustand, RxJS — всё это вариации одной идеи: "Subject хранит список Observers и уведомляет их при изменении". Factory убирает повторение `new` и конкретных типов из вызывающего кода — клиент работает с конфигурацией, не с классами.

---

---

# Тема 27 — Иммутабельность

← Предыдущая тема: [26 — Паттерны: Observer, Factory]

---

## 1. Теория с аналогиями

### Аналогия: банковская выписка

Банк никогда не изменяет прошлые транзакции. Если тебе нужно "отменить" платёж, добавляется новая запись — "возврат". Прошлые записи неизменны. Это делает систему надёжной: аудиторы могут проверить полную историю, баланс — это просто сумма всех записей, ошибки не могут "задним числом" испортить данные.

Иммутабельный state работает так же: вместо изменения объекта — создаём новый, старый остаётся нетронутым.

```
Мутабельный подход (опасный):      Иммутабельный подход:
                                   
const user = { name: 'Alice' };    const user = { name: 'Alice' };
user.name = 'Bob'; // мутация      const updatedUser = { ...user, name: 'Bob' };
                                   // user не изменился — новый объект
// React не заметит изменение!     // React видит новую ссылку → ре-рендер
```

---

### Почему React требует иммутабельности

```
React сравнивает state через Object.is():
                                   
Object.is(prevState, nextState) === false → нужен ре-рендер
                                         → нужен ре-рендер

Мутация объекта:                   Иммутабельное обновление:
                                   
const arr = [1, 2, 3];             const arr = [1, 2, 3];
arr.push(4);                       const newArr = [...arr, 4];
// arr === arr (одна ссылка)       // newArr !== arr (новая ссылка)
// Object.is → true                // Object.is → false
// React думает: ничего не         // React: "изменилось" → ре-рендер
//   изменилось → нет ре-рендера
```

---

### Structural Sharing — иммутабельность без полного копирования

Наивное предположение: иммутабельность = `JSON.parse(JSON.stringify(state))` при каждом обновлении. Это O(n) на всё дерево состояния. Structural sharing умнее:

```
Состояние (дерево объектов):
                                   
       root                              root (новый)
      /    \                            /    \
   users   settings               users(новый) settings(тот же)
   /  \       |                    /  \
 alice bob  theme               alice'  bob
                                (новый)(тот же)

При обновлении alice.name:
- Создаётся новая alice
- Создаётся новый users (ссылается на новую alice + старого bob)
- Создаётся новый root (ссылается на новый users + старый settings)
- settings и bob НЕ копируются — те же ссылки

Библиотеки типа Immer делают это автоматически.
```

---

### Иммутабельные операции с массивами

```typescript
// 🔗 Связь с темой 20 (Array API)
const users: User[] = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob',   active: false },
  { id: 3, name: 'Carol', active: true },
];

// ДОБАВИТЬ элемент в конец
const withDave = [...users, { id: 4, name: 'Dave', active: true }];

// ДОБАВИТЬ в начало
const withNew = [{ id: 0, name: 'Admin', active: true }, ...users];

// ДОБАВИТЬ В ПРОИЗВОЛЬНУЮ ПОЗИЦИЮ (после индекса 1)
const withInserted = [...users.slice(0, 2), { id: 5, name: 'Eve', active: true }, ...users.slice(2)];

// УДАЛИТЬ элемент по id
const withoutBob = users.filter(u => u.id !== 2);

// ОБНОВИТЬ элемент по id (иммутабельно)
const withUpdatedAlice = users.map(u =>
  u.id === 1 ? { ...u, name: 'Alice Smith' } : u
);

// ОБНОВИТЬ ПО ИНДЕКСУ — ES2023 Array.prototype.with()
const withUpdatedIndex = users.with(1, { ...users[1], active: true });

// ПЕРЕСТАВИТЬ МЕСТАМИ (swap)
const swapped = users.map((u, i) =>
  i === 0 ? users[1] : i === 1 ? users[0] : u
);

// СОРТИРОВАТЬ — ES2023 toSorted() (не мутирует)
const sorted = users.toSorted((a, b) => a.name.localeCompare(b.name));

// РАЗВЕРНУТЬ — ES2023 toReversed() (не мутирует)
const reversed = users.toReversed();

// Для сравнения — мутирующие методы (НЕ для иммутабельного state)
users.sort();    // ❌ мутирует users
users.reverse(); // ❌ мутирует users
users.splice(1, 1); // ❌ мутирует users
```

---

### Разница: иммутабельное обновление vs structuredClone + мутация

```typescript
const original = { user: { name: 'Alice', age: 30 }, settings: { theme: 'dark' } };

// Вариант A — Иммутабельное обновление (structural sharing)
const updated_A = {
  ...original,
  user: { ...original.user, name: 'Bob' }
  // settings — та же ссылка, не скопирован
};

// Вариант B — structuredClone + мутация (полная копия, потом мутация)
const updated_B = structuredClone(original);
updated_B.user.name = 'Bob'; // мутация клона

// Оба дают новый объект. Разница:
// A: original.settings === updated_A.settings → true (structural sharing)
// B: original.settings === updated_B.settings → false (полная копия)
// A: O(изменений), B: O(всего дерева)
// A: семантически иммутабельна — нет мутаций нигде
// B: технически другой объект, но в коде есть мутации — плохо для команды
```

---

## 2. Связь со стеком

### React useReducer с иммутабельными паттернами

```typescript
interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM';    payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QTY';  payload: { id: string; quantity: number } }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      const items = existing
        ? state.items.map(i => i.id === action.payload.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
          )
        : [...state.items, { ...action.payload, quantity: 1 }];

      // Каждый return — новый объект state
      return { ...state, items, total: items.reduce((s, i) => s + i.price * i.quantity, 0) };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload.id)
      };

    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        )
      };

    case 'CLEAR':
      return { items: [], total: 0 };
  }
}
```

---

### Immer.js — читаемые иммутабельные обновления

```typescript
import { produce } from 'immer';

// Без Immer — сложный spread для вложенных структур
const updatedState = {
  ...state,
  users: state.users.map(u =>
    u.id === userId
      ? {
          ...u,
          address: {
            ...u.address,
            city: newCity
          }
        }
      : u
  )
};

// С Immer — пишем как мутацию, получаем иммутабельность
const updatedState = produce(state, draft => {
  const user = draft.users.find(u => u.id === userId);
  if (user) {
    user.address.city = newCity; // выглядит как мутация, но draft — прокси
  }
});
// state не изменился, updatedState — новый объект с structural sharing

// В useReducer
const reducer = produce((draft: CartState, action: CartAction) => {
  switch (action.type) {
    case 'ADD_ITEM':
      draft.items.push(action.payload); // выглядит как push, на самом деле иммутабельно
      break;
    case 'REMOVE_ITEM':
      draft.items = draft.items.filter(i => i.id !== action.payload.id);
      break;
  }
});
```

---

## 3. Лучшие паттерны

### Паттерн 1: ES2023 иммутабельные методы массивов

❌ **Антипаттерн:**
```typescript
function sortUsers(users: User[]): User[] {
  return users.sort((a, b) => a.name.localeCompare(b.name)); // ❌ мутирует входной массив!
}

// В React — классическая ошибка:
const handleSort = () => {
  setState(prev => {
    prev.users.sort(...); // ❌ мутирует state напрямую
    return prev; // возвращаем тот же объект — React не видит изменений
  });
};
```

✅ **Правильно:**
```typescript
function sortUsers(users: User[]): User[] {
  return users.toSorted((a, b) => a.name.localeCompare(b.name)); // ✅ ES2023
}

// Полный набор ES2023 иммутабельных методов:
const arr = [3, 1, 4, 1, 5];

arr.toSorted()               // новый отсортированный массив (arr не изменён)
arr.toReversed()             // новый развёрнутый массив
arr.with(2, 99)              // новый массив с arr[2] = 99
arr.toSpliced(1, 2)          // новый массив без элементов [1..2]
arr.toSpliced(1, 0, 10, 20)  // новый массив с вставленными элементами
```

**Объяснение:** `sort()`, `reverse()`, `splice()` мутируют массив. Их ES2023-аналоги `toSorted()`, `toReversed()`, `toSpliced()`, `with()` возвращают новый массив. В React всегда используй иммутабельные варианты в setState/reducer.

---

### Паттерн 2: Глубокое иммутабельное обновление

❌ **Антипаттерн:**
```typescript
// Ручной spread для глубокой вложенности — ошибкоопасно
const updated = {
  ...state,
  level1: {
    ...state.level1,
    level2: {
      ...state.level1.level2,
      value: newValue // нужно знать полный путь вручную
    }
  }
};
```

✅ **Правильно:**
```typescript
// Утилита для иммутабельного обновления по пути
function update<T extends object>(
  obj: T,
  path: string,
  value: unknown
): T {
  const keys = path.split('.');
  
  if (keys.length === 1) {
    return { ...obj, [path]: value };
  }

  const [first, ...rest] = keys;
  return {
    ...obj,
    [first]: update(
      (obj as Record<string, unknown>)[first] as object ?? {},
      rest.join('.'),
      value
    )
  };
}

// Использование
const state = { user: { address: { city: 'Moscow', zip: '101000' } } };
const updated = update(state, 'user.address.city', 'Kazan');
// state.user.address.city = 'Moscow' — нетронут
// updated.user.address.city = 'Kazan'
// updated.user.address === state.user.address? Нет, новый объект с zip сохранён
```

**Объяснение:** Рекурсивный `update` создаёт новые объекты только по пути изменения. Для production-кода используй Immer — он делает это через Proxy с оптимизациями.

---

### Паттерн 3: Immer для сложных вложенных обновлений

❌ **Антипаттерн:**
```typescript
// Сложный spread при нескольких одновременных обновлениях
const newState = {
  ...state,
  users: state.users.map(u =>
    u.id === id
      ? { ...u, active: true, lastLogin: new Date(), metadata: { ...u.metadata, loginCount: (u.metadata?.loginCount ?? 0) + 1 } }
      : u
  ),
  lastActivity: new Date(),
  stats: { ...state.stats, activeUsers: state.stats.activeUsers + 1 }
};
// Три уровня вложенности — легко ошибиться
```

✅ **Правильно:**
```typescript
import { produce } from 'immer';

const newState = produce(state, draft => {
  const user = draft.users.find(u => u.id === id);
  if (user) {
    user.active = true;
    user.lastLogin = new Date();
    user.metadata ??= {};
    user.metadata.loginCount = (user.metadata.loginCount ?? 0) + 1;
  }
  draft.lastActivity = new Date();
  draft.stats.activeUsers++;
});
// Читаемо, безопасно, structural sharing под капотом
```

**Объяснение:** Immer использует Proxy: все "мутации" в `draft` перехватываются и превращаются в иммутабельные операции. Redux Toolkit использует Immer в `createSlice` — поэтому там можно писать `state.count++` в reducers.

---

## 4. Вопросы интервью

**Q1: Почему React требует иммутабельности state?**

React сравнивает предыдущее и новое состояние через `Object.is` — это сравнение по ссылке для объектов. Если мутировать существующий объект, ссылка не меняется, `Object.is` вернёт `true`, и React решит, что ничего не изменилось — ре-рендера не будет. Иммутабельное обновление создаёт новый объект с новой ссылкой, `Object.is` вернёт `false`, React запланирует ре-рендер. Это также делает возможным `React.memo`, `useMemo`, `useCallback` — все они основаны на сравнении ссылок.

**Q2: Что такое structural sharing?**

Structural sharing — это оптимизация иммутабельных обновлений: при создании нового состояния неизменённые части дерева не копируются, а переиспользуются (те же ссылки). Если обновляем `state.user.name`, то `state.settings` в новом объекте будет той же ссылкой, что и в старом. Это делает иммутабельность эффективной по памяти и быстрой: создаётся только цепочка новых объектов по пути изменения. Immer реализует structural sharing автоматически через Proxy.

**Q3: Как иммутабельно обновить элемент массива по индексу?**

Есть два способа. Через `map`: `arr.map((item, i) => i === index ? newItem : item)` — создаёт новый массив, заменяя элемент на нужной позиции. Через ES2023 `with`: `arr.with(index, newItem)` — специально для этого случая, короче и выразительнее. Нельзя использовать `arr[index] = newItem` — это мутация. В TypeScript `with` типизирован правильно: возвращает `T[]`, не мутирует исходный массив.

**Q4: Чем Immer.js помогает?**

Immer позволяет писать иммутабельные обновления в мутабельном стиле через `produce(state, draft => { draft.x = 1 })`. Внутри Proxy перехватывает все записи в `draft` и строит дерево изменений, применяя structural sharing автоматически. Результат — новый объект state, исходный нетронут. Это особенно ценно для глубоко вложенных структур, где spread-цепочки становятся нечитаемыми. Redux Toolkit встраивает Immer в `createSlice`, поэтому там мутации в reducers безопасны.

**Q5: Почему `structuredClone` + мутация — не иммутабельность?**

Технически вы получаете новый объект, который не равен исходному. Но семантически — в коде есть мутации (`clone.x = newValue`). Проблемы: O(n) по размеру дерева (полная копия), нет structural sharing (два больших объекта вместо одного с общими частями), команда видит мутации в коде и не знает, что клон "безопасен". Иммутабельный подход — это не просто "другой объект", это принцип: в коде нет мутаций нигде. `structuredClone` полезен для других задач (глубокое копирование для изоляции), но не как замена иммутабельности.

**Q6: Как `Object.is` используется в React?**

`Object.is` — это более точная версия `===`, которая правильно обрабатывает `-0 !== +0` и `NaN === NaN`. React использует его в: `useState` — сравнивает новое значение с текущим, если `Object.is(prev, next) === true`, ре-рендер не планируется; `React.memo` — сравнивает props; `useMemo`/`useCallback` — сравнивает зависимости в массиве. Для объектов и массивов `Object.is` — сравнение ссылок, поэтому мутация не триггерит обновление.

**Q7: Иммутабельность и производительность: есть ли цена?**

Да, небольшая: создание новых объектов = нагрузка на GC (Garbage Collector). Но практически это незначимо для типичных UI-приложений. Преимущества компенсируют: быстрые сравнения (`===` вместо глубокого сравнения), structural sharing минимизирует создание объектов, возможность мемоизации через `React.memo`, предсказуемость и отлаживаемость. Цена становится заметной только при огромных структурах данных (тысячи элементов), где нужен `Immer` или специализированные immutable-структуры (Immutable.js).

**Q8: Разница между глубоким и поверхностным клонированием в контексте иммутабельности?**

Поверхностное клонирование (`{...obj}`, `[...arr]`) копирует только первый уровень — вложенные объекты остаются теми же ссылками. Для иммутабельности поверхностного клона достаточно, если изменение касается только первого уровня. Если нужно изменить вложенное поле — нужно клонировать каждый уровень по пути: `{...obj, nested: {...obj.nested, field: newValue}}`. Глубокое клонирование (`structuredClone`) копирует всё — избыточно и дорого. Правильный подход: клонировать только путь изменения (structural sharing).

**Q9: Какие ES2023 методы помогают с иммутабельностью?**

Четыре новых метода массивов: `toSorted(compareFn?)` — иммутабельная версия `sort()`, `toReversed()` — иммутабельная версия `reverse()`, `toSpliced(start, deleteCount, ...items)` — иммутабельная версия `splice()`, `with(index, value)` — иммутабельная замена элемента по индексу. Все четыре возвращают новый массив, не мутируют исходный. Поддерживаются во всех современных браузерах (2023+) и Node.js 20+. Для TypeScript нужен `"lib": ["ES2023"]` в `tsconfig.json`.

---

## 5. Практическое задание

Реализовать два инструмента:

1. **`update<T>(obj, path, value)`** — функция для глубокого иммутабельного обновления по строковому пути (`'user.address.city'`). Должна работать с произвольной вложенностью. TypeScript типизация.

2. **Мини-`useReducer`** — на чистом TypeScript (без React), демонстрирующий иммутабельные обновления через функцию-reducer. Должен показать: что при каждом dispatch старый state не мутируется, создаётся новый объект, предыдущий state остаётся неизменным (можно проверить ссылками).

---

## 6. Решение с инсайтом

```typescript
// === update: глубокое иммутабельное обновление ===

type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

function update<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');

  // Базовый случай: один ключ — создаём новый объект с обновлённым полем
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }

  const [first, ...rest] = keys;
  const nested = (obj as Record<string, unknown>)[first];

  return {
    ...obj,
    [first]: update(
      // Если вложенного объекта нет — создаём пустой (для новых путей)
      (typeof nested === 'object' && nested !== null ? nested : {}) as object,
      rest.join('.'),
      value
    )
  };
}

// === Мини-useReducer без React ===

type Reducer<S, A> = (state: S, action: A) => S;
type Dispatch<A> = (action: A) => void;
type Listener = () => void;

function createStore<S, A>(
  reducer: Reducer<S, A>,
  initialState: S
): { getState: () => S; dispatch: Dispatch<A>; subscribe: (l: Listener) => () => void } {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,

    dispatch: (action: A) => {
      const prevState = state;
      state = reducer(state, action); // reducer возвращает новый объект

      // Проверяем, что reducer не вернул тот же объект (иммутабельность)
      if (state !== prevState) {
        listeners.forEach(l => l());
      }
    },

    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

// === Демонстрация ===

interface AppState {
  user: { name: string; address: { city: string; zip: string } };
  theme: 'light' | 'dark';
}

type AppAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_CITY'; payload: string }
  | { type: 'TOGGLE_THEME' };

const initialState: AppState = {
  user: { name: 'Alice', address: { city: 'Moscow', zip: '101000' } },
  theme: 'light'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_NAME':
      return update(state, 'user.name', action.payload) as AppState;
    case 'SET_CITY':
      return update(state, 'user.address.city', action.payload) as AppState;
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
  }
}

const store = createStore(appReducer, initialState);

const state0 = store.getState();
console.log('Initial:', state0.user.name); // Alice

store.dispatch({ type: 'SET_NAME', payload: 'Bob' });
const state1 = store.getState();

console.log('After SET_NAME:');
console.log('  new name:', state1.user.name); // Bob
console.log('  old name (нетронут):', state0.user.name); // Alice
console.log('  same reference?', state0 === state1); // false — новый объект

// Structural sharing: непоменявшиеся части — те же ссылки
console.log('  same address?', state0.user.address === state1.user.address); // false (user.name изменился, пересоздался user)

store.dispatch({ type: 'SET_CITY', payload: 'Kazan' });
const state2 = store.getState();
console.log('After SET_CITY:', state2.user.address.city); // Kazan
console.log('  old city (нетронут):', state1.user.address.city); // Moscow
```

**Ключевой инсайт:** Иммутабельность — это не про производительность и не про "правила". Это про **предсказуемость**: когда у тебя есть ссылка на старое состояние, ты уверен, что оно не изменится. Это основа Time Travel Debugging в Redux DevTools, React StrictMode двойного рендера для обнаружения побочных эффектов, и эффективной мемоизации. `Object.is` — это просто механизм детекции, а иммутабельность — условие его корректной работы.

---

---

# Тема 28 — SOLID / DRY / KISS

← Предыдущая тема: [27 — Иммутабельность]
→ Следующая тема: [29 — Компоненты и JSX](topic_29_components_and_jsx.md)

---

## 1. Теория с аналогиями

### SOLID — не правила, а инструменты

SOLID — это не религия и не список запретов. Это набор эвристик, которые решают конкретные проблемы в коде, который нужно менять и сопровождать. Junior знает принципы наизусть. Middle понимает, когда и почему их применять.

---

### S — Single Responsibility Principle (Принцип единственной ответственности)

**"Класс/функция/компонент должны иметь только одну причину для изменения"**

Аналогия: швейцарский нож удобен в походе, но в ресторане шеф-повар не будет им готовить. У каждого инструмента — своя специализация.

```tsx
// ❌ Нарушение SRP: один компонент делает всё
function UserProfile({ userId }: { userId: string }) {
  // Логика загрузки данных — причина 1 для изменения
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);

  // Логика форматирования — причина 2
  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ru-RU')
    : '';

  // Логика валидации — причина 3
  const isValidAge = user ? user.age >= 18 : false;

  // UI — причина 4
  return <div>{user?.name} {formattedDate} {isValidAge ? '✓' : '✗'}</div>;
}

// ✅ SRP: каждый элемент — одна ответственность
// 🔗 Связь с темой 12 (React хуки)
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  return { user, loading };
}

function formatUserDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU');
}

function isAdult(age: number): boolean {
  return age >= 18;
}

function UserProfileView({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId); // хук — только данные
  if (loading) return <Spinner />;
  if (!user) return null;

  return (
    <div>
      {user.name}
      {formatUserDate(user.createdAt)}
      {isAdult(user.age) ? '✓' : '✗'}
    </div>
  );
}
```

---

### O — Open/Closed Principle (Принцип открытости/закрытости)

**"Открыты для расширения, закрыты для модификации"**

```tsx
// ❌ Нарушение OCP: добавить новый variant = менять компонент
function Button({ type }: { type: string }) {
  let className = 'btn';
  if (type === 'primary')   className += ' btn-primary';
  if (type === 'danger')    className += ' btn-danger';
  if (type === 'ghost')     className += ' btn-ghost';
  // Добавить 'link' variant = открыть компонент и добавить if
  return <button className={className}>Клик</button>;
}

// ✅ OCP: расширяем через конфигурацию, не изменяем компонент
const variantClasses = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'bg-transparent border border-gray-300 hover:bg-gray-50',
  // Добавить новый variant = одна строка здесь, без изменения компонента
  link:      'bg-transparent text-blue-600 underline hover:text-blue-800',
} as const;

const sizeClasses = {
  sm:  'px-2 py-1 text-sm',
  md:  'px-4 py-2 text-base',
  lg:  'px-6 py-3 text-lg',
} as const;

type ButtonVariant = keyof typeof variantClasses;
type ButtonSize    = keyof typeof sizeClasses;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
}

function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={[variantClasses[variant], sizeClasses[size], className].join(' ')}
      {...rest}
    />
  );
}
```

---

### L — Liskov Substitution Principle (Принцип подстановки Лисков)

**"Подтипы должны быть заменяемы базовым типом без нарушения поведения"**

```typescript
// ❌ Нарушение LSP: Square "ломает" поведение Rectangle
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number)  { this.width  = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number) {
    this.width  = w;
    this.height = w; // неожиданное поведение — нарушение LSP
  }
  setHeight(h: number) {
    this.width  = h;
    this.height = h;
  }
}

// Функция, написанная для Rectangle, ломается на Square
function stretchWidth(rect: Rectangle) {
  rect.setWidth(10);
  rect.setHeight(5);
  console.log(rect.area()); // для Rectangle: 50, для Square: 25 (!!)
}

// ✅ LSP в TypeScript: интерфейсы описывают контракт, подтипы его не нарушают
interface Shape {
  area(): number;
  perimeter(): number;
}

class Rect implements Shape {
  constructor(private w: number, private h: number) {}
  area()      { return this.w * this.h; }
  perimeter() { return 2 * (this.w + this.h); }
}

class Circ implements Shape {
  constructor(private r: number) {}
  area()      { return Math.PI * this.r ** 2; }
  perimeter() { return 2 * Math.PI * this.r; }
}

// Работает с любым Shape — LSP соблюдён
function totalArea(shapes: Shape[]): number {
  return shapes.reduce((sum, s) => sum + s.area(), 0);
}
```

---

### I — Interface Segregation Principle (Принцип разделения интерфейсов)

**"Клиенты не должны зависеть от методов, которые они не используют"**

```typescript
// ❌ Нарушение ISP: один большой интерфейс
interface UserService {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  sendEmail(userId: string, template: string): Promise<void>;
  generateReport(userId: string): Promise<Buffer>;
  exportToCsv(userIds: string[]): Promise<string>;
}
// Компонент, которому нужен только getUser, зависит от deleteUser и exportToCsv

// ✅ ISP: разбиваем на узкие интерфейсы
interface UserReader {
  getUser(id: string): Promise<User>;
  listUsers(filter?: UserFilter): Promise<User[]>;
}

interface UserWriter {
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

interface UserNotifier {
  sendEmail(userId: string, template: string): Promise<void>;
}

interface UserExporter {
  generateReport(userId: string): Promise<Buffer>;
  exportToCsv(userIds: string[]): Promise<string>;
}

// Компонент зависит только от нужного
function UserCard({ userId, service }: { userId: string; service: UserReader }) {
  // service знает только getUser/listUsers — не больше
}
```

---

### D — Dependency Inversion Principle (Принцип инверсии зависимостей)

**"Модули верхнего уровня не должны зависеть от модулей нижнего уровня. Оба должны зависеть от абстракций"**

```tsx
// ❌ Нарушение DIP: компонент напрямую зависит от конкретной реализации
import { fetch } from './concreteHttpClient'; // жёсткая связь

function UserCard({ userId }: { userId: string }) {
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(/* ... */);
    // Захотели сменить fetch на axios? — редактируем компонент
    // Хотим протестировать без сети? — невозможно
  }, [userId]);
}

// ✅ DIP: зависим от абстракции (интерфейса), не от реализации
interface UserRepository {
  getById(id: string): Promise<User>;
}

// Компонент принимает зависимость снаружи — Dependency Injection
function UserCard({ userId, repo }: { userId: string; repo: UserRepository }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    repo.getById(userId).then(setUser);
  }, [userId, repo]);
  return <div>{user?.name}</div>;
}

// Реальная реализация
const httpUserRepo: UserRepository = {
  getById: id => fetch(`/api/users/${id}`).then(r => r.json())
};

// Mock для тестов
const mockUserRepo: UserRepository = {
  getById: async (id) => ({ id, name: 'Test User', age: 25 } as User)
};

// Продакшн
<UserCard userId="1" repo={httpUserRepo} />

// Тест — без сетевых запросов
<UserCard userId="1" repo={mockUserRepo} />
```

---

### DRY — Don't Repeat Yourself

**Правило трёх**: дублирование допустимо два раза, на третий — абстрагируй. Но важно предостережение:

```typescript
// ❌ Преждевременная абстракция (Wrong DRY / AHA — Avoid Hasty Abstractions)
// Функции выглядят похоже, но делают разные вещи
function processUserOrder(user: User) { /* специфика заказов */ }
function processAdminOrder(admin: Admin) { /* специфика админ-операций */ }

// Кто-то сделал "DRY":
function processOrder(entity: User | Admin) {
  if ('role' in entity && entity.role === 'admin') {
    // ... ветка admin
  } else {
    // ... ветка user
  }
}
// Теперь абстракция знает про детали обоих → хуже, чем было

// ✅ Когда DRY оправдан: реально одинаковая логика
// ❌ Когда DRY вреден: случайное совпадение + разная ответственность
```

---

### KISS — Keep It Simple, Stupid

```typescript
// ❌ Over-engineered (нарушение KISS)
// Задача: найти максимальное значение в массиве
class MaxValueStrategy {
  execute(arr: number[]): number {
    return arr.reduce(
      (acc, val, idx) => idx === 0 ? val : Math.max(acc, val),
      -Infinity
    );
  }
}

const finder = new MaxValueFinder(new MaxValueStrategy());
const max = finder.find([1, 2, 3]);

// ✅ KISS: используй встроенные возможности языка
const max = Math.max(...[1, 2, 3]); // одна строка
```

---

### AHA — Avoid Hasty Abstractions

Сформулировано Kent C. Dodds как реакция на Wrong DRY:

> "Дублирование дешевле неправильной абстракции"

```typescript
// Два компонента выглядят похоже, но имеют разную ответственность
// UserCard — для публичного профиля
function UserCard({ user }: { user: PublicUser }) {
  return <div>{user.name}</div>;
}

// AdminUserCard — для панели администратора с дополнительными полями
function AdminUserCard({ user }: { user: AdminUser }) {
  return <div>{user.name} {user.email} {user.role}</div>;
}

// ❌ Поспешная абстракция: делаем "общий" компонент
function GenericUserCard({ user, showEmail = false, showRole = false, ... }) {
  // Пропсов становится всё больше. Компонент усложняется.
  // Через полгода: 15 пропсов, условия во всём коде
}

// ✅ AHA: оставляем дублирование пока не видим ≥3 реальных повторений
// Если UserCard и AdminUserCard отличаются — пусть отличаются.
// Разделяй только когда абстракция очевидна и стабильна.
```

---

## 2. Связь со стеком

### Реальный рефакторинг: ДО и ПОСЛЕ

**ДО рефакторинга** — нарушает SRP, DIP, OCP, сложно тестировать:

```tsx
// ❌ Всё в одном компоненте — 60+ строк, 4 причины для изменения
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  // Причина 1: логика загрузки
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((u: User) => {
        setUser(u);
        setName(u.name);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // Причина 2: логика сохранения
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const updated = await res.json();
      setUser(updated);
      setEditing(false);
    } catch (e) {
      setError('Ошибка сохранения');
    }
  };

  // Причина 3: отображение ошибки
  if (error) return <div className="error">{error}</div>;
  if (loading) return <div>Загрузка...</div>;
  if (!user) return null;

  // Причина 4: два режима отображения
  return (
    <div>
      {editing ? (
        <>
          <input value={name} onChange={e => setName(e.target.value)} />
          <button onClick={handleSave}>Сохранить</button>
          <button onClick={() => setEditing(false)}>Отмена</button>
        </>
      ) : (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <button onClick={() => setEditing(true)}>Редактировать</button>
        </>
      )}
    </div>
  );
}
```

**ПОСЛЕ рефакторинга** — SRP, DIP, OCP применены:

```tsx
// === 1. Интерфейс репозитория (DIP — зависим от абстракции) ===
interface IUserRepository {
  getById(id: string): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// === 2. Хук — только логика загрузки (SRP) ===
function useUser(userId: string, repo: IUserRepository) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    repo.getById(userId)
      .then(setUser)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [userId, repo]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const updated = await repo.update(userId, data);
    setUser(updated);
    return updated;
  }, [userId, repo]);

  return { user, loading, error, updateUser };
}

// === 3. Компонент просмотра — только UI (SRP) ===
interface UserViewProps {
  user: User;
  onEdit: () => void;
}

function UserView({ user, onEdit }: UserViewProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button variant="secondary" onClick={onEdit}>Редактировать</Button>
    </div>
  );
}

// === 4. Компонент редактирования — только форма (SRP) ===
interface UserEditProps {
  user: User;
  onSave: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

function UserEdit({ user, onSave, onCancel }: UserEditProps) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </Button>
      <Button variant="ghost" onClick={onCancel}>Отмена</Button>
    </form>
  );
}

// === 5. Контейнер — только оркестрация (SRP + DIP) ===
interface UserProfileProps {
  userId: string;
  repo: IUserRepository; // DIP: получаем зависимость снаружи
}

function UserProfile({ userId, repo }: UserProfileProps) {
  const { user, loading, error, updateUser } = useUser(userId, repo);
  const [editing, setEditing] = useState(false);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!user)   return null;

  const handleSave = async (data: Partial<User>) => {
    await updateUser(data);
    setEditing(false);
  };

  return editing
    ? <UserEdit user={user} onSave={handleSave} onCancel={() => setEditing(false)} />
    : <UserView user={user} onEdit={() => setEditing(true)} />;
}

// === 6. Конкретная реализация репозитория ===
const httpUserRepository: IUserRepository = {
  getById: id => fetch(`/api/users/${id}`).then(r => r.json()),
  update:  (id, data) => fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
};

// === 7. Использование в App ===
function App() {
  return <UserProfile userId="123" repo={httpUserRepository} />;
}

// === 8. В тестах — mock репозиторий (DIP даёт testability) ===
const mockRepo: IUserRepository = {
  getById: async () => ({ id: '123', name: 'Alice', email: 'alice@test.com' } as User),
  update:  async (_, data) => ({ id: '123', name: 'Alice', email: 'alice@test.com', ...data } as User),
};
// render(<UserProfile userId="123" repo={mockRepo} />) — никаких fetch-mock
```

---

## 3. Лучшие паттерны

### Паттерн 1: SRP через разделение хука и компонента

❌ **Антипаттерн:**
```tsx
// Компонент — и хранит логику, и рендерит
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);
  
  const sorted = [...products].sort((a, b) =>
    sort === 'asc' ? a.price - b.price : b.price - a.price
  );
  
  return (
    <div>
      <button onClick={() => setSort(s => s === 'asc' ? 'desc' : 'asc')}>
        Сортировка: {sort}
      </button>
      {sorted.map(p => <div key={p.id}>{p.name}: {p.price}</div>)}
    </div>
  );
}
```

✅ **Правильно:**
```tsx
// Хук — только данные и логика
function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);
  
  const sorted = products.toSorted((a, b) =>
    sort === 'asc' ? a.price - b.price : b.price - a.price
  );
  
  return { products: sorted, sort, toggleSort: () => setSort(s => s === 'asc' ? 'desc' : 'asc') };
}

// Компонент — только рендер
function ProductList() {
  const { products, sort, toggleSort } = useProducts();
  
  return (
    <div>
      <button onClick={toggleSort}>Сортировка: {sort}</button>
      {products.map(p => <div key={p.id}>{p.name}: {p.price}</div>)}
    </div>
  );
}
```

**Объяснение:** Разделение хука и компонента — самый частый способ применить SRP в React. Хук меняется при изменении бизнес-логики. Компонент меняется при изменении дизайна. Два независимых мотива для изменения = два файла.

---

### Паттерн 2: DIP через пропсы вместо прямого импорта

❌ **Антипаттерн:**
```typescript
// Жёсткая зависимость от конкретного логгера
import { sentryLogger } from '../services/sentryLogger';

async function createOrder(data: OrderData) {
  try {
    const order = await db.order.create(data);
    sentryLogger.info('Order created', { orderId: order.id }); // жёсткая связь
    return order;
  } catch (e) {
    sentryLogger.error('Order creation failed', e); // нельзя поменять
    throw e;
  }
}
```

✅ **Правильно:**
```typescript
// Зависим от абстракции (интерфейса)
interface Logger {
  info(message: string, context?: object): void;
  error(message: string, error?: unknown): void;
}

// Функция принимает logger как параметр — DIP
async function createOrder(data: OrderData, logger: Logger): Promise<Order> {
  try {
    const order = await db.order.create(data);
    logger.info('Order created', { orderId: order.id });
    return order;
  } catch (e) {
    logger.error('Order creation failed', e);
    throw e;
  }
}

// Реальный Sentry logger
const sentryLogger: Logger = { info: console.log, error: console.error };

// Тихий mock для тестов
const noopLogger: Logger = { info: () => {}, error: () => {} };

// Легко переключить — не трогая createOrder
```

**Объяснение:** DIP без IoC-контейнера — это просто передача зависимостей через параметры функции или пропсы компонента. В React нет необходимости в специальных фреймворках DI — пропсы и Context уже являются Dependency Injection.

---

### Паттерн 3: OCP через composition вместо условий

❌ **Антипаттерн:**
```tsx
// Добавить новый тип = изменить существующий компонент
function Alert({ type, message }: { type: string; message: string }) {
  if (type === 'success') return <div className="bg-green-100">{message}</div>;
  if (type === 'error')   return <div className="bg-red-100">{message}</div>;
  if (type === 'warning') return <div className="bg-yellow-100">{message}</div>;
  return <div>{message}</div>;
}
```

✅ **Правильно:**
```tsx
const alertConfig = {
  success: { bg: 'bg-green-50', border: 'border-green-400', icon: '✓' },
  error:   { bg: 'bg-red-50',   border: 'border-red-400',   icon: '✗' },
  warning: { bg: 'bg-yellow-50',border: 'border-yellow-400',icon: '⚠' },
  info:    { bg: 'bg-blue-50',  border: 'border-blue-400',  icon: 'ℹ' },
} as const;

type AlertType = keyof typeof alertConfig;

function Alert({ type, message, children }: {
  type: AlertType;
  message?: string;
  children?: React.ReactNode;
}) {
  const config = alertConfig[type];
  return (
    <div className={`${config.bg} ${config.border} border-l-4 p-4`}>
      <span>{config.icon}</span>
      {message ?? children}
    </div>
  );
}

// Расширяем без изменения Alert: добавляем в alertConfig
// alertConfig['critical'] = { bg: 'bg-purple-50', border: 'border-purple-400', icon: '💀' }
```

**Объяснение:** Конфигурационный объект + `as const` + `keyof typeof` — паттерн OCP в React. Новый variant — строка в конфиге, нулевой риск сломать существующие. 🔗 Связь с темой 24 (TypeScript): `keyof typeof` даёт автодополнение и проверку на этапе компиляции.

---

## 4. Вопросы интервью

**Q1: Что такое SRP и как применить в React-компонентах?**

Single Responsibility Principle — у компонента или функции должна быть только одна причина для изменения. В React это означает разделение логики и отображения: хук отвечает за данные, состояние, side effects; компонент — только за рендер. Практически: если компонент содержит `useEffect` с fetch и JSX — это два поводы для изменения (логика изменилась / дизайн изменился). Решение: вынести fetch в кастомный хук. Тест: "Сколько разных причин изменить этот файл?"

**Q2: Что такое OCP на практике в React/TypeScript?**

Open/Closed Principle — открыты для расширения, закрыты для модификации. В React: вместо добавления if/else при каждом новом варианте поведения — используем конфигурационный объект или composition. Практический приём: `variant` и `size` пропсы в UI-компонентах с объектом маппинга. Добавить новый `variant` = строка в конфиге, не трогаем компонент. Нарушение OCP: каждый новый requirement = открываем старый компонент и добавляем условие.

**Q3: Что такое DIP и как применить без IoC-контейнера?**

Dependency Inversion Principle — модули верхнего уровня не должны зависеть от конкретных реализаций. В React/TypeScript это достигается через: передачу зависимостей через пропсы (функции, репозитории, сервисы), использование Context для глобальных зависимостей, TypeScript интерфейсы как "абстракции". IoC-контейнеры (как в Angular) в React не нужны — пропсы и Context уже реализуют DI. Выгода: тестируемость (mock зависимость), гибкость (поменять реализацию без изменения потребителя).

**Q4: Что такое DRY и когда дублирование лучше?**

Don't Repeat Yourself — не повторяй бизнес-логику. Правило трёх: одно повторение нормально, два — следи, три — абстрагируй. Дублирование лучше абстракции когда: код похож синтаксически, но имеет разную ответственность; абстракция требует сложных пропсов с флагами; компоненты развиваются в разных направлениях. AHA (Avoid Hasty Abstractions): поспешная абстракция создаёт связность там, где её не должно быть. Дублирование изолирует изменения. Неправильная абстракция распространяет их.

**Q5: Что такое KISS и как определить "слишком сложно"?**

Keep It Simple — решение должно быть не проще требований, но и не сложнее. Признаки нарушения KISS: нужно больше 2 минут объяснить, что делает функция; ради одной фичи введён целый паттерн; читающий код коллега спрашивает "а зачем это здесь?". Проверка: может ли джуниор понять этот код без объяснений? Если нет — скорее всего, он сложнее чем нужно. Сложность оправдана реальными требованиями, не желанием показать знание паттернов.

**Q6: Что такое Wrong DRY / AHA?**

Wrong DRY — это создание абстракции только потому, что код выглядит похоже, без анализа ответственностей. AHA (Avoid Hasty Abstractions, Kent C. Dodds) — рекомендация: дожди до третьего повторения и убедись, что повторение реального бизнес-правила, а не случайного совпадения синтаксиса. Симптомы Wrong DRY: абстракция с boolean флагами (`showEmail`, `isAdmin`, `isMobile`), функция, в которой половина — это `if (context === 'admin')`. Решение: разабстрагировать (inline) и посмотреть, действительно ли есть общая логика.

**Q7: Как отличить over-engineering от правильной абстракции?**

Правильная абстракция: решает реальную проблему, которая уже есть (не предполагаемую), упрощает вызывающий код, имеет стабильный интерфейс, понятна без объяснений. Over-engineering: создаёт слои "на будущее", усложняет вызывающий код, интерфейс постоянно меняется по мере роста требований, требует README для понимания. Правило: пиши прямолинейный код → дожди когда появится третье повторение → извлеки абстракцию. Не проектируй "на вырост" — requirements меняются непредсказуемо.

**Q8: Что такое LSP и как его нарушение проявляется в TypeScript?**

Liskov Substitution Principle — подтип должен быть заменяем базовым типом без неожиданного поведения. В TypeScript нарушение LSP часто проявляется как: `throw new Error('not implemented')` в методе подкласса, метод принимает параметры более узкого типа, чем объявлен в интерфейсе, результат метода — более широкий тип. TypeScript через `implements` помогает соблюдать LSP на уровне типов, но не гарантирует поведение. Тест: "Если заменить базовый тип на подтип в любом месте программы — поведение не должно измениться".

**Q9: Что такое ISP и пример плохого vs хорошего интерфейса?**

Interface Segregation Principle — клиенты не должны зависеть от методов, которые не используют. Плохой интерфейс: один большой `UserService` с методами `getUser`, `createUser`, `deleteUser`, `sendEmail`, `exportReport` — компонент, которому нужен только `getUser`, получает зависимость от `deleteUser`. Хороший: разбить на `UserReader`, `UserWriter`, `UserNotifier`, `UserExporter`. В TypeScript легко: каждый компонент/функция принимает в параметре только тот интерфейс, который реально использует. Большие интерфейсы затрудняют тестирование (нужно мокать много методов) и мешают пониманию.

---

## 5. Практическое задание

Провести рефакторинг компонента, применяя SOLID-принципы:

**Дано** — монолитный компонент `ProductCard`, который:
1. Загружает данные о продукте через fetch
2. Форматирует цену
3. Проверяет наличие скидки
4. Рендерит карточку с кнопкой "В корзину"
5. Обновляет корзину через прямой вызов `localStorage`

**Задача:**
- SRP: разделить на хук `useProduct` + компонент `ProductCardView`
- DIP: заменить прямую работу с localStorage на интерфейс `ICartService`
- OCP: добавить поддержку `variant: 'compact' | 'full'` без if/else в компоненте

Написать и финальное использование с real + mock реализациями.

---

## 6. Решение с инсайтом

```tsx
// === Интерфейсы (абстракции) ===

interface Product {
  id:       string;
  name:     string;
  price:    number;
  discount: number; // 0-1
  stock:    number;
}

interface IProductRepository {
  getById(id: string): Promise<Product>;
}

interface ICartService {
  addItem(productId: string, quantity: number): void;
  getItemCount(): number;
}

// === Утилиты — чистые функции (SRP) ===

function formatPrice(price: number, discount: number): string {
  const final = price * (1 - discount);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB'
  }).format(final);
}

function hasDiscount(discount: number): boolean {
  return discount > 0;
}

// === Хук — только логика (SRP) ===

function useProduct(productId: string, repo: IProductRepository) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    repo.getById(productId)
      .then(setProduct)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [productId, repo]);

  return { product, loading, error };
}

// === Конфигурация вариантов (OCP) ===

const variantConfig = {
  compact: {
    wrapper: 'flex items-center gap-2 p-2 border rounded',
    name:    'text-sm font-medium',
    price:   'text-sm text-gray-600',
    button:  'text-xs px-2 py-1',
  },
  full: {
    wrapper: 'flex flex-col gap-3 p-4 border rounded-xl shadow',
    name:    'text-lg font-semibold',
    price:   'text-xl font-bold text-green-600',
    button:  'w-full py-2 text-sm',
  },
} as const;

type ProductCardVariant = keyof typeof variantConfig;

// === Компонент — только отображение (SRP) ===

interface ProductCardViewProps {
  product:  Product;
  variant:  ProductCardVariant;
  onAddToCart: () => void;
}

function ProductCardView({ product, variant, onAddToCart }: ProductCardViewProps) {
  const cls = variantConfig[variant]; // OCP: no if/else

  return (
    <div className={cls.wrapper}>
      <h3 className={cls.name}>{product.name}</h3>
      
      <div className={cls.price}>
        {hasDiscount(product.discount) && (
          <span className="line-through text-gray-400 text-sm">
            {formatPrice(product.price, 0)}
          </span>
        )}
        <span>{formatPrice(product.price, product.discount)}</span>
        {hasDiscount(product.discount) && (
          <span className="bg-red-100 text-red-600 text-xs px-1 rounded">
            -{Math.round(product.discount * 100)}%
          </span>
        )}
      </div>

      <button
        className={`${cls.button} bg-blue-600 text-white rounded`}
        disabled={product.stock === 0}
        onClick={onAddToCart}
      >
        {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
      </button>
    </div>
  );
}

// === Контейнер — оркестрация (DIP) ===

interface ProductCardProps {
  productId: string;
  variant?:  ProductCardVariant;
  repo:      IProductRepository; // DIP: зависим от интерфейса
  cart:      ICartService;       // DIP: зависим от интерфейса
}

function ProductCard({ productId, variant = 'full', repo, cart }: ProductCardProps) {
  const { product, loading, error } = useProduct(productId, repo);

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded" />;
  if (error)   return <div className="text-red-500 text-sm">{error}</div>;
  if (!product) return null;

  return (
    <ProductCardView
      product={product}
      variant={variant}
      onAddToCart={() => cart.addItem(product.id, 1)}
    />
  );
}

// === Реальные реализации ===

const httpProductRepo: IProductRepository = {
  getById: id => fetch(`/api/products/${id}`).then(r => r.json()),
};

const localStorageCart: ICartService = {
  addItem: (productId, qty) => {
    const cart = JSON.parse(localStorage.getItem('cart') ?? '{}');
    cart[productId] = (cart[productId] ?? 0) + qty;
    localStorage.setItem('cart', JSON.stringify(cart));
  },
  getItemCount: () => {
    const cart = JSON.parse(localStorage.getItem('cart') ?? '{}');
    return Object.values(cart as Record<string, number>).reduce((s, n) => s + n, 0);
  }
};

// === Mock для тестов (DIP делает это тривиальным) ===

const mockProductRepo: IProductRepository = {
  getById: async (id) => ({
    id,
    name:     'Тестовый продукт',
    price:    1000,
    discount: 0.1,
    stock:    5,
  }),
};

const mockCart: ICartService = {
  addItem:      (id, qty) => console.log(`[MOCK] Добавлено: ${id} x${qty}`),
  getItemCount: ()        => 0,
};

// === Использование ===
function App() {
  return (
    <div>
      {/* Продакшн */}
      <ProductCard productId="prod-1" repo={httpProductRepo} cart={localStorageCart} />
      
      {/* Компактный вариант (OCP) */}
      <ProductCard productId="prod-2" variant="compact" repo={httpProductRepo} cart={localStorageCart} />

      {/* В тестах */}
      <ProductCard productId="test-1" repo={mockProductRepo} cart={mockCart} />
    </div>
  );
}
```

**Ключевой инсайт:** SOLID — это не про красоту, а про стоимость изменений. Каждый принцип снижает цену конкретного типа изменений: SRP снижает риск "сломать что-то несвязанное", OCP позволяет расширять без регрессий, DIP делает компоненты тестируемыми без реальной инфраструктуры. В реальном проекте ты применяешь SOLID не "по учебнику", а задавая один вопрос: "Как мне изменить X, не затронув Y?" — и выбираешь принцип, который делает это возможным.

---

→ Конец курса. Ты прошёл все 28 тем!

---

## Итог раздела 8

| Принцип | Главный вопрос | Инструмент |
|---------|---------------|------------|
| Обработка ошибок | Кто отвечает за каждый тип ошибки? | Custom Error · Result pattern |
| Observer | Как уведомить без жёсткой связи? | Subject/Observer · EventEmitter |
| Factory | Как создавать объекты без жёсткой связи? | Function factory · Strategy |
| Иммутабельность | Как изменить, не ломая предсказуемость? | Spread · toSorted · Immer |
| SRP | Одна причина для изменения? | Хук + компонент |
| OCP | Расширение без модификации? | Конфиг + variant |
| DIP | Зависим от интерфейса, не реализации? | Пропсы · Context |
| DRY/KISS | Реальное повторение или поспешность? | Правило трёх · AHA |

*Паттерны — это решения известных проблем. Знание паттернов без понимания проблем, которые они решают, бесполезно. Знание проблем без паттернов — болезненно. Оба вместе — это Middle.*
