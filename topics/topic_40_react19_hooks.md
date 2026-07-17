# Контент курса — Тема 40: React 19: use(), useActionState, useOptimistic

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 12 — Тема 40 (use, useActionState, useOptimistic)

---

# Тема 40 — React 19: use(), useActionState, useOptimistic

← Предыдущая тема: [39 — useId, useDebugValue, useSyncExternalStore](topic_39_useid_usedebugvalue_usesyncexternalstore.md)
→ Следующая тема: [41 — Кастомные хуки и композиция логики](topic_41_custom_hooks.md)

---

## 1. Теория с аналогиями

**Аналогия: три инструмента для работы с "ожиданием" — читать, отправлять, предугадывать**

React 19 ввёл три хука, каждый решающий свою часть общей проблемы — работы с асинхронностью в UI без ручного `useState`+`useEffect` бойлерплейта. `use()` — как открыть письмо, которое уже готово, а если не готово — подождать (аналог `await`, но внутри рендера). `useActionState` — как заполнить форму и следить за статусом отправки без ручной проводки состояний `loading`/`error`. `useOptimistic` — как сразу поверить в успех действия и показать результат, ещё не получив подтверждения от сервера, а при неудаче — тихо откатить.

### use() — чтение промисов и контекста прямо в рендере

```typescript
// До React 19: чтение промиса требовало useEffect + useState (🔗 Тема 33)
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { userPromise.then(setUser); }, [userPromise]);
  if (!user) return <Spinner />;
  return <div>{user.name}</div>;
}

// React 19: use() читает промис напрямую, приостанавливая рендер через Suspense (🔗 Тема 42)
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // компонент "подвешивается" до готовности промиса
  return <div>{user.name}</div>; // здесь user уже гарантированно готов
}

// Родитель оборачивает в Suspense — вместо ручного isLoading
<Suspense fallback={<Spinner />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
```

**Ключевое отличие `use()` от `await`: можно вызывать условно**

```typescript
// ❌ await в async-функции нельзя вызвать после условного return в обычных хуках —
// но use() — специальный хук, который МОЖНО вызывать условно (в отличие от других хуков!)
function Comment({ commentPromise, showAuthor }: Props) {
  if (!showAuthor) {
    return <p>Комментарий скрыт</p>; // ранний return ДО use() — разрешено именно для use()
  }
  const comment = use(commentPromise); // вызывается только если showAuthor === true
  return <p>{comment.author}: {comment.text}</p>;
}
```

Это единственный хук, официально разрешённый вызывать после условного `return`/внутри `if` — потому что `use()` не хранит состояние по индексу вызова (в отличие от `useState`/`useEffect`, 🔗 Тема 31), а напрямую читает переданный ресурс.

**`use()` для чтения Context — альтернатива `useContext`**

```typescript
function ThemedButton() {
  const theme = use(ThemeContext); // эквивалент useContext(ThemeContext), но может быть условным
  return <button className={theme}>Click</button>;
}
```

### useActionState — состояние формы и Server Actions без бойлерплейта

```typescript
// До React 19: ручное управление loading/error/data вокруг отправки формы
function ProfileForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      await updateProfile(formData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPending(false);
    }
  }
}

// React 19: useActionState инкапсулирует состояние действия
function ProfileForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState: { error: string | null }, formData: FormData) => {
      try {
        await updateProfile(formData);
        return { error: null };
      } catch (e) {
        return { error: (e as Error).message }; // возвращённое значение — новое state
      }
    },
    { error: null } // начальное состояние
  );

  return (
    <form action={formAction}> {/* action — напрямую в JSX, без onSubmit + preventDefault */}
      <input name="name" />
      <button disabled={isPending}>{isPending ? 'Сохранение...' : 'Сохранить'}</button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

**Схема: как `useActionState` похож на `useReducer` (🔗 Тема 32), но для асинхронных действий**

```
useReducer:        (state, action) => newState          — синхронно
useActionState:     (state, formData) => Promise<newState> — асинхронно,
                     + автоматический isPending, + интеграция с <form action>
```

### useOptimistic — мгновенный UI-отклик до подтверждения сервера

```typescript
// Проблема: без optimistic UI пользователь видит задержку между кликом и результатом
function TodoItem({ todo }: { todo: Todo }) {
  const [isCompleting, setIsCompleting] = useState(false);
  async function handleToggle() {
    setIsCompleting(true);
    await toggleTodoOnServer(todo.id); // пользователь ждёт round-trip к серверу
    setIsCompleting(false);
  }
}

// useOptimistic: UI обновляется МГНОВЕННО, откатывается автоматически при ошибке
function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticToggle] = useOptimistic(
    todos,
    (currentTodos, toggledId: string) =>
      currentTodos.map(t => t.id === toggledId ? { ...t, completed: !t.completed } : t)
  );

  async function handleToggle(id: string) {
    addOptimisticToggle(id); // немедленное визуальное обновление, ДО ответа сервера
    await toggleTodoOnServer(id); // если этот вызов упадёт — React откатит optimisticTodos
  }

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id} onClick={() => handleToggle(todo.id)}>
          {todo.completed ? '✅' : '⬜'} {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

```
Клик пользователя
      │
      ▼
addOptimisticToggle(id) → UI обновляется НЕМЕДЛЕННО (оптимистичное состояние)
      │
      ▼
toggleTodoOnServer(id) выполняется в фоне
      │
      ├─ успех → todos (реальный state) обновляется → optimisticTodos совпадает с ним
      │
      └─ ошибка → React автоматически откатывает optimisticTodos к последнему todos
```

---

## 2. Связь со стеком

**Next.js Server Actions — родная среда для `useActionState`**

```typescript
// app/actions.ts
'use server';
export async function updateProfileAction(prevState: unknown, formData: FormData) {
  const name = formData.get('name');
  await db.user.update({ data: { name } });
  return { success: true };
}

// Client Component
'use client';
import { updateProfileAction } from './actions';

function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateProfileAction, { success: false });
  return <form action={formAction}>{/* ... */}</form>;
}
```

**`use()` + Server Components — передача промиса от сервера к клиенту**

```typescript
// Server Component — не await'ит промис сразу, передаёт его как проп (стриминг, 🔗 Тема 42)
export default function Page() {
  const commentsPromise = fetchComments(); // промис, не await
  return (
    <Suspense fallback={<Spinner />}>
      <Comments commentsPromise={commentsPromise} /> {/* Client Component читает через use() */}
    </Suspense>
  );
}
```

**`useOptimistic` — типичный паттерн для лайков, чекбоксов, счётчиков в социальных приложениях**, где задержка сети даже в 100-200ms заметно ухудшает ощущение отзывчивости интерфейса.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: `use()` для промисов, переданных как пропсы, не для промисов, созданных в самом компоненте**

```typescript
// ❌ Плохо: новый промис на каждом рендере — use() будет "подвешивать" компонент бесконечно
function Bad({ id }: { id: string }) {
  const user = use(fetchUser(id)); // fetchUser(id) вызывается заново на каждом рендере!
}

// ✅ Хорошо: промис создаётся один раз выше по дереву (или через useMemo/кэширующую библиотеку)
function Good({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // стабильная ссылка на промис между рендерами
}
```

*Почему best practice:* Аналогично проблеме нестабильных зависимостей в `useEffect` (🔗 Тема 33) — промис должен быть создан однократно (в Server Component, родителе через `useMemo`, либо через кэширующий data-fetching слой), а не при каждом рендере.

**✅ Паттерн 2: `useActionState` — возвращать явную структуру состояния, а не примитив**

```typescript
// ❌ Плохо: примитив не расширяем — при добавлении нового поля потребуется рефакторинг сигнатуры
const [error, formAction] = useActionState(action, null);

// ✅ Хорошо: объект — легко расширяется полями success/errors/data
const [state, formAction] = useActionState(action, { success: false, errors: {} });
```

*Почему:* Формы часто со временем обрастают дополнительными полями состояния (валидация конкретных полей, флаги успеха) — структурированный объект с самого начала избегает breaking change сигнатуры.

**✅ Паттерн 3: `useOptimistic` — откат должен быть безопасным (без потери данных пользователя)**

```typescript
// ❌ Плохо: оптимистичное добавление комментария без сохранения текста при неудаче
async function handleAddComment(text: string) {
  addOptimisticComment({ text, pending: true });
  setInputValue(''); // текст сразу очищен — при ошибке пользователь теряет то, что написал
  await postComment(text);
}

// ✅ Хорошо: очищать поле ввода только после подтверждённого успеха
async function handleAddComment(text: string) {
  addOptimisticComment({ text, pending: true });
  try {
    await postComment(text);
    setInputValue(''); // очистка только при реальном успехе
  } catch {
    showErrorToast('Не удалось отправить комментарий');
  }
}
```

*Почему:* Оптимистичный UI — обещание пользователю, что действие почти наверняка успешно; при неудаче важно не только откатить визуальное состояние, но и не потерять введённые пользователем данные.

---

## 4. Вопросы интервью

**Q1: Что делает хук `use()` и чем он отличается от `await`?**

`use()` читает значение промиса или контекста прямо во время рендера компонента, приостанавливая рендер до готовности промиса (через механизм Suspense, 🔗 Тема 42) — аналогично тому, как `await` приостанавливает выполнение async-функции. Ключевое отличие: `use()` можно вызывать условно, после раннего `return`, в отличие от всех остальных хуков и в отличие от `await`, к которому в обычных хуках нет доступа (компонент — не async-функция).

**Q2: Почему `use()` можно вызывать условно, а `useState` — нельзя?**

Остальные хуки (`useState`, `useEffect` и т.д.) сопоставляются React с внутренним состоянием по порядковому индексу вызова (🔗 Тема 31) — условный вызов сдвигает индексы. `use()` не хранит состояние по индексу — он напрямую читает переданный ресурс (промис/контекст) без привязки к порядку вызова, поэтому React официально разрешает вызывать его условно.

**Q3: Что произойдёт, если передать в `use()` новый промис на каждом рендере?**

Компонент будет "подвешиваться" (показывать fallback Suspense) повторно на каждом рендере, потому что каждый новый промис интерпретируется как новый асинхронный ресурс, ожидающий разрешения — UI не сможет стабилизироваться. Промис должен создаваться один раз (в родителе, Server Component, или мемоизированный) и передаваться как стабильная ссылка.

**Q4: Чем `useActionState` отличается от обычного `useState` + `async` функции-обработчика?**

`useActionState` автоматически предоставляет `isPending` (статус выполнения асинхронного действия) без ручного управления через отдельный `useState`, и интегрируется с атрибутом `action` HTML-формы напрямую (`<form action={formAction}>`) без необходимости `onSubmit`+`preventDefault`. Также поддерживает прогрессивное улучшение — форма может отправиться даже до полной гидратации JavaScript на клиенте.

**Q5: Как `useActionState` концептуально похож на `useReducer`?**

Оба принимают функцию перехода состояния `(previousState, payload) => newState` и начальное состояние, возвращают текущее состояние. Отличие — функция в `useActionState` асинхронная (возвращает `Promise<newState>`), предназначена специально для form actions/Server Actions, и хук дополнительно возвращает флаг `isPending`.

**Q6: Что делает `useOptimistic` и когда откатывается оптимистичное состояние?**

Позволяет немедленно показать предполагаемый результат действия до получения подтверждения от сервера, улучшая ощущение отзывчивости UI. Откат происходит автоматически, если после завершения асинхронной операции (в рамках которой был вызван setter от `useOptimistic`) базовое состояние (первый аргумент хука) не обновилось соответствующим образом — то есть если реальное действие завершилось без успешного обновления реального state.

**Q7: Может ли `useOptimistic` использоваться без Server Actions?**

Да — `useOptimistic` не привязан жёстко к Server Actions, это универсальный хук для оптимистичных обновлений UI на основе любого асинхронного действия (обычный `fetch`, WebSocket-запрос и т.п.), хотя чаще всего демонстрируется в связке с `useActionState` и Server Actions в Next.js.

**Q8: В чём риск оптимистичного UI без должной обработки ошибок?**

Если асинхронное действие завершается ошибкой, а откат оптимистичного состояния либо не происходит, либо происходит без уведомления пользователя — пользователь может считать, что действие выполнено успешно, хотя на сервере оно не было применено (например, "лайк" визуально остался, хотя запрос на сервер не прошёл). Необходима явная обработка ошибок с уведомлением и гарантированным откатом визуального состояния.

**Q9: Требует ли `use()` обязательного оборачивания в `Suspense`?**

Да, для промисов — если промис, переданный в `use()`, ещё не разрешён, компонент "подвешивается", и родительская граница `Suspense` обязана существовать выше по дереву, чтобы показать `fallback` вместо ошибки. Для контекста (`use(SomeContext)`) `Suspense` не требуется — это синхронная операция, аналогичная `useContext`.

**Q10: Какую проблему в целом решает эта группа хуков React 19 по сравнению с подходами React 18?**

Уменьшение количества ручного бойлерплейта для трёх частых асинхронных сценариев: чтение уже запущенного асинхронного ресурса в рендере (`use`), управление состоянием отправки формы/действия (`useActionState`), мгновенный оптимистичный отклик UI (`useOptimistic`) — ранее все три требовали комбинации `useState`+`useEffect`+ручной обработки ошибок и состояний загрузки.

---

## 5. Практическое задание

Реализуй компонент `LikeButton`, использующий `useOptimistic` для лайка/дизлайка с откатом при ошибке сервера:

1. `toggleLikeOnServer(id: string): Promise<{ success: boolean }>` — имитация запроса (случайно возвращает `success: false` в ~30% случаев для демонстрации отката).
2. При клике — немедленное визуальное переключение состояния лайка через `useOptimistic`.
3. При неудаче сервера — визуальный откат и показ сообщения об ошибке (не просто "тихий" откат).
4. Кнопка должна быть заблокирована на время ожидания ответа сервера для конкретного элемента.

---

## 6. Решение с инсайтом

```typescript
import { useState, useOptimistic, useTransition } from 'react';

interface LikeState {
  liked: boolean;
  count: number;
}

async function toggleLikeOnServer(id: string, nextLiked: boolean): Promise<{ success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 600)); // имитация сетевой задержки
  const success = Math.random() > 0.3; // ~30% случаев — имитация ошибки сервера
  return { success };
}

function LikeButton({ postId, initialLiked, initialCount }: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [realState, setRealState] = useState<LikeState>({ liked: initialLiked, count: initialCount });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition(); // блокировка кнопки на время запроса

  const [optimisticState, setOptimisticLike] = useOptimistic(
    realState,
    (current: LikeState, nextLiked: boolean): LikeState => ({
      liked: nextLiked,
      count: current.count + (nextLiked ? 1 : -1), // мгновенный пересчёт счётчика
    })
  );

  function handleToggle() {
    const nextLiked = !optimisticState.liked;
    setErrorMessage(null);

    startTransition(async () => {
      setOptimisticLike(nextLiked); // немедленное визуальное обновление

      const result = await toggleLikeOnServer(postId, nextLiked);

      if (result.success) {
        // Подтверждаем реальное состояние — optimisticState станет совпадать с realState
        setRealState({ liked: nextLiked, count: realState.count + (nextLiked ? 1 : -1) });
      } else {
        // realState НЕ обновлён → useOptimistic автоматически откатит optimisticState к realState
        setErrorMessage('Не удалось сохранить лайк. Попробуйте снова.');
      }
    });
  }

  return (
    <div>
      <button onClick={handleToggle} disabled={isPending}>
        {optimisticState.liked ? '❤️' : '🤍'} {optimisticState.count}
      </button>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
}

export default LikeButton;
```

> **Инсайт:** Откат `optimisticState` происходит автоматически именно потому, что `realState` не был обновлён в ветке ошибки — `useOptimistic` всегда вычисляет отображаемое значение как "текущий realState + непримененные оптимистичные обновления", и как только `transition` завершается без обновления `realState`, оптимистичный слой "тает", возвращая пользователя к последнему подтверждённому состоянию. Именно поэтому обёртка в `startTransition` обязательна: без неё React не будет знать, когда именно завершилось асинхронное действие, чтобы корректно определить момент отката (🔗 Тема 38 — тот же механизм transition, что и в useTransition).

---

*Раздел 12 — Конкурентные и специализированные хуки · Тема 40 из 43*
